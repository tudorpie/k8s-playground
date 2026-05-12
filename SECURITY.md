# security

## scope

this repo is a personal demonstration project. the live deployment at
`https://puiemrazvan.momentan.fun` is operated from one mac with no
on-call rotation. if the site is unreachable, it is intentional or
temporary.

the security claims in this repo apply to:

- the runtime container image (distroless, non-root, no shell)
- the kubernetes manifests in `k8s/`
- the public-facing path (cloudflare tunnel + ingress-nginx)
- the admin path (tailscale → kubeapi)

they do not apply to:

- the host macOS configuration
- the user's cloudflare account separately from the API token scopes
  documented in the README
- any forks or modifications

## threat model summary

the deployment is designed to defend against:

| threat                                            | mitigation                                                 |
|---------------------------------------------------|------------------------------------------------------------|
| direct probing of the home network               | no inbound router ports; cloudflare tunnel is outbound-only |
| common automated scanners on the public URL      | nginx-ingress server-snippet UA filter + rate limit         |
| supply-chain CVEs in base images / deps          | trivy image gate (HIGH/CRITICAL) on every CI run            |
| compromised app pod pivoting in the cluster      | ServiceAccount token not mounted; default-deny NetworkPolicy |
| compromised app pod escaping to the host         | distroless, read-only root, capabilities.drop:[ALL], PSA restricted |
| credential leakage in the repo                   | gitleaks gate on every push (current + full history)        |
| browser-side XSS exfiltration                    | strict CSP with per-request nonce, no `unsafe-eval`, no `*` |
| public exposure of the control plane             | kubeapi bound to docker loopback; tailnet-only via tailscale |

the deployment does **not** defend against:

- a compromise of the operator's mac, or the operator's cloudflare account
- network-layer attacks against the cloudflare edge itself
- attacks on the supply chain that change the actual published bytes of a
  pinned image tag (we do not currently verify by digest)

## what we don't do

- no vulnerability disclosure programme; this is a personal project
- no SLA; no uptime guarantee
- no formal security review

## reporting

for issues that are not security-sensitive, open a github issue:
<https://github.com/tudorpie/k8s-playground/issues>.

for issues that are security-sensitive (e.g. a credential committed by
accident, a misconfiguration that exposes the operator's mac), please
open a github issue marked `security` or contact the maintainer
directly via the repo's discussions tab. do not disclose publicly until
the issue is addressed.

## supply chain notes

- runtime base: `gcr.io/distroless/nodejs20-debian12:nonroot`
- builder base: `node:20-alpine`
- pinned by tag, not digest. for production use, pin by digest and
  rotate on a schedule.
- `pnpm-lock.yaml` is committed; CI uses `pnpm install --frozen-lockfile`.
- gitleaks runs on the current tree and the full git history in CI.
