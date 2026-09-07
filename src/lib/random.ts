/**
 * Deterministic PRNG (mulberry32) + Box-Muller normal sampling.
 *
 * The mock league data is seeded so the demo is reproducible across
 * requests/refreshes; the Monte Carlo simulator uses its own unseeded
 * generator per request (or a caller-supplied seed for testing).
 */
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function rand() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashStringToSeed(s: string): number {
  let h = 1779033703 ^ s.length;
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(h ^ s.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return (h ^ (h >>> 16)) >>> 0;
}

/** Standard normal sample via Box-Muller, using the supplied uniform RNG. */
export function randNormal(rand: () => number, mean: number, stdDev: number): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = rand();
  while (v === 0) v = rand();
  const z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  return mean + z * stdDev;
}

/** Standard normal CDF via the Abramowitz-Stegun erf approximation. */
export function normalCdf(x: number, mean = 0, stdDev = 1): number {
  if (stdDev <= 0) return x >= mean ? 1 : 0;
  const z = (x - mean) / (stdDev * Math.SQRT2);
  return 0.5 * (1 + erf(z));
}

function erf(x: number): number {
  // Abramowitz & Stegun 7.1.26, max error ~1.5e-7
  const sign = x < 0 ? -1 : 1;
  const ax = Math.abs(x);
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;
  const t = 1 / (1 + p * ax);
  const y = 1 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-ax * ax);
  return sign * y;
}

export function pickRandom<T>(rand: () => number, arr: readonly T[]): T {
  const item = arr[Math.floor(rand() * arr.length)];
  if (item === undefined) throw new Error("pickRandom: empty array");
  return item;
}

export function shuffle<T>(rand: () => number, arr: readonly T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const ci = copy[i]!;
    const cj = copy[j]!;
    copy[i] = cj;
    copy[j] = ci;
  }
  return copy;
}
