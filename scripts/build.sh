#!/bin/bash
set -euo pipefail

CLUSTER="${CLUSTER:-k8s-playground}"
IMAGE="${IMAGE:-k8s-playground:local}"
PLATFORM="${PLATFORM:-linux/arm64}"

echo "[build] docker buildx build --platform ${PLATFORM} -t ${IMAGE}"
docker buildx build \
  --platform "${PLATFORM}" \
  --load \
  -t "${IMAGE}" \
  -f Dockerfile \
  .

SIZE_BYTES=$(docker image inspect "${IMAGE}" --format='{{.Size}}')
SIZE_MB=$(( SIZE_BYTES / 1024 / 1024 ))
echo "[build] image size: ${SIZE_MB} MB"
if [ "${SIZE_MB}" -gt 150 ]; then
  echo "[build] WARNING: image exceeds the 150 MB budget"
fi

if k3d cluster list -o json 2>/dev/null | jq -e ".[] | select(.name==\"${CLUSTER}\")" >/dev/null 2>&1; then
  echo "[build] importing image into k3d cluster '${CLUSTER}'"
  k3d image import "${IMAGE}" --cluster "${CLUSTER}"
else
  echo "[build] cluster '${CLUSTER}' not found — image built but not imported"
fi
