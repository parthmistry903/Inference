/** DEMO-ONLY · Seeded PRNG so the fixture is byte-identical on every load. */

/** mulberry32 — small, fast, good enough distribution for fixture data. */
export function makeRng(seed: number) {
  let state = seed >>> 0;
  return function next(): number {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type Rng = ReturnType<typeof makeRng>;

/** Integer in [min, max] inclusive. */
export function int(rng: Rng, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1));
}

/** Float in [min, max), rounded to `decimals`. */
export function float(rng: Rng, min: number, max: number, decimals = 1): number {
  const value = min + rng() * (max - min);
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

export function pick<T>(rng: Rng, items: readonly T[]): T {
  return items[Math.floor(rng() * items.length)];
}

/** True with probability `p`. */
export function chance(rng: Rng, p: number): boolean {
  return rng() < p;
}

/** Pick from `[value, weight]` pairs. */
export function weighted<T>(rng: Rng, entries: readonly (readonly [T, number])[]): T {
  const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
  let roll = rng() * total;
  for (const [value, weight] of entries) {
    roll -= weight;
    if (roll <= 0) return value;
  }
  return entries[entries.length - 1][0];
}

/** Fisher–Yates on a copy. */
export function shuffle<T>(rng: Rng, items: readonly T[]): T[] {
  const copy = items.slice();
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** `count` distinct items, order shuffled. */
export function sample<T>(rng: Rng, items: readonly T[], count: number): T[] {
  return shuffle(rng, items).slice(0, Math.min(count, items.length));
}

/** A stable 24-char hex string, shaped like a Mongo ObjectId. */
export function objectId(rng: Rng): string {
  let out = '';
  for (let i = 0; i < 24; i += 1) out += Math.floor(rng() * 16).toString(16);
  return out;
}
