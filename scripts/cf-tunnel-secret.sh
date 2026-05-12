#!/bin/bash
set -euo pipefail

NAMESPACE="${NAMESPACE:-k8s-playground}"
TOKEN_FILE="${TOKEN_FILE:-cloudflared-token.txt}"

if [ -n "${CLOUDFLARE_TUNNEL_TOKEN:-}" ]; then
  TOKEN="${CLOUDFLARE_TUNNEL_TOKEN}"
elif [ -f "$TOKEN_FILE" ]; then
  TOKEN=$(cat "$TOKEN_FILE")
else
  echo "[secret] need CLOUDFLARE_TUNNEL_TOKEN env or ${TOKEN_FILE} on disk" >&2
  exit 1
fi

if ! kubectl get namespace "$NAMESPACE" >/dev/null 2>&1; then
  kubectl create namespace "$NAMESPACE" >/dev/null
fi

kubectl -n "$NAMESPACE" create secret generic cloudflared-token \
  --from-literal=token="$TOKEN" \
  --dry-run=client -o yaml | kubectl apply -f - >/dev/null

echo "[secret] secret 'cloudflared-token' applied in namespace '$NAMESPACE'"
