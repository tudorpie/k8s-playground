"use client";

import { useEffect } from "react";
import { markFound } from "@/lib/hunt";

// One-time boot block:
//  - reads the cookies set by middleware on /robots.txt and /secret visits
//  - on devtools-detected, credits html-comment, meta-tag, console-ascii
//  - prints ASCII art to console (only after devtools is open)
//  - listens for konami code; overlay is rendered separately
export function HuntBoot({ nonce }: { nonce: string }) {
  useEffect(() => {
    const cookies = document.cookie;
    if (cookies.includes("hunt-robots-txt=1")) markFound("robots-txt");
    if (cookies.includes("hunt-secret-route=1")) markFound("secret-route");

    let credited = false;
    const consoleAscii = [
      "",
      "  ███▄ ▄███▓ █    ██  ██▓▓█████ ",
      "  ▓██▒▀█▀ ██▒ ██  ▓██▒▓██▒▓█   ▀ ",
      "  ▓██    ▓██░▓██  ▒██░▒██▒▒███   ",
      "  ▒██    ▒██ ▓▓█  ░██░░██░▒▓█  ▄ ",
      "  ▒██▒   ░██▒▒▒█████▓ ░██░░▒████▒",
      "  ░ ▒░   ░  ░░▒▓▒ ▒ ▒ ░▓  ░░ ▒░ ░",
      "  ░  ░      ░░░▒░ ░ ░  ▒ ░ ░ ░  ░",
      "",
      "        ██▀███   ▄▄▄     ▒███████▒ ██▒   █▓  ▄▄▄       ███▄    █ ",
      "       ▓██ ▒ ██▒▒████▄   ▒ ▒ ▒ ▄▀░▓██░   █▒ ▒████▄     ██ ▀█   █ ",
      "       ▓██ ░▄█ ▒▒██  ▀█▄ ░ ▒ ▄▀▒░  ▓██  █▒░ ▒██  ▀█▄  ▓██  ▀█ ██▒",
      "       ▒██▀▀█▄  ░██▄▄▄▄██  ▄▀▒   ░  ▒██ █░░ ░██▄▄▄▄██ ▓██▒  ▐▌██▒",
      "       ░██▓ ▒██▒ ▓█   ▓██▒▒███████▒  ▒▀█░    ▓█   ▓██▒▒██░   ▓██░",
      "",
      "  one of nine. eight more wait. /hunt.",
      "",
    ].join("\n");

    function creditOnDevtools() {
      if (credited) return;
      credited = true;
      // The act of printing this counts as discovery.
      console.log("%c" + consoleAscii, "color:#ffb454;font-family:monospace;");
      markFound("console-ascii");

      // Now that we know devtools is open, credit the rest of the source-only eggs.
      if (document.documentElement.outerHTML.includes("MUIE RAZVAN")) {
        markFound("html-comment");
      }
      if (document.querySelector('meta[name="dedication"]')) {
        markFound("meta-tag");
      }
    }

    function devtoolsOpen(): boolean {
      const wDiff = window.outerWidth - window.innerWidth;
      const hDiff = window.outerHeight - window.innerHeight;
      return wDiff > 160 || hDiff > 160;
    }

    // Initial check + interval. The defineProperty trick fires when devtools
    // expands a logged object; quieter and more reliable on some setups.
    if (devtoolsOpen()) creditOnDevtools();
    const iv = window.setInterval(() => {
      if (devtoolsOpen()) creditOnDevtools();
    }, 700);

    const probe: { id?: string } = {};
    Object.defineProperty(probe, "id", {
      get() {
        creditOnDevtools();
        return "";
      },
    });
    console.log(probe);
    console.clear();

    return () => {
      window.clearInterval(iv);
    };
  }, []);

  // The nonce is forwarded in the script tag below as a no-op placeholder so
  // that if a content-security policy is enforcing nonces, this inline script
  // is allowed. Used here only to silence the warning in dev.
  return (
    <script
      nonce={nonce}
      dangerouslySetInnerHTML={{ __html: "/* k8s-playground */" }}
    />
  );
}
