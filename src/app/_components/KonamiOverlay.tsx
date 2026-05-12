"use client";

import { useEffect, useState } from "react";
import { markFound } from "@/lib/hunt";

const SEQUENCE = [
  "ArrowUp",
  "ArrowUp",
  "ArrowDown",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowLeft",
  "ArrowRight",
  "b",
  "a",
];

export function KonamiOverlay() {
  const [visible, setVisible] = useState(false);
  const [stamp, setStamp] = useState<string>("");

  useEffect(() => {
    let idx = 0;
    function onKey(e: KeyboardEvent) {
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      if (key === SEQUENCE[idx]) {
        idx += 1;
        if (idx === SEQUENCE.length) {
          idx = 0;
          setStamp(new Date().toISOString());
          setVisible(true);
          markFound("konami");
        }
      } else {
        idx = key === SEQUENCE[0] ? 1 : 0;
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!visible) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={() => setVisible(false)}
      style={{
        position: "fixed",
        inset: 0,
        background: "#0a0e14f7",
        zIndex: 9999,
        display: "grid",
        placeItems: "center",
        cursor: "pointer",
        textAlign: "center",
      }}
    >
      <div style={{ padding: "2rem", maxWidth: "640px" }}>
        <pre style={{ color: "#ffb454", border: "none", background: "transparent" }}>
{`  ┌──────────────────────────────────────┐
  │                                      │
  │            MUIE RAZVAN               │
  │                                      │
  │    (this counts. 1 of 9 found.)      │
  │                                      │
  └──────────────────────────────────────┘`}
        </pre>
        <p style={{ marginTop: "1.5rem", color: "#828791" }}>
          recorded {stamp}. click anywhere to dismiss.
        </p>
      </div>
    </div>
  );
}
