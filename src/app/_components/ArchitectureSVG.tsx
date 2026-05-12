"use client";

import { useRef } from "react";
import { markFound } from "@/lib/hunt";

// Hand-rolled SVG. Public ingress on the left flowing through Cloudflare and
// the in-cluster tunnel pod into Service then Pods. A separate admin path
// shows Tailscale reaching kubeapi directly via the tailnet.
export function ArchitectureSVG() {
  const timerRef = useRef<number | null>(null);

  function startHover() {
    if (timerRef.current !== null) return;
    timerRef.current = window.setTimeout(() => {
      markFound("svg-title");
      timerRef.current = null;
    }, 550);
  }
  function endHover() {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }

  const accent = "#ffb454";
  const dim = "#cc8a3f";
  const fg = "#c7c7c7";
  const muted = "#5c6773";
  const border = "#2d343d";

  return (
    <svg
      viewBox="0 0 920 540"
      role="img"
      aria-label="Architecture diagram of k8s-playground"
      style={{ width: "100%", height: "auto", background: "#0d1218", border: `1px solid ${border}` }}
    >
      <defs>
        <marker
          id="arrow"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="8"
          markerHeight="8"
          orient="auto-start-reverse"
        >
          <path d="M0,0 L10,5 L0,10 z" fill={accent} />
        </marker>
        <marker
          id="arrowDim"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="8"
          markerHeight="8"
          orient="auto-start-reverse"
        >
          <path d="M0,0 L10,5 L0,10 z" fill={dim} />
        </marker>
      </defs>

      {/* Title bar */}
      <text x="20" y="28" fill={fg} fontFamily="monospace" fontSize="13" fontWeight="700">
        k8s-playground :: traffic + admin paths
      </text>
      <line x1="20" y1="38" x2="900" y2="38" stroke={border} />

      {/* Public path label */}
      <text x="20" y="68" fill={muted} fontFamily="monospace" fontSize="11">
        {"// public path"}
      </text>

      {/* User box */}
      <Box x={20} y={88} w={140} h={64} title="public user" sub="https://puiemrazvan.momentan.fun" />

      <Arrow x1={160} y1={120} x2={210} y2={120} />

      {/* Cloudflare edge */}
      <Box x={210} y={88} w={170} h={64} title="cloudflare edge" sub="TLS terminate / DNS / WAF" />

      <Arrow x1={380} y1={120} x2={430} y2={120} dashed />

      {/* k3d cluster boundary */}
      <rect
        x={430}
        y={56}
        width={470}
        height={228}
        fill="none"
        stroke={border}
        strokeDasharray="4 4"
      />
      <text x={444} y={74} fill={muted} fontFamily="monospace" fontSize="11">
        k3d cluster (docker on apple silicon)
      </text>

      {/* cloudflared pod — special node with the hidden title */}
      <g
        onMouseEnter={startHover}
        onMouseLeave={endHover}
        style={{ cursor: "help" }}
      >
        <title>Muie Razvan</title>
        <rect x={446} y={88} width={170} height={64} rx={2} ry={2} fill="#0a0e14" stroke={accent} />
        <text x={531} y={111} fill={fg} fontFamily="monospace" fontSize="12" textAnchor="middle" fontWeight="700">
          cloudflared pod
        </text>
        <text x={531} y={130} fill={muted} fontFamily="monospace" fontSize="10" textAnchor="middle">
          2 replicas, outbound-only
        </text>
        <text x={531} y={144} fill={muted} fontFamily="monospace" fontSize="9" textAnchor="middle">
          (hover me)
        </text>
      </g>

      <Arrow x1={616} y1={120} x2={666} y2={120} />

      {/* Service */}
      <Box x={666} y={88} w={170} h={64} title="Service" sub="ClusterIP :80 → :3000" />

      <Arrow x1={750} y1={152} x2={750} y2={196} />

      {/* App pods */}
      <Box x={666} y={196} w={170} h={64} title="next.js app" sub="2 replicas, distroless, uid 65532" />

      {/* NetworkPolicy badge */}
      <rect x={446} y={196} width={170} height={64} rx={2} ry={2} fill="#0a0e14" stroke={dim} />
      <text x={531} y={219} fill={fg} fontFamily="monospace" fontSize="12" textAnchor="middle" fontWeight="700">
        NetworkPolicy
      </text>
      <text x={531} y={238} fill={muted} fontFamily="monospace" fontSize="10" textAnchor="middle">
        default-deny + allowlist
      </text>
      <text x={531} y={252} fill={muted} fontFamily="monospace" fontSize="10" textAnchor="middle">
        kube-dns egress only
      </text>

      {/* Admin path label */}
      <text x="20" y={324} fill={muted} fontFamily="monospace" fontSize="11">
        {"// admin path"}
      </text>

      {/* Admin user */}
      <Box x={20} y={344} w={140} h={64} title="operator" sub="kubectl on macOS" />

      <Arrow x1={160} y1={376} x2={210} y2={376} dim />

      {/* Tailnet */}
      <Box x={210} y={344} w={170} h={64} title="tailscale" sub="WireGuard tailnet" dim />

      <Arrow x1={380} y1={376} x2={430} y2={376} dim />

      {/* kubeapi */}
      <Box x={430} y={344} w={186} h={64} title="k3d server :6443" sub="bound to docker loopback only" dim />

      <text x="20" y={472} fill={muted} fontFamily="monospace" fontSize="11">
        {"// legend"}
      </text>
      <line x1="20" y1="494" x2="50" y2="494" stroke={accent} strokeWidth="1.5" markerEnd="url(#arrow)" />
      <text x="58" y="498" fill={fg} fontFamily="monospace" fontSize="11">
        public path
      </text>
      <line x1="180" y1="494" x2="210" y2="494" stroke={dim} strokeWidth="1.5" markerEnd="url(#arrowDim)" />
      <text x="218" y="498" fill={fg} fontFamily="monospace" fontSize="11">
        admin path (tailnet-only)
      </text>
      <text x="20" y={520} fill={muted} fontFamily="monospace" fontSize="10">
        no inbound holes in the home router. tunnel is initiated outbound from cloudflared.
      </text>
    </svg>
  );
}

function Box({
  x,
  y,
  w,
  h,
  title,
  sub,
  dim = false,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  title: string;
  sub: string;
  dim?: boolean;
}) {
  const stroke = dim ? "#cc8a3f" : "#ffb454";
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={2} ry={2} fill="#0a0e14" stroke={stroke} />
      <text
        x={x + w / 2}
        y={y + 23}
        fill="#c7c7c7"
        fontFamily="monospace"
        fontSize="12"
        textAnchor="middle"
        fontWeight="700"
      >
        {title}
      </text>
      <text
        x={x + w / 2}
        y={y + 42}
        fill="#5c6773"
        fontFamily="monospace"
        fontSize="10"
        textAnchor="middle"
      >
        {sub}
      </text>
    </g>
  );
}

function Arrow({
  x1,
  y1,
  x2,
  y2,
  dim = false,
  dashed = false,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  dim?: boolean;
  dashed?: boolean;
}) {
  const stroke = dim ? "#cc8a3f" : "#ffb454";
  const marker = dim ? "url(#arrowDim)" : "url(#arrow)";
  return (
    <line
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      stroke={stroke}
      strokeWidth={1.5}
      strokeDasharray={dashed ? "5 4" : undefined}
      markerEnd={marker}
    />
  );
}
