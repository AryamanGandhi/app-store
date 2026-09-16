import { describe, expect, it } from "vitest";
import { createRng, deriveSeed } from "@/lib/random";

describe("createRng", () => {
  it("same seed gives the same sequence", () => {
    const first = createRng(12345);
    const second = createRng(12345);

    expect(Array.from({ length: 10 }, () => first.next())).toEqual(
      Array.from({ length: 10 }, () => second.next()),
    );
  });

  it("different seeds give different sequences", () => {
    const first = createRng(100);
    const second = createRng(200);

    expect(Array.from({ length: 8 }, () => first.next())).not.toEqual(
      Array.from({ length: 8 }, () => second.next()),
    );
  });

  it("next() stays within [0, 1) over 1,000 calls", () => {
    const rng = createRng(42);

    for (let index = 0; index < 1000; index += 1) {
      const value = rng.next();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it("int stays within bounds and hits both ends over many calls", () => {
    const rng = createRng(99);
    const values = Array.from({ length: 5000 }, () => rng.int(1, 3));

    expect(values.every((value) => value >= 1 && value <= 3)).toBe(true);
    expect(values).toContain(1);
    expect(values).toContain(3);
  });

  it("shuffle keeps all items and doesn't mutate the input", () => {
    const rng = createRng(7);
    const original = ["A", "B", "C", "D"] as const;
    const shuffled = rng.shuffle(original);

    expect(original).toEqual(["A", "B", "C", "D"]);
    expect(shuffled).toHaveLength(original.length);
    expect([...shuffled].sort()).toEqual([...original].sort());
  });

  it("pick throws on an empty array", () => {
    const rng = createRng(1);

    expect(() => rng.pick([])).toThrow("Cannot pick from an empty array");
  });

  it("deriveSeed is deterministic and varies by salt", () => {
    expect(deriveSeed(123, 1)).toBe(deriveSeed(123, 1));
    expect(deriveSeed(123, 1)).not.toBe(deriveSeed(123, 2));
  });
});