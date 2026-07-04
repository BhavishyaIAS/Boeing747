/**
 * Text utilities used across content ingestion: slugs, plain-text extraction
 * from TipTap/ProseMirror JSON, and reading-time estimation.
 */

const AVERAGE_WPM = 200;

export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // strip combining diacritics
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96);
}

/** Recursively collect `text` nodes from a ProseMirror-style JSON document. */
export function extractPlainText(doc: unknown): string {
  const parts: string[] = [];
  const walk = (node: unknown): void => {
    if (!node || typeof node !== "object") return;
    const n = node as Record<string, unknown>;
    if (typeof n.text === "string") parts.push(n.text);
    if (Array.isArray(n.content)) {
      for (const child of n.content) walk(child);
    }
  };
  walk(doc);
  return parts.join(" ").replace(/\s+/g, " ").trim();
}

export function countWords(text: string): number {
  if (!text) return 0;
  return text.split(/\s+/).filter(Boolean).length;
}

/** Reading time in whole seconds, floored at ~1s for any non-empty content. */
export function estimateReadingSeconds(text: string): number {
  const words = countWords(text);
  if (words === 0) return 0;
  return Math.max(1, Math.round((words / AVERAGE_WPM) * 60));
}
