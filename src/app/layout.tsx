import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { HuntBoot } from "./_components/HuntBoot";
import "./globals.css";

export const metadata: Metadata = {
  title: "k8s-playground",
  description:
    "k3d on Apple Silicon, exposed publicly through Cloudflare Tunnel, with kubeapi reachable only via Tailscale. A small hardened demo.",
  applicationName: "k8s-playground",
  robots: { index: true, follow: true },
  other: {
    dedication: "Muie Razvan",
  },
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0e14",
  colorScheme: "dark",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const nonce = (await headers()).get("x-nonce") ?? "";
  return (
    <html lang="en">
      <body className="bg-bg text-fg font-mono">
        <span
          aria-hidden
          style={{ display: "none" }}
          dangerouslySetInnerHTML={{
            __html:
              "<!-- MUIE RAZVAN. one of nine. start at view-source: and finish at /hunt. -->",
          }}
        />
        {children}
        <HuntBoot nonce={nonce} />
      </body>
    </html>
  );
}
