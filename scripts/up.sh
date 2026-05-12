#!/bin/bash
set -euo pipefail

CLUSTER="${CLUSTER:-k8s-playground}"
K3S_VERSION="${K3S_VERSION:-v1.31.5-k3s1}"
API_PORT="${API_PORT:-6443}"
HTTP_PORT="${HTTP_PORT:-8080}"
HTTPS_PORT="${HTTPS_PORT:-8443}"

if k3d cluster list -o json 2>/dev/null | jq -e ".[] | select(.name==\"${CLUSTER}\")" >/dev/null 2>&1; then
  echo "[up] cluster '${CLUSTER}' already exists"
else
  echo "[up] creating k3d cluster '${CLUSTER}'"
  k3d cluster create "${CLUSTER}" \
    --servers 1 \
    --agents 1 \
    --image "rancher/k3s:${K3S_VERSION}" \
    --api-port "127.0.0.1:${API_PORT}" \
    --port "${HTTP_PORT}:80@loadbalancer" \
    --port "${HTTPS_PORT}:443@loadbalancer" \
    --k3s-arg "--disable=traefik@server:*" \
    --wait
fi

kubectl config use-context "k3d-${CLUSTER}" >/dev/null
kubectl wait --for=condition=Ready nodes --all --timeout=120s

# kube-system label for the NetworkPolicy egress allowance.
kubectl label namespace kube-system kubernetes.io/metadata.name=kube-system --overwrite >/dev/null

echo "[up] installing ingress-nginx (helm)"
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx >/dev/null 2>&1 || true
helm repo update >/dev/null

# allowSnippetAnnotations is enabled deliberately so server-snippet works for
# scanner-UA blocking. In a multi-tenant cluster this trade-off would be
# revisited; this is a single-tenant demo.
helm upgrade --install ingress-nginx ingress-nginx/ingress-nginx \
  --namespace ingress-nginx \
  --create-namespace \
  --set controller.service.type=LoadBalancer \
  --set controller.admissionWebhooks.enabled=false \
  --set controller.allowSnippetAnnotations=true \
  --set controller.config.annotations-risk-level=Critical \
  --set controller.config.use-forwarded-headers=true \
  --set controller.config.compute-full-forwarded-for=true \
  --set controller.config.proxy-body-size=1m \
  --set controller.config.server-tokens=false \
  --wait \
  --timeout 5m

kubectl label namespace ingress-nginx kubernetes.io/metadata.name=ingress-nginx --overwrite >/dev/null

echo
echo "[up] cluster '${CLUSTER}' ready"
echo "[up] ingress accessible on http://localhost:${HTTP_PORT} (use Host: puiemrazvan.momentan.fun)"
echo "[up] kubeapi on https://127.0.0.1:${API_PORT}"
