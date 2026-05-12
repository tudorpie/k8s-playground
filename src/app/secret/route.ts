import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET() {
  const body = [
    "Muie Razvan.",
    "",
    "some dedications live in the manifest. ask the cluster about itself.",
    "(try /hunt/peek)",
    "",
    "the rest are scattered. one yields to a famous sequence,",
    "one is inscribed onto a node in the architecture diagram,",
    "one was baked into the image. keep digging.",
    "",
  ].join("\n");
  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Dedication": "Muie Razvan",
      "Cache-Control": "no-store",
    },
  });
}
