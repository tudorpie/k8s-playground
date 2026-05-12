import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-static";
export const revalidate = false;

export function GET() {
  return NextResponse.json({ ok: true });
}
