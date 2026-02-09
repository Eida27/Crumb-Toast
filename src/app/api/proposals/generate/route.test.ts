import test from "node:test";
import assert from "node:assert";
import { BodySchema } from "./schema.ts";

test("BodySchema validates valid input", () => {
  const input = {
    jobTitle: "Senior React Developer",
    jobDescription: "We need a React developer with 5 years of experience to build a new dashboard. " + "a".repeat(30),
    angle: "authority",
    tone: "premium",
    proof: "I have built similar dashboards for 3 Fortune 500 companies.",
  };
  const result = BodySchema.safeParse(input);
  assert.strictEqual(result.success, true);
  if (result.success) {
      assert.deepStrictEqual(result.data, input);
  }
});

test("BodySchema allows optional proof to be omitted", () => {
  const input = {
    jobTitle: "Senior React Developer",
    jobDescription: "We need a React developer with 5 years of experience to build a new dashboard. " + "a".repeat(30),
    angle: "neutral",
    tone: "friendly",
  };
  const result = BodySchema.safeParse(input);
  assert.strictEqual(result.success, true);
  if (result.success) {
      assert.strictEqual(result.data.proof, "");
  }
});

test("BodySchema fails on missing required fields", () => {
  const input = {
    jobTitle: "Senior React Developer",
    // Missing jobDescription, angle, tone
  };
  const result = BodySchema.safeParse(input);
  assert.strictEqual(result.success, false);
  if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      assert.ok(fieldErrors.jobDescription);
      assert.ok(fieldErrors.angle);
      assert.ok(fieldErrors.tone);
  }
});

test("BodySchema fails on invalid jobTitle length (too short)", () => {
  const input = {
    jobTitle: "Re", // < 3 chars
    jobDescription: "We need a React developer with 5 years of experience to build a new dashboard. " + "a".repeat(30),
    angle: "authority",
    tone: "premium",
  };
  const result = BodySchema.safeParse(input);
  assert.strictEqual(result.success, false);
  if (!result.success) {
      assert.ok(result.error.flatten().fieldErrors.jobTitle);
  }
});

test("BodySchema fails on invalid jobTitle length (too long)", () => {
  const input = {
    jobTitle: "a".repeat(121), // > 120 chars
    jobDescription: "We need a React developer with 5 years of experience to build a new dashboard. " + "a".repeat(30),
    angle: "authority",
    tone: "premium",
  };
  const result = BodySchema.safeParse(input);
  assert.strictEqual(result.success, false);
  if (!result.success) {
      assert.ok(result.error.flatten().fieldErrors.jobTitle);
  }
});

test("BodySchema fails on invalid jobDescription length (too short)", () => {
  const input = {
    jobTitle: "Senior React Developer",
    jobDescription: "Too short description.", // < 30 chars
    angle: "authority",
    tone: "premium",
  };
  const result = BodySchema.safeParse(input);
  assert.strictEqual(result.success, false);
  if (!result.success) {
      assert.ok(result.error.flatten().fieldErrors.jobDescription);
  }
});

test("BodySchema fails on invalid jobDescription length (too long)", () => {
  const input = {
    jobTitle: "Senior React Developer",
    jobDescription: "a".repeat(6001), // > 6000 chars
    angle: "authority",
    tone: "premium",
  };
  const result = BodySchema.safeParse(input);
  assert.strictEqual(result.success, false);
  if (!result.success) {
      assert.ok(result.error.flatten().fieldErrors.jobDescription);
  }
});

test("BodySchema fails on invalid angle enum value", () => {
  const input = {
    jobTitle: "Senior React Developer",
    jobDescription: "We need a React developer with 5 years of experience to build a new dashboard. " + "a".repeat(30),
    angle: "invalid_angle",
    tone: "premium",
  };
  const result = BodySchema.safeParse(input);
  assert.strictEqual(result.success, false);
  if (!result.success) {
      assert.ok(result.error.flatten().fieldErrors.angle);
  }
});

test("BodySchema fails on invalid tone enum value", () => {
  const input = {
    jobTitle: "Senior React Developer",
    jobDescription: "We need a React developer with 5 years of experience to build a new dashboard. " + "a".repeat(30),
    angle: "authority",
    tone: "invalid_tone",
  };
  const result = BodySchema.safeParse(input);
  assert.strictEqual(result.success, false);
  if (!result.success) {
      assert.ok(result.error.flatten().fieldErrors.tone);
  }
});

test("BodySchema fails on invalid proof length (too long)", () => {
  const input = {
    jobTitle: "Senior React Developer",
    jobDescription: "We need a React developer with 5 years of experience to build a new dashboard. " + "a".repeat(30),
    angle: "authority",
    tone: "premium",
    proof: "a".repeat(2001), // > 2000 chars
  };
  const result = BodySchema.safeParse(input);
  assert.strictEqual(result.success, false);
  if (!result.success) {
      assert.ok(result.error.flatten().fieldErrors.proof);
  }
});
