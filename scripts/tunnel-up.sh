#!/bin/bash
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
NAMESPACE="${NAMESPACE:-k8s-playground}"

# Ensure the namespace exists so the Secret has a home before deploy.
kubectl get namespace "$NAMESPACE" >/dev/null 2>&1 || kubectl create namespace "$NAMESPACE" >/dev/null

bash "$HERE/cf-tunnel-create.sh"
bash "$HERE/cf-tunnel-secret.sh"
