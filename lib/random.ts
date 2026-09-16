type Rng = {
  next(): number;
  int(min: number, max: number): number;
  pick<T>(items: readonly T[]): T;
  shuffle<T>(items: readonly T[]): T[];
};

const normalizeSeed = (seed: number) => (seed >>> 0) || 1;

export function createRng(seed: number): Rng {
  let state = normalizeSeed(seed);

  const next = () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  return {
    next,
    int(min: number, max: number) {
      if (!Number.isInteger(min) || !Number.isInteger(max) || max < min) {
        throw new Error("Invalid integer range");
      }

      return Math.floor(next() * (max - min + 1)) + min;
    },
    pick<T>(items: readonly T[]) {
      if (items.length === 0) {
        throw new Error("Cannot pick from an empty array");
      }

      return items[this.int(0, items.length - 1)];
    },
    shuffle<T>(items: readonly T[]) {
      const result = [...items];

      for (let index = result.length - 1; index > 0; index -= 1) {
        const swapIndex = this.int(0, index);
        [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
      }

      return result;
    },
  };
}

export function deriveSeed(seed: number, salt: number): number {
  const mixed = Math.imul(normalizeSeed(seed), 1664525) ^ Math.imul(normalizeSeed(salt), 1013904223);
  return normalizeSeed(mixed);
}

export function randomSeed(): number {
  return Math.floor(Math.random() * 2147483647) + 1;
}