#!/bin/bash
set -euo pipefail

IMAGE="${IMAGE:-k8s-playground:local}"
FAIL=0

echo "[scan] trivy image ${IMAGE} (gate HIGH/CRITICAL)"
if ! trivy image \
    --severity HIGH,CRITICAL \
    --exit-code 1 \
    --ignore-unfixed \
    --no-progress \
    "${IMAGE}"; then
  FAIL=1
fi

echo
echo "[scan] trivy config k8s/ (report only)"
trivy config --severity HIGH,CRITICAL --exit-code 0 --no-progress k8s/ || true

echo
echo "[scan] trivy fs . (report only)"
trivy fs \
  --severity HIGH,CRITICAL \
  --exit-code 0 \
  --no-progress \
  --skip-dirs node_modules \
  --skip-dirs .next \
  --skip-dirs .git \
  . || true

if [ "$FAIL" -ne 0 ]; then
  echo
  echo "[scan] image scan failed — see report above"
  exit 1
fi
echo
echo "[scan] clean (image gate passed)"
