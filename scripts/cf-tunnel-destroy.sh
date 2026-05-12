#!/bin/bash
set -euo pipefail

STATE_FILE="${STATE_FILE:-.cloudflared.state}"
if [ ! -f "$STATE_FILE" ]; then
  echo "[destroy] no $STATE_FILE — nothing to destroy"
  exit 0
fi
# shellcheck disable=SC1090
. "$STATE_FILE"

: "${CLOUDFLARE_API_TOKEN:?need CLOUDFLARE_API_TOKEN}"

API="https://api.cloudflare.com/client/v4"
AUTH=(-H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" -H "Content-Type: application/json")

if [ -n "${RECORD_ID:-}" ] && [ -n "${ZONE_ID:-}" ]; then
  echo "[destroy] deleting DNS record $RECORD_ID"
  curl -sS -X DELETE "${AUTH[@]}" "$API/zones/$ZONE_ID/dns_records/$RECORD_ID" \
    | jq -r '.success' || true
fi

if [ -n "${TUNNEL_ID:-}" ] && [ -n "${ACCOUNT_ID:-}" ]; then
  echo "[destroy] cleaning tunnel connections + deleting tunnel $TUNNEL_ID"
  curl -sS -X DELETE "${AUTH[@]}" "$API/accounts/$ACCOUNT_ID/cfd_tunnel/$TUNNEL_ID/connections" >/dev/null || true
  curl -sS -X DELETE "${AUTH[@]}" "$API/accounts/$ACCOUNT_ID/cfd_tunnel/$TUNNEL_ID" \
    | jq -r '.success' || true
fi

rm -f "$STATE_FILE" cloudflared-token.txt
echo "[destroy] done"
