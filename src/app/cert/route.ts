import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Server-rendered certificate. Returned as SVG so it can be saved and shared.
export function GET() {
  const stamp = new Date().toISOString();
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 700" width="1000" height="700">
  <title>certificate of dedication</title>
  <rect width="1000" height="700" fill="#0a0e14"/>
  <rect x="30" y="30" width="940" height="640" fill="none" stroke="#ffb454" stroke-width="2"/>
  <rect x="40" y="40" width="920" height="620" fill="none" stroke="#ffb454" stroke-width="0.5"/>

  <!-- corner ornaments -->
  ${cornerOrnament(30, 30)}
  ${cornerOrnament(970, 30, true, false)}
  ${cornerOrnament(30, 670, false, true)}
  ${cornerOrnament(970, 670, true, true)}

  <text x="500" y="120" font-family="monospace" font-size="14" fill="#5c6773" text-anchor="middle" letter-spacing="6">
    NO. ${shortHash(stamp)}
  </text>
  <text x="500" y="180" font-family="monospace" font-size="34" fill="#c7c7c7" text-anchor="middle" font-weight="700" letter-spacing="2">
    CERTIFICATE OF DEDICATION
  </text>
  <line x1="220" y1="210" x2="780" y2="210" stroke="#ffb454" stroke-width="1"/>

  <text x="500" y="270" font-family="monospace" font-size="16" fill="#b3b1ad" text-anchor="middle">
    this document attests that on
  </text>
  <text x="500" y="300" font-family="monospace" font-size="20" fill="#ffb454" text-anchor="middle" font-weight="700">
    ${stamp}
  </text>

  <text x="500" y="370" font-family="monospace" font-size="22" fill="#c7c7c7" text-anchor="middle" font-weight="700" letter-spacing="8">
    RAZVAN
  </text>

  <text x="500" y="425" font-family="monospace" font-size="14" fill="#b3b1ad" text-anchor="middle">
    located all nine dedications hidden within the
  </text>
  <text x="500" y="450" font-family="monospace" font-size="14" fill="#b3b1ad" text-anchor="middle">
    k8s-playground deployment artefact at
  </text>
  <text x="500" y="475" font-family="monospace" font-size="14" fill="#ffb454" text-anchor="middle">
    puiemrazvan.momentan.fun
  </text>

  <text x="500" y="540" font-family="monospace" font-size="13" fill="#828791" text-anchor="middle">
    this certification is permanent. no appeal is provided.
  </text>

  <text x="500" y="595" font-family="monospace" font-size="11" fill="#5c6773" text-anchor="middle" letter-spacing="2">
    ISSUED BY
  </text>
  <text x="500" y="620" font-family="monospace" font-size="14" fill="#c7c7c7" text-anchor="middle" font-weight="700">
    k8s-playground hunt registrar
  </text>

  <!-- seal -->
  <g transform="translate(820,560)">
    <circle r="50" fill="none" stroke="#ffb454" stroke-width="1"/>
    <circle r="42" fill="none" stroke="#ffb454" stroke-width="0.5"/>
    <text x="0" y="-2" font-family="monospace" font-size="9" fill="#ffb454" text-anchor="middle">SEALED</text>
    <text x="0" y="10" font-family="monospace" font-size="9" fill="#ffb454" text-anchor="middle">9 / 9</text>
  </g>
</svg>`;

  return new NextResponse(svg, {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "no-store",
      "Content-Disposition": `inline; filename="certificate-of-dedication-${stamp}.svg"`,
    },
  });
}

function cornerOrnament(x: number, y: number, flipX = false, flipY = false): string {
  const sx = flipX ? -1 : 1;
  const sy = flipY ? -1 : 1;
  return `<g transform="translate(${x},${y}) scale(${sx},${sy})">
    <path d="M0,20 L0,0 L20,0" stroke="#ffb454" stroke-width="2" fill="none"/>
    <path d="M5,15 L5,5 L15,5" stroke="#ffb454" stroke-width="0.5" fill="none"/>
  </g>`;
}

function shortHash(input: string): string {
  let h = 0;
  for (let i = 0; i < input.length; i += 1) {
    h = (h << 5) - h + input.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h).toString(16).toUpperCase().padStart(8, "0").slice(0, 8);
}
