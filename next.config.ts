import path from "node:path";
import type { NextConfig } from "next";

const config: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: path.join(__dirname),
  // We don't use next/image; skip the optimizer so sharp is not pulled into
  // the standalone tracing bundle. Saves ~30 MB in the runtime image.
  images: { unoptimized: true },
  outputFileTracingExcludes: {
    "*": [
      "node_modules/sharp/**",
      "node_modules/@img/**",
      "node_modules/@next/swc-*/**",
      "node_modules/typescript/**",
      "node_modules/@types/**",
      "node_modules/.cache/**",
    ],
  },
  poweredByHeader: false,
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Permissions-Policy",
            value:
              "accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), midi=(), payment=(), usb=(), interest-cohort=()",
          },
        ],
      },
    ];
  },
};

export default config;
