#!/bin/bash
set -euo pipefail

NAMESPACE="${NAMESPACE:-k8s-playground}"

echo "== cluster =="
k3d cluster list || true

echo
echo "== nodes =="
kubectl get nodes -o wide || true

echo
echo "== pods (${NAMESPACE}) =="
kubectl -n "${NAMESPACE}" get pods -o wide 2>/dev/null || echo "(namespace not present)"

echo
echo "== services / ingress =="
kubectl -n "${NAMESPACE}" get svc,ingress 2>/dev/null || true

echo
echo "== tunnel state =="
if [ -f .cloudflared.state ]; then
  grep -E '^(TUNNEL_ID|TUNNEL_NAME|RECORD_ID|ZONE_ID|ACCOUNT_ID|HOSTNAME)=' .cloudflared.state || true
else
  echo "no .cloudflared.state (tunnel not created yet)"
fi

echo
echo "== app logs (last 30) =="
kubectl -n "${NAMESPACE}" logs deploy/k8s-playground --tail=30 2>/dev/null || echo "(no logs)"

echo
echo "== cloudflared logs (last 15) =="
kubectl -n "${NAMESPACE}" logs deploy/cloudflared --tail=15 2>/dev/null || echo "(no logs)"
