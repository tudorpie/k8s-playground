#!/bin/bash
set -euo pipefail

: "${CLOUDFLARE_API_TOKEN:?need CLOUDFLARE_API_TOKEN (scopes: Zone.DNS, Zone.Zone.Read, Account.Cloudflare Tunnel)}"

TUNNEL_NAME="${TUNNEL_NAME:-k8s-playground}"
HOSTNAME_PUBLIC="${HOSTNAME_PUBLIC:-puiemrazvan.momentan.fun}"
ZONE="${ZONE:-momentan.fun}"
ORIGIN_SERVICE="${ORIGIN_SERVICE:-http://ingress-nginx-controller.ingress-nginx.svc.cluster.local:80}"
STATE_FILE="${STATE_FILE:-.cloudflared.state}"
TOKEN_FILE="${TOKEN_FILE:-cloudflared-token.txt}"

API="https://api.cloudflare.com/client/v4"
AUTH=(-H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" -H "Content-Type: application/json")

cf() { curl -sS "${AUTH[@]}" "$@"; }

require_success() {
  local res="$1" label="$2"
  if [ "$(echo "$res" | jq -r '.success')" != "true" ]; then
    echo "[tunnel] ${label} failed:" >&2
    echo "$res" | jq -c '.errors' >&2
    exit 1
  fi
}

echo "[tunnel] resolving account id"
ACC_RES=$(cf "$API/accounts")
require_success "$ACC_RES" "list accounts"
ACCOUNT_ID=$(echo "$ACC_RES" | jq -r '.result[0].id')
echo "[tunnel] account: $ACCOUNT_ID"

echo "[tunnel] resolving zone id for $ZONE"
ZONE_RES=$(cf "$API/zones?name=${ZONE}")
require_success "$ZONE_RES" "list zones"
ZONE_ID=$(echo "$ZONE_RES" | jq -r '.result[0].id')
if [ -z "$ZONE_ID" ] || [ "$ZONE_ID" = "null" ]; then
  echo "[tunnel] zone $ZONE not visible to this token" >&2
  exit 1
fi
echo "[tunnel] zone: $ZONE_ID"

# Reuse if a tunnel by this name already exists.
EX_RES=$(cf "$API/accounts/$ACCOUNT_ID/cfd_tunnel?name=${TUNNEL_NAME}&is_deleted=false")
require_success "$EX_RES" "list tunnels"
TUNNEL_ID=$(echo "$EX_RES" | jq -r '.result[0].id // empty')

if [ -n "$TUNNEL_ID" ]; then
  echo "[tunnel] reusing existing tunnel '$TUNNEL_NAME' ($TUNNEL_ID)"
  TOK_RES=$(cf "$API/accounts/$ACCOUNT_ID/cfd_tunnel/$TUNNEL_ID/token")
  require_success "$TOK_RES" "fetch token"
  TOKEN=$(echo "$TOK_RES" | jq -r '.result')
else
  echo "[tunnel] creating tunnel '$TUNNEL_NAME'"
  NEW_RES=$(cf -X POST "$API/accounts/$ACCOUNT_ID/cfd_tunnel" \
    -d "$(jq -nc --arg n "$TUNNEL_NAME" '{name:$n, config_src:"cloudflare"}')")
  require_success "$NEW_RES" "create tunnel"
  TUNNEL_ID=$(echo "$NEW_RES" | jq -r '.result.id')
  TOKEN=$(echo "$NEW_RES" | jq -r '.result.token')
fi
echo "[tunnel] tunnel id: $TUNNEL_ID"

echo "[tunnel] writing ingress configuration"
CFG_RES=$(cf -X PUT "$API/accounts/$ACCOUNT_ID/cfd_tunnel/$TUNNEL_ID/configurations" \
  -d "$(jq -nc \
    --arg h "$HOSTNAME_PUBLIC" \
    --arg s "$ORIGIN_SERVICE" '{
      config: {
        ingress: [
          { hostname: $h, service: $s, originRequest: { connectTimeout: "10s", noTLSVerify: true, httpHostHeader: $h } },
          { service: "http_status:404" }
        ]
      }
    }')")
require_success "$CFG_RES" "write configuration"

DNS_TARGET="${TUNNEL_ID}.cfargotunnel.com"

echo "[tunnel] applying DNS record for $HOSTNAME_PUBLIC"
DNS_LIST=$(cf "$API/zones/$ZONE_ID/dns_records?name=${HOSTNAME_PUBLIC}&type=CNAME")
require_success "$DNS_LIST" "list dns"
RECORD_ID=$(echo "$DNS_LIST" | jq -r '.result[0].id // empty')

if [ -n "$RECORD_ID" ]; then
  echo "[tunnel] updating existing CNAME → $DNS_TARGET"
  UPD=$(cf -X PATCH "$API/zones/$ZONE_ID/dns_records/$RECORD_ID" \
    -d "$(jq -nc \
      --arg c "$DNS_TARGET" --arg n "$HOSTNAME_PUBLIC" \
      '{type:"CNAME", name:$n, content:$c, proxied:true, ttl:1}')")
  require_success "$UPD" "patch dns"
else
  echo "[tunnel] creating CNAME $HOSTNAME_PUBLIC → $DNS_TARGET"
  CRT=$(cf -X POST "$API/zones/$ZONE_ID/dns_records" \
    -d "$(jq -nc \
      --arg c "$DNS_TARGET" --arg n "$HOSTNAME_PUBLIC" \
      '{type:"CNAME", name:$n, content:$c, proxied:true, ttl:1}')")
  require_success "$CRT" "create dns"
  RECORD_ID=$(echo "$CRT" | jq -r '.result.id')
fi
echo "[tunnel] DNS record id: $RECORD_ID"

umask 077
cat > "$STATE_FILE" <<EOF
ACCOUNT_ID=${ACCOUNT_ID}
ZONE_ID=${ZONE_ID}
TUNNEL_NAME=${TUNNEL_NAME}
TUNNEL_ID=${TUNNEL_ID}
RECORD_ID=${RECORD_ID}
HOSTNAME=${HOSTNAME_PUBLIC}
EOF

printf '%s' "$TOKEN" > "$TOKEN_FILE"
echo "[tunnel] token → $TOKEN_FILE (gitignored)"
echo "[tunnel] public URL: https://${HOSTNAME_PUBLIC}"
