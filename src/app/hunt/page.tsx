"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ALL_EGGS, getFound, type EggId } from "@/lib/hunt";

export default function HuntList() {
  const [found, setFound] = useState<Set<EggId>>(new Set());
  useEffect(() => {
    function sync() {
      setFound(new Set(getFound()));
    }
    sync();
    window.addEventListener("hunt-update", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("hunt-update", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return (
    <main className="mx-auto max-w-[720px] px-5 py-12">
      <h1 className="text-accent text-base mb-6">
        <span className="text-fg-dim">## </span>/hunt
      </h1>
      <p className="text-fg-dim text-xs mb-5">
        slugs only. no hints. local progress; clear browser storage to reset.
      </p>
      <ul className="space-y-1 list-none">
        {ALL_EGGS.map((id) => (
          <li key={id} suppressHydrationWarning>
            <span className="text-accent mr-2">{found.has(id) ? "[x]" : "[ ]"}</span>
            <span className={found.has(id) ? "text-fg-bright" : "text-fg"}>{id}</span>
          </li>
        ))}
      </ul>
      <p className="mt-8 text-xs">
        <Link href="/" className="text-fg-dim">← back</Link>
      </p>
    </main>
  );
}
