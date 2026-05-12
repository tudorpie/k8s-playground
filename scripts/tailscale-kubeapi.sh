#!/bin/bash
set -euo pipefail

API_PORT="${API_PORT:-6443}"

if ! command -v tailscale >/dev/null 2>&1; then
  echo "[ts] tailscale not installed" >&2
  exit 1
fi

if ! tailscale status >/dev/null 2>&1; then
  echo "[ts] tailscale not connected — run 'tailscale up' first" >&2
  exit 1
fi

echo "[ts] exposing kubeapi (localhost:${API_PORT}) on this device's tailnet hostname"
tailscale serve --bg "https+insecure://localhost:${API_PORT}"

HOST=$(tailscale status --self --json | jq -r '.Self.DNSName' | sed 's/\.$//')

echo
echo "[ts] kubeconfig server URL for tailnet clients:"
echo "      https://${HOST}/"
echo
echo "[ts] export a tailnet kubeconfig:"
echo "      kubectl config view --raw \\"
echo "        | sed 's|server: https://127.0.0.1:${API_PORT}|server: https://${HOST}|' \\"
echo "        > kubeconfig-tailnet.yaml"
echo
echo "[ts] to undo this:"
echo "      tailscale serve --https=443 off"
