import { NextRequest, NextResponse } from "next/server";

// Strict CSP with per-request nonce. No 'unsafe-eval', no wildcards.
// 'strict-dynamic' on script-src means trust propagates from nonced scripts
// to anything they load, which is what an SPA needs without an inline-script
// allowlist. Tailwind's runtime needs 'unsafe-inline' for styles only — the
// spec explicitly permits that.
function buildCsp(nonce: string): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    "upgrade-insecure-requests",
  ].join("; ");
}

export function middleware(req: NextRequest): NextResponse {
  const nonce = btoa(crypto.randomUUID());
  const csp = buildCsp(nonce);

  const reqHeaders = new Headers(req.headers);
  reqHeaders.set("x-nonce", nonce);
  reqHeaders.set("content-security-policy", csp);

  const res = NextResponse.next({ request: { headers: reqHeaders } });
  res.headers.set("Content-Security-Policy", csp);

  const path = req.nextUrl.pathname;
  const cookieOpts = {
    path: "/",
    sameSite: "lax" as const,
    maxAge: 60 * 60 * 24 * 365,
    httpOnly: false,
  };
  if (path === "/robots.txt") {
    res.cookies.set("hunt-robots-txt", "1", cookieOpts);
  }
  if (path === "/secret") {
    res.cookies.set("hunt-secret-route", "1", cookieOpts);
  }

  return res;
}

export const config = {
  matcher: [
    {
      source: "/((?!_next/static|_next/image|favicon.ico).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
