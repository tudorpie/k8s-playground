#!/bin/bash
set -euo pipefail

CLUSTER="${CLUSTER:-k8s-playground}"
HERE="$(cd "$(dirname "$0")" && pwd)"

if [ -f .cloudflared.state ] && [ -n "${CLOUDFLARE_API_TOKEN:-}" ]; then
  echo "[down] destroying cloudflare tunnel + DNS"
  bash "${HERE}/cf-tunnel-destroy.sh" || echo "[down] tunnel destroy failed (continuing)"
elif [ -f .cloudflared.state ]; then
  echo "[down] CLOUDFLARE_API_TOKEN not set — leaving cloudflare resources alone"
fi

if k3d cluster list -o json 2>/dev/null | jq -e ".[] | select(.name==\"${CLUSTER}\")" >/dev/null 2>&1; then
  echo "[down] deleting k3d cluster '${CLUSTER}'"
  k3d cluster delete "${CLUSTER}"
else
  echo "[down] cluster '${CLUSTER}' not found"
fi

rm -f cloudflared-token.txt 2>/dev/null || true
echo "[down] done"
