#!/bin/bash
set -euo pipefail

NAMESPACE="${NAMESPACE:-k8s-playground}"
PUBLIC_URL="${PUBLIC_URL:-https://puiemrazvan.momentan.fun}"

echo "[deploy] kubectl apply -k k8s/"
kubectl apply -k k8s/

if kubectl -n "${NAMESPACE}" get secret cloudflared-token >/dev/null 2>&1; then
  echo "[deploy] waiting for cloudflared rollout"
  kubectl rollout status -n "${NAMESPACE}" deploy/cloudflared --timeout=120s
else
  echo "[deploy] note: secret 'cloudflared-token' missing — run 'make tunnel' first"
fi

echo "[deploy] waiting for app rollout"
kubectl rollout status -n "${NAMESPACE}" deploy/k8s-playground --timeout=180s

echo
echo "[deploy] public URL: ${PUBLIC_URL}"
echo "[deploy] local test:"
echo "          curl -H 'Host: puiemrazvan.momentan.fun' http://localhost:8080/api/health"
