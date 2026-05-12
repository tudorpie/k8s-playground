"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { TOTAL, getFound } from "@/lib/hunt";

export function Counter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    function sync() {
      setCount(getFound().length);
    }
    sync();
    const handler = () => sync();
    window.addEventListener("hunt-update", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("hunt-update", handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  const complete = count >= TOTAL;
  return (
    <div className="font-mono text-xs" style={{ opacity: 0.4 }}>
      <span suppressHydrationWarning>
        dedications found: {count}/{TOTAL}
        {complete ? " — complete" : ""}
      </span>
      {complete ? (
        <>
          {" "}
          <Link href="/cert">[claim certificate]</Link>
        </>
      ) : null}
    </div>
  );
}
