# syntax=docker/dockerfile:1.7

# -----------------------------------------------------------------------------
# stage 1: install dependencies (cached layer)
# Note: pnpm 11.x requires Node 22+ (it imports node:sqlite). The builder
# therefore uses node:22-alpine; the runtime stays on node 20 LTS via the
# distroless image below.
# -----------------------------------------------------------------------------
FROM node:22-alpine AS deps
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile --prod=false

# -----------------------------------------------------------------------------
# stage 2: build the next.js app (standalone output)
# -----------------------------------------------------------------------------
FROM node:22-alpine AS builder
WORKDIR /app
RUN corepack enable
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

# -----------------------------------------------------------------------------
# stage 3: runtime (distroless, non-root, no shell, no package manager)
# -----------------------------------------------------------------------------
FROM gcr.io/distroless/nodejs20-debian12:nonroot AS runtime

ARG DEDICATION="Muie Razvan"
ENV DEDICATION_LABEL=${DEDICATION}

LABEL dedication=${DEDICATION}
LABEL org.opencontainers.image.title="k8s-playground"
LABEL org.opencontainers.image.description="k3d + cloudflare tunnel + tailscale demo (arm64)"
LABEL org.opencontainers.image.source="https://github.com/tudorpie/k8s-playground"
LABEL org.opencontainers.image.licenses="MIT"

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

WORKDIR /app

# Standalone output bundles only what the server needs.
COPY --from=builder --chown=nonroot:nonroot /app/.next/standalone ./
COPY --from=builder --chown=nonroot:nonroot /app/.next/static ./.next/static
COPY --from=builder --chown=nonroot:nonroot /app/public ./public

EXPOSE 3000
USER nonroot

# distroless nodejs entrypoint is /nodejs/bin/node; CMD becomes the script.
# HEALTHCHECK runs the same node binary outside the entrypoint chain.
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD ["/nodejs/bin/node", "-e", "fetch('http://127.0.0.1:3000/api/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"]

CMD ["server.js"]
