export type Seed = string | number;

export type WeightedOption<T> = {
  value: T;
  weight: number;
};

const UINT_32_MAX = 4_294_967_296;

function hashSeed(seed: Seed): number {
  if (typeof seed === "number" && Number.isFinite(seed)) {
    return seed >>> 0;
  }

  const text = String(seed);
  let hash = 2_166_136_261;

  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16_777_619);
  }

  return hash >>> 0;
}

export class Rng {
  private state: number;

  constructor(seed: Seed) {
    this.state = hashSeed(seed);
  }

  next(): number {
    this.state += 0x6d2b79f5;
    let t = this.state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / UINT_32_MAX;
  }

  intBetween(min: number, max: number): number {
    if (!Number.isInteger(min) || !Number.isInteger(max)) {
      throw new Error("intBetween requires integer bounds");
    }

    if (max < min) {
      throw new Error(`Invalid range: ${min}..${max}`);
    }

    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  floatBetween(min: number, max: number): number {
    if (max < min) {
      throw new Error(`Invalid range: ${min}..${max}`);
    }

    return this.next() * (max - min) + min;
  }

  bool(probability = 0.5): boolean {
    if (probability < 0 || probability > 1) {
      throw new Error("Probability must be between 0 and 1");
    }

    return this.next() < probability;
  }

  choice<T>(items: readonly T[]): T {
    if (items.length === 0) {
      throw new Error("Cannot choose from an empty list");
    }

    return items[this.intBetween(0, items.length - 1)];
  }

  weightedChoice<T>(options: readonly WeightedOption<T>[]): T {
    if (options.length === 0) {
      throw new Error("Cannot choose from an empty weighted list");
    }

    const totalWeight = options.reduce((sum, option) => {
      if (option.weight < 0) {
        throw new Error("Weights must be non-negative");
      }

      return sum + option.weight;
    }, 0);

    if (totalWeight <= 0) {
      throw new Error("At least one weight must be greater than zero");
    }

    let cursor = this.floatBetween(0, totalWeight);

    for (const option of options) {
      cursor -= option.weight;
      if (cursor <= 0) return option.value;
    }

    return options[options.length - 1].value;
  }

  shuffle<T>(items: readonly T[]): T[] {
    const copy = [...items];

    for (let i = copy.length - 1; i > 0; i--) {
      const j = this.intBetween(0, i);
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }

    return copy;
  }

  sample<T>(items: readonly T[], count: number): T[] {
    if (count < 0) {
      throw new Error("Sample count cannot be negative");
    }

    return this.shuffle(items).slice(0, count);
  }

  normalish(mean = 0, standardDeviation = 1): number {
    const sum = this.next() + this.next() + this.next() + this.next() + this.next() + this.next();
    return mean + (sum - 3) * standardDeviation;
  }
}

export function createRng(seed: Seed): Rng {
  return new Rng(seed);
}
