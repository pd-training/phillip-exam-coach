// Chapter weights for exam simulation parts.
// A part's question count is shared out by weight; counts are rounded so they add up exactly
// (largest remainder method). Weight 0 leaves a chapter out.

export type ChapterWeights = Record<string, number>;

export function parseChapterWeights(raw: unknown): ChapterWeights | null {
  if (raw === null || raw === undefined || raw === "") return null;
  let value: any = raw;
  if (typeof raw === "string") {
    try {
      value = JSON.parse(raw);
    } catch {
      return null;
    }
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const out: ChapterWeights = {};
  for (const [key, w] of Object.entries(value)) {
    const n = Math.floor(Number(w));
    if (Number.isFinite(n) && n >= 0 && n <= 10) out[key] = n;
  }
  return Object.keys(out).length > 0 ? out : null;
}

export function allocateByWeight(total: number, weights: ChapterWeights): Record<string, number> {
  const keys = Object.keys(weights).sort((a, b) => Number(a) - Number(b));
  const sum = keys.reduce((acc, k) => acc + (weights[k] || 0), 0);
  const out: Record<string, number> = Object.fromEntries(keys.map((k) => [k, 0]));
  if (sum === 0 || total <= 0) return out;

  const raw = Object.fromEntries(keys.map((k) => [k, (total * (weights[k] || 0)) / sum]));
  keys.forEach((k) => {
    out[k] = Math.floor(raw[k]);
  });
  let left = total - keys.reduce((acc, k) => acc + out[k], 0);
  const byRemainder = [...keys].sort((a, b) => raw[b] % 1 - raw[a] % 1);
  for (const k of byRemainder) {
    if (left <= 0) break;
    if ((weights[k] || 0) > 0) {
      out[k] += 1;
      left -= 1;
    }
  }
  return out;
}
