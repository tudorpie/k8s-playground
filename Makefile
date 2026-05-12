.PHONY: help all up build tunnel deploy down status verify scan clean install lint typecheck dev tailscale-kubeapi

help:
	@echo "make install        pnpm install"
	@echo "make dev            pnpm dev (local Next.js)"
	@echo "make lint           pnpm lint (--max-warnings=0)"
	@echo "make typecheck      tsc --noEmit"
	@echo ""
	@echo "make up             create k3d cluster + install ingress-nginx"
	@echo "make build          build linux/arm64 image + import to k3d"
	@echo "make tunnel         create cloudflare tunnel + DNS + secret"
	@echo "make deploy         kubectl apply -k k8s/"
	@echo "make all            up + build + tunnel + deploy"
	@echo ""
	@echo "make verify         programmatic security checks"
	@echo "make scan           trivy image + manifest + fs"
	@echo "make status         cluster + pods + tunnel + last logs"
	@echo "make tailscale-kubeapi  expose kubeapi to the tailnet"
	@echo ""
	@echo "make down           delete cluster + cloudflare tunnel + DNS"
	@echo "make clean          remove local node_modules and .next"

all: up build tunnel deploy
	@echo
	@echo "next: make verify"

install:
	pnpm install

dev:
	pnpm dev

lint:
	pnpm lint

typecheck:
	pnpm typecheck

up:
	bash scripts/up.sh

build:
	bash scripts/build.sh

tunnel:
	bash scripts/tunnel-up.sh

deploy:
	bash scripts/deploy.sh

down:
	bash scripts/down.sh

status:
	bash scripts/status.sh

verify:
	bash scripts/verify.sh

scan:
	bash scripts/scan.sh

tailscale-kubeapi:
	bash scripts/tailscale-kubeapi.sh

clean:
	rm -rf node_modules .next out
