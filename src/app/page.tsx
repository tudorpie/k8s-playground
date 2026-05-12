import Link from "next/link";
import { ArchitectureSVG } from "./_components/ArchitectureSVG";
import { Counter } from "./_components/Counter";
import { KonamiOverlay } from "./_components/KonamiOverlay";

export default function Home() {
  return (
    <main className="mx-auto max-w-[960px] px-5 py-10 sm:px-7 sm:py-14">
      <KonamiOverlay />
      <Hero />
      <Section title="the stack">
        <StackTable />
      </Section>
      <Section title="how traffic flows">
        <TrafficFlow />
      </Section>
      <Section title="local setup">
        <LocalSetup />
      </Section>
      <Section title="why cloudflare tunnel and not [x]">
        <WhyCloudflare />
      </Section>
      <Section title="why tailscale for kubeapi">
        <WhyTailscale />
      </Section>
      <Section title="security tour">
        <SecurityTour />
      </Section>
      <Section title="architecture">
        <ArchitectureSection />
      </Section>
      <Section title="what's deliberately missing">
        <Missing />
      </Section>
      <Footer />
    </main>
  );
}

function Hero() {
  return (
    <header className="mb-12">
      <pre className="!border-0 !border-l-0 !bg-transparent !p-0 text-accent text-xs sm:text-sm leading-tight">
{`  ┌─────────────────────────────────────────────────────────────┐
  │  k8s-playground                                             │
  │  k3d + cloudflare tunnel + tailscale on apple silicon       │
  └─────────────────────────────────────────────────────────────┘`}
      </pre>
      <p className="mt-5 text-fg-bright leading-relaxed">
        a small, deliberately hardened demo of running kubernetes locally on
        apple silicon and exposing one service publicly without opening a single
        inbound port. cloneable, deployable, and tear-downable in an afternoon.
      </p>
      <p className="mt-2 text-fg-dim text-xs">
        public:{" "}
        <a href="https://puiemrazvan.momentan.fun">
          https://puiemrazvan.momentan.fun
        </a>{" "}
        &middot; source:{" "}
        <a href="https://github.com/tudorpie/k8s-playground">
          github.com/tudorpie/k8s-playground
        </a>
      </p>
    </header>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-12">
      <h2 className="text-accent text-base sm:text-lg mb-3">
        <span className="text-fg-dim">## </span>
        {title}
      </h2>
      <div className="text-fg leading-relaxed">{children}</div>
    </section>
  );
}

function StackTable() {
  const rows: Array<[string, string]> = [
    ["app", "next.js 15.3 / react 19.1 / typescript 5.5 / tailwind v4.1"],
    [
      "cluster",
      "k3d v5.8 / k3s on docker / 1 server + 1 agent / flannel CNI",
    ],
    ["ingress", "ingress-nginx (helm chart 4.x)"],
    [
      "networking",
      "cloudflare tunnel via cloudflared 2026.3 / tailscale 1.96",
    ],
    [
      "security",
      "pod-security admission (restricted) / networkpolicy / trivy 0.70",
    ],
    ["ci", "github actions / gitleaks 8.30 / kubectl-validate / kustomize"],
    ["image", "gcr.io/distroless/nodejs20-debian12:nonroot (arm64, <150MB)"],
    ["runtime", "node 20 LTS / pnpm 11 / fish shell on the host"],
  ];
  return (
    <pre className="overflow-x-auto">
{rows
  .map(([k, v]) => `  ${k.padEnd(12)}${v}`)
  .join("\n")}
    </pre>
  );
}

function TrafficFlow() {
  const steps = [
    "user types puiemrazvan.momentan.fun",
    "DNS resolves to <tunnel-id>.cfargotunnel.com (Cloudflare-proxied)",
    "Cloudflare edge accepts the TLS handshake and terminates it",
    "Cloudflare matches the host against the tunnel's ingress rules",
    "request travels over the persistent outbound-initiated tunnel to a cloudflared pod inside the cluster",
    "cloudflared forwards HTTP to ingress-nginx-controller.ingress-nginx.svc.cluster.local:80",
    "nginx-ingress applies host-routing, rate limit, body-size limit, and user-agent filter, then proxies to the k8s-playground Service",
    "the Service round-robins to one of two app pods; next.js renders; response retraces the path",
  ];
  return (
    <ol className="space-y-1.5 pl-1 list-none">
      {steps.map((s, i) => (
        <li key={i} className="leading-relaxed">
          <span className="text-accent">{(i + 1).toString().padStart(2, "0")}.</span>{" "}
          {s}
        </li>
      ))}
      <li className="text-fg-dim text-xs pt-2">
        see the architecture diagram below for the full picture, including the
        separate Tailscale path for <code>kubectl</code> admin access.
      </li>
    </ol>
  );
}

function LocalSetup() {
  return (
    <>
      <p className="mb-3 text-fg">
        commands below are written for fish shell on macOS. only the env-var
        syntax differs from bash; everything else runs verbatim.
      </p>
      <pre>
{`# 1. clone
$ git clone git@github.com:tudorpie/k8s-playground
$ cd k8s-playground

# 2. set your cloudflare api token (fish syntax)
$ set -gx CLOUDFLARE_API_TOKEN "your-token-with-Zone.DNS+Zone.Read+Tunnel"

# 3. one command
$ make all
    # = make up        create k3d cluster + install ingress-nginx
    # + make build     build arm64 image, import into k3d
    # + make tunnel    create cloudflare tunnel, write DNS, create secret
    # + make deploy    kubectl apply -k k8s/, wait for rollout

# 4. verify
$ make verify

# 5. tear it all down
$ make down`}
      </pre>
    </>
  );
}

function WhyCloudflare() {
  return (
    <ul className="space-y-3">
      <li>
        <span className="text-fg-bright">opening router ports</span>{" "}
        — exposes the entire Mac to the public internet, often blocked by
        carrier-grade NAT anyway, and a DDoS lands directly on a residential
        link.
      </li>
      <li>
        <span className="text-fg-bright">tailscale funnel</span>{" "}
        — works, but routes only on{" "}
        <code>*.ts.net</code> subdomains. funnel terminates TLS at Tailscale&apos;s
        relays via SNI and does not support a bring-your-own apex like{" "}
        <code>momentan.fun</code>. fine for sharing a dev URL with a friend;
        not fine for a real custom hostname.
      </li>
      <li>
        <span className="text-fg-bright">ngrok / trycloudflare</span>{" "}
        — fine for ephemeral demos, but no stable hostname on a custom domain
        without a paid plan.
      </li>
      <li>
        <span className="text-fg-bright">a VPS plus reverse proxy</span>{" "}
        — valid; you trade money and ops for control. overkill for an
        afternoon demo.
      </li>
      <li className="pt-1">
        cloudflare tunnel is outbound-initiated, costs nothing, gives a
        stable custom hostname on a Cloudflare-hosted zone, and parks
        Cloudflare&apos;s edge — WAF, DDoS protection, TLS — between attackers and
        the cluster.
      </li>
    </ul>
  );
}

function WhyTailscale() {
  return (
    <>
      <p>
        the k3d API server is bound to a port on Docker&apos;s loopback interface
        on the Mac. nothing routes to it from the LAN, let alone the
        internet.
      </p>
      <p className="mt-3">
        a single <code>tailscale serve --bg https+insecure://localhost:&lt;port&gt;</code>{" "}
        exposes the same port to authenticated tailnet members only, addressed
        by the Mac&apos;s tailnet name. <code>kubectl</code> from a laptop on the
        road works; <code>nmap</code> of the Mac&apos;s public IP shows nothing.
      </p>
      <p className="mt-3 text-fg-dim text-xs">
        result: zero public attack surface on the control plane. compromise
        of the public app does not yield API access either, because the pod
        ServiceAccount has no token mounted and no role bindings.
      </p>
    </>
  );
}

function SecurityTour() {
  return (
    <div className="space-y-7">
      <Control
        name="pod security admission, restricted profile"
        what="namespace 'k8s-playground' carries the label pod-security.kubernetes.io/enforce: restricted. the kubernetes built-in PSA admission controller rejects pods that don't meet the restricted profile. no Kyverno needed."
        prevents="privileged containers, host namespace sharing, hostPath mounts, running as root, allowPrivilegeEscalation, ambient capabilities, unconstrained seccomp, host sysctls."
        verify={`kubectl apply -f tests/sample-bad/pod-privileged.yaml\n# ⇒ rejected: violates PodSecurity "restricted:latest"`}
      />
      <Control
        name="pod and container securityContext"
        what="pod runs as uid 65532, group 65532, fsGroup 65532, seccompProfile RuntimeDefault. every container: readOnlyRootFilesystem: true, allowPrivilegeEscalation: false, capabilities.drop: [ALL]."
        prevents="binary tampering at runtime, kernel-exploit primitives that require root or specific capabilities, setuid escalation paths."
        verify={`kubectl exec deploy/k8s-playground -n k8s-playground -- id\n# ⇒ uid=65532 gid=65532`}
      />
      <Control
        name="networkpolicy (default-deny + explicit allow)"
        what="two policies in the namespace: (1) default-deny on ingress and egress, (2) allow ingress from the ingress-nginx namespace on the app port, and (3) allow egress to kube-system kube-dns on UDP 53. nothing else flows in, nothing else flows out."
        prevents="lateral movement from a compromised pod elsewhere in the cluster, exfiltration to attacker-controlled hosts on the internet."
        verify={`kubectl run probe --rm -i --image=curlimages/curl --restart=Never \\\n  -- -m 3 http://k8s-playground.k8s-playground:80\n# ⇒ connection refused / timeout`}
      />
      <Control
        name="dedicated serviceaccount, no token mount"
        what="one ServiceAccount with no role bindings; deployment.spec.automountServiceAccountToken: false at both pod and SA level. the pod has no JWT capable of talking to the kube API."
        prevents="a compromised app pod from listing pods, creating jobs, or escaping via ServiceAccount-token misuse."
        verify={`kubectl exec deploy/k8s-playground -n k8s-playground -- ls /var/run/secrets/\n# ⇒ no kubernetes.io/serviceaccount directory`}
      />
      <Control
        name="resource requests + limits"
        what="cpu 100m request / 500m limit, memory 128Mi request / 256Mi limit. small footprint, fits comfortably on apple silicon."
        prevents="a runaway or hostile pod starving the node and taking co-tenant pods down with it."
        verify={`kubectl describe deploy/k8s-playground -n k8s-playground | grep -A2 Limits`}
      />
      <Control
        name="distroless image, multi-stage, single architecture"
        what="final image is gcr.io/distroless/nodejs20-debian12:nonroot, arm64 only, under 150 MB, no shell, no package manager, no busybox."
        prevents="shell-based post-exploitation, on-pod package install, many CVE-laden ubuntu/debian transitive deps."
        verify={`kubectl exec deploy/k8s-playground -n k8s-playground -- /bin/sh\n# ⇒ executable not found`}
      />
      <Control
        name="nginx-ingress hardening"
        what={`on the Ingress object:\n  - nginx.ingress.kubernetes.io/limit-rps: "20"\n  - nginx.ingress.kubernetes.io/proxy-body-size: "1m"\n  - server-snippet returns 444 for known scanner user-agents (nikto, sqlmap, nmap, wpscan, masscan).`}
        prevents="trivial brute-force scans, large-upload abuse, automated tooling fingerprinting the host as an interesting target."
        verify={`curl -sS -A "sqlmap/1.0" -o /dev/null -w "%{http_code}\\n" \\\n  https://puiemrazvan.momentan.fun\n# ⇒ 000 (connection closed by nginx)`}
      />
      <Control
        name="cloudflare tunnel (no inbound holes)"
        what="cloudflared opens a persistent QUIC tunnel outbound from inside the cluster to the cloudflare edge. nothing terminates on the Mac's LAN IP. the home router has no inbound rules."
        prevents="direct probing of the Mac from the internet, residential IP getting indexed by attacker tooling."
        verify={`sudo lsof -nP -iTCP -sTCP:LISTEN | grep -E ":80\\s+|:443\\s+"\n# ⇒ no public listeners on either port`}
      />
      <Control
        name="kubeapi reachable only on the tailnet"
        what="k3d --api-port binds :6443 on docker loopback on the mac. tailscale serve --bg https+insecure://localhost:6443 exposes the same port to authenticated tailnet members only."
        prevents="opportunistic kubeapi scans, credential-stuffing, post-token-leak exposure on the public internet."
        verify={`nmap -Pn -p 6443 <your-public-ip>\n# ⇒ filtered / closed`}
      />
      <Control
        name="image scanning gate (trivy)"
        what=".github/workflows/ci.yml runs trivy image on every push. the workflow fails on any HIGH or CRITICAL. manifests are also scanned via trivy config."
        prevents="unknowingly shipping base-image or dependency CVEs into the cluster."
        verify={`make scan\n# ⇒ exits 0 only when clean`}
      />
      <Control
        name="strict content-security-policy and friends"
        what="per-request nonce attached to script-src with 'strict-dynamic'. no 'unsafe-eval'. no wildcards. style-src 'unsafe-inline' is permitted only because tailwind's runtime needs it. also: HSTS (2y, preload), X-Frame-Options DENY, X-Content-Type-Options nosniff, Referrer-Policy strict-origin-when-cross-origin, Permissions-Policy denying all sensors and payment."
        prevents="XSS-driven exfiltration, clickjacking, MIME-sniffing attacks, TLS downgrade."
        verify={`curl -sI https://puiemrazvan.momentan.fun | grep -iE 'content-security|strict-transport|frame-options|permissions-policy'`}
      />
    </div>
  );
}

function Control({
  name,
  what,
  prevents,
  verify,
}: {
  name: string;
  what: string;
  prevents: string;
  verify: string;
}) {
  return (
    <article>
      <h3 className="text-fg-bright text-sm mb-2">
        <span className="text-fg-dim">### </span>
        {name}
      </h3>
      <dl className="grid grid-cols-[5.5rem_1fr] gap-x-3 gap-y-1.5 text-sm leading-relaxed">
        <dt className="text-accent">what</dt>
        <dd className="whitespace-pre-wrap">{what}</dd>
        <dt className="text-accent">prevents</dt>
        <dd>{prevents}</dd>
        <dt className="text-accent">verify</dt>
        <dd>
          <pre className="!my-0 text-xs whitespace-pre">{verify}</pre>
        </dd>
      </dl>
    </article>
  );
}

function ArchitectureSection() {
  return (
    <>
      <p className="mb-4 text-fg">
        public traffic enters on the left and finishes inside a pod on the
        right. admin traffic via Tailscale runs along the bottom and never
        touches the public path.
      </p>
      <ArchitectureSVG />
      <p className="mt-3 text-fg-dim text-xs">
        not every node carries metadata. some do.
      </p>
    </>
  );
}

function Missing() {
  const items = [
    "backups (no etcd snapshotting, no offsite copies)",
    "multi-node HA (one server, one agent, no quorum)",
    "monitoring + alerting (no prometheus, no grafana, no pager)",
    "log aggregation (kubectl logs is the user experience)",
    "secrets management beyond env vars and the kubernetes Secret",
    "persistent volumes (the app is stateless on purpose)",
    "horizontal autoscaling (replicas pinned at 2)",
    "cert-manager (cloudflare terminates TLS; in-cluster mTLS out of scope)",
    "admission policy engine (kyverno, opa-gatekeeper)",
    "eBPF networking (cilium, hubble)",
  ];
  return (
    <>
      <p className="mb-3">
        this is a one-shot demo. left out on purpose:
      </p>
      <ul className="space-y-1 list-none pl-1">
        {items.map((it) => (
          <li key={it}>
            <span className="text-accent">-</span> {it}
          </li>
        ))}
      </ul>
      <p className="mt-3 text-fg-dim text-xs">
        every item above is a worthwhile next step.
      </p>
    </>
  );
}

function Footer() {
  return (
    <footer className="mt-16 pt-6 border-t border-border text-xs text-fg-dim flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        source —{" "}
        <a href="https://github.com/tudorpie/k8s-playground">
          github.com/tudorpie/k8s-playground
        </a>
      </div>
      <div className="flex gap-4 items-center">
        <Link href="/hunt" className="text-fg-dim">
          /hunt
        </Link>
        <Counter />
      </div>
    </footer>
  );
}
