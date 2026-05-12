export type EggId =
  | "html-comment"
  | "console-ascii"
  | "meta-tag"
  | "robots-txt"
  | "konami"
  | "secret-route"
  | "svg-title"
  | "k8s-annotation"
  | "dockerfile-label";

export const ALL_EGGS: EggId[] = [
  "html-comment",
  "console-ascii",
  "meta-tag",
  "robots-txt",
  "konami",
  "secret-route",
  "svg-title",
  "k8s-annotation",
  "dockerfile-label",
];

export const TOTAL = ALL_EGGS.length;

const KEY = "k8s-playground:hunt";

export function getFound(): EggId[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is EggId =>
      ALL_EGGS.includes(x as EggId),
    );
  } catch {
    return [];
  }
}

export function markFound(id: EggId): void {
  if (typeof window === "undefined") return;
  const found = new Set(getFound());
  if (found.has(id)) return;
  found.add(id);
  window.localStorage.setItem(KEY, JSON.stringify([...found]));
  window.dispatchEvent(new CustomEvent("hunt-update"));
}
