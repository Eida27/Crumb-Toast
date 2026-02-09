
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { resolveTierAndPack, PACKS } from "./logic.ts";

describe("Checkout Logic - resolveTierAndPack", () => {
  it("should return the correct tier and pack for valid inputs", () => {
    const validInputs = ["starter", "pro", "beast"] as const;

    for (const input of validInputs) {
      const result = resolveTierAndPack(input);
      assert.strictEqual(result.tier, input);
      assert.deepStrictEqual(result.pack, PACKS[input]);
    }
  });

  it("should fallback to 'starter' when input is undefined", () => {
    const result = resolveTierAndPack(undefined);
    assert.strictEqual(result.tier, "starter");
    assert.deepStrictEqual(result.pack, PACKS["starter"]);
  });

  it("should fallback to 'starter' when input is an empty string", () => {
    const result = resolveTierAndPack("");
    assert.strictEqual(result.tier, "starter");
    assert.deepStrictEqual(result.pack, PACKS["starter"]);
  });

  it("should fallback to 'starter' when input is an invalid string", () => {
    const result = resolveTierAndPack("invalid_tier");
    assert.strictEqual(result.tier, "starter");
    assert.deepStrictEqual(result.pack, PACKS["starter"]);
  });

  it("should verify pack object retrieval for each tier", () => {
    // Specifically verify the structure of the retrieved pack matches expectations
    // This double checks that PACKS structure hasn't inadvertently changed or broken
    const starterResult = resolveTierAndPack("starter");
    assert.strictEqual(starterResult.pack.credits, 100);
    assert.strictEqual(starterResult.pack.label, "Starter");

    const proResult = resolveTierAndPack("pro");
    assert.strictEqual(proResult.pack.credits, 500);
    assert.strictEqual(proResult.pack.label, "Pro");

    const beastResult = resolveTierAndPack("beast");
    assert.strictEqual(beastResult.pack.credits, 2000);
    assert.strictEqual(beastResult.pack.label, "Beast");
  });
});
