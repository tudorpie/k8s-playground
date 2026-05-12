#!/bin/bash
set -uo pipefail

NAMESPACE="${NAMESPACE:-k8s-playground}"
PUBLIC_URL="${PUBLIC_URL:-https://puiemrazvan.momentan.fun}"
PUBLIC_HOST=$(echo "${PUBLIC_URL}" | sed -E 's#https?://##' | cut -d/ -f1)

# macOS's resolver caches negative DNS lookups aggressively. If the system
# resolver can't see the hostname yet but a public resolver can (DNS was
# created recently), fall back to --resolve.
RESOLVE_ARG=""
if ! getent hosts "${PUBLIC_HOST}" >/dev/null 2>&1 && ! host "${PUBLIC_HOST}" >/dev/null 2>&1; then
  CF_IP=$(dig +short @1.1.1.1 "${PUBLIC_HOST}" 2>/dev/null | head -1)
  if [ -n "${CF_IP}" ]; then
    RESOLVE_ARG="--resolve ${PUBLIC_HOST}:443:${CF_IP}"
  fi
fi
curl_public() {
  # shellcheck disable=SC2086
  curl ${RESOLVE_ARG} "$@"
}
PASS=0
FAIL=0
COL_RESET=$(printf '\033[0m')
COL_OK=$(printf '\033[32m')
COL_BAD=$(printf '\033[31m')
COL_DIM=$(printf '\033[2m')

pass() { printf "  ${COL_OK}OK${COL_RESET}   %s\n" "$1"; PASS=$((PASS + 1)); }
fail() { printf "  ${COL_BAD}FAIL${COL_RESET} %s\n" "$1"; FAIL=$((FAIL + 1)); }
skip() { printf "  ${COL_DIM}SKIP${COL_RESET} %s\n" "$1"; }
header() { printf "\n${COL_DIM}== %s ==${COL_RESET}\n" "$1"; }

# ---------------------------------------------------------------------------
# Distroless has no `id` binary; use the embedded Node to read the uid.
header "pod identity"
ID_OUT=$(kubectl exec -n "${NAMESPACE}" deploy/k8s-playground -- /nodejs/bin/node -e "console.log('uid='+process.getuid()+' gid='+process.getgid())" 2>&1 || true)
if echo "$ID_OUT" | grep -q "uid=65532"; then
  pass "pod ${ID_OUT}"
else
  fail "expected uid=65532; got: ${ID_OUT}"
fi

# ---------------------------------------------------------------------------
header "no shell present"
if kubectl exec -n "${NAMESPACE}" deploy/k8s-playground -- /bin/sh -c "true" >/dev/null 2>&1; then
  fail "/bin/sh executed in pod (should be absent)"
else
  pass "/bin/sh absent in distroless runtime"
fi
if kubectl exec -n "${NAMESPACE}" deploy/k8s-playground -- /bin/bash -c "true" >/dev/null 2>&1; then
  fail "/bin/bash executed in pod (should be absent)"
else
  pass "/bin/bash absent"
fi

# ---------------------------------------------------------------------------
header "no serviceaccount token mounted"
if kubectl exec -n "${NAMESPACE}" deploy/k8s-playground -- ls /var/run/secrets/kubernetes.io/serviceaccount/token >/dev/null 2>&1; then
  fail "serviceaccount token is mounted (should not be)"
else
  pass "no serviceaccount token in pod"
fi

# ---------------------------------------------------------------------------
header "NetworkPolicy: probe from 'default' namespace is blocked"
PROBE_OUT=$(kubectl run probe-deny --rm -i --tty=false --image=curlimages/curl:8.10.1 \
  --restart=Never -n default --quiet \
  -- -m 4 -sS -o /dev/null -w "%{http_code}" \
  "http://k8s-playground.k8s-playground.svc.cluster.local" 2>&1 || true)
if echo "$PROBE_OUT" | grep -qE "timeout|refused|Could not|^000"; then
  pass "probe blocked"
else
  fail "probe returned: ${PROBE_OUT}"
fi

# ---------------------------------------------------------------------------
header "PSA rejects sample-bad pod (server dry-run)"
APPLY_OUT=$(kubectl apply -f tests/sample-bad/pod-privileged.yaml --dry-run=server 2>&1 || true)
if echo "$APPLY_OUT" | grep -qiE "PodSecurity|forbidden|violates"; then
  pass "PSA rejected the manifest"
else
  fail "expected rejection; got: ${APPLY_OUT}"
fi

# ---------------------------------------------------------------------------
header "scanner paths on public URL"
for path in "/.env" "/admin" "/wp-login.php" "/.git/config" "/phpinfo.php"; do
  code=$(curl_public -ksS -o /dev/null -w "%{http_code}" -m 5 "${PUBLIC_URL}${path}" 2>/dev/null || echo "000")
  if [ "$code" = "404" ] || [ "$code" = "000" ]; then
    pass "${path} → ${code}"
  else
    fail "${path} → ${code} (expected 404 or no-response)"
  fi
done

# ---------------------------------------------------------------------------
header "security headers"
HDRS=$(curl_public -ksI -m 5 "${PUBLIC_URL}/" 2>/dev/null || true)
if [ -z "$HDRS" ]; then
  skip "no response from ${PUBLIC_URL} — tunnel down?"
else
  for h in "content-security-policy" "strict-transport-security" "x-frame-options" "x-content-type-options" "referrer-policy" "permissions-policy"; do
    if echo "$HDRS" | tr -d '\r' | grep -qi "^${h}:"; then
      pass "${h}"
    else
      fail "${h} missing"
    fi
  done

  CSP=$(echo "$HDRS" | tr -d '\r' | grep -i "^content-security-policy:" | head -1)
  if echo "$CSP" | grep -q "unsafe-eval"; then
    fail "CSP contains 'unsafe-eval'"
  else
    pass "CSP has no 'unsafe-eval'"
  fi
  if echo "$CSP" | grep -qE "[[:space:]]\\*([[:space:]]|;|$)"; then
    fail "CSP contains wildcard"
  else
    pass "CSP has no wildcard"
  fi
fi

# ---------------------------------------------------------------------------
header "cloudflared pods Ready"
READY=$(kubectl -n "${NAMESPACE}" get pods -l app=cloudflared \
  -o jsonpath='{range .items[*]}{.status.containerStatuses[*].ready}{","}{end}' 2>/dev/null || echo "")
if [ -z "$READY" ]; then
  skip "no cloudflared pods (tunnel not deployed)"
elif echo "$READY" | grep -q "false"; then
  fail "some cloudflared containers not ready (${READY})"
else
  pass "all cloudflared containers ready"
fi

# ---------------------------------------------------------------------------
header "kubeapi not reachable on public IP"
PUBIP=$(curl -s -m 4 https://api.ipify.org 2>/dev/null || echo "")
if [ -z "$PUBIP" ]; then
  skip "no public IP detected"
elif ! command -v nc >/dev/null 2>&1; then
  skip "nc not installed"
elif nc -z -w 3 "$PUBIP" 6443 2>/dev/null; then
  fail "kubeapi reachable on ${PUBIP}:6443"
else
  pass "kubeapi closed on ${PUBIP}:6443"
fi

# ---------------------------------------------------------------------------
header "/hunt/peek exposes dedication via downward API + ENV"
PEEK=$(curl_public -ksS -m 5 "${PUBLIC_URL}/hunt/peek" 2>/dev/null || echo "{}")
if echo "$PEEK" | jq -e '.annotations["dedication.k8s-playground.io/to"]' >/dev/null 2>&1; then
  pass "annotation visible"
else
  fail "annotation missing from /hunt/peek"
fi
LABEL=$(echo "$PEEK" | jq -r '.dockerfile_label // empty' 2>/dev/null || echo "")
if [ -n "$LABEL" ] && [ "$LABEL" != "null" ]; then
  pass "dockerfile_label=${LABEL}"
else
  fail "dockerfile_label missing from /hunt/peek"
fi

# ---------------------------------------------------------------------------
echo
echo "==================================="
printf "  passed: %d   failed: %d\n" "$PASS" "$FAIL"
echo "==================================="
[ "$FAIL" -eq 0 ]
