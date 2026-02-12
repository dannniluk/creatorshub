export function normalizeSeed(value: number): number {
  return Math.abs(Math.floor(value)) >>> 0;
}

export function hashToSeed(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return normalizeSeed(hash);
}

export function deriveSeed(baseSeed: number, offset: number): number {
  return normalizeSeed(baseSeed + offset * 1013904223);
}

export function createDeterministicRandom(seed: number): () => number {
  let state = normalizeSeed(seed) || 1;
  return () => {
    state += 0x6d2b79f5;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
