import fs from "node:fs";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Peek = {
  annotations: Record<string, string>;
  labels: Record<string, string>;
  dockerfile_label: string | null;
  source: {
    annotations: string;
    labels: string;
  };
};

function readPodInfoFile(path: string): Record<string, string> {
  const text = fs.readFileSync(path, "utf-8");
  const out: Record<string, string> = {};
  for (const line of text.split("\n")) {
    const m = line.match(/^([^=]+)=(.*)$/);
    if (!m) continue;
    const key = m[1];
    let value = m[2];
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1).replace(/\\"/g, '"').replace(/\\n/g, "\n");
    }
    out[key] = value;
  }
  return out;
}

export function GET() {
  const result: Peek = {
    annotations: {},
    labels: {},
    dockerfile_label: process.env.DEDICATION_LABEL ?? null,
    source: {
      annotations: "/etc/podinfo/annotations",
      labels: "/etc/podinfo/labels",
    },
  };

  try {
    result.annotations = readPodInfoFile("/etc/podinfo/annotations");
  } catch (e) {
    result.annotations = {
      _error:
        "downward API volume not mounted (running outside the cluster?): " +
        (e instanceof Error ? e.message : String(e)),
    };
  }
  try {
    result.labels = readPodInfoFile("/etc/podinfo/labels");
  } catch {
    result.labels = {};
  }

  return NextResponse.json(result, {
    status: 200,
    headers: { "Cache-Control": "no-store" },
  });
}
