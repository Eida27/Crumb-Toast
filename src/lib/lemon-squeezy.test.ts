import test from "node:test";
import assert from "node:assert";
import { getUserIdFromPayload } from "./lemon-squeezy.ts";

test("getUserIdFromPayload extracts user_id from meta.custom_data", () => {
  const payload = {
    meta: {
      custom_data: {
        user_id: "user_123",
      },
    },
  };
  assert.strictEqual(getUserIdFromPayload(payload), "user_123");
});

test("getUserIdFromPayload extracts user_id from meta.custom", () => {
  const payload = {
    meta: {
      custom: {
        user_id: "user_456",
      },
    },
  };
  assert.strictEqual(getUserIdFromPayload(payload), "user_456");
});

test("getUserIdFromPayload extracts userId from meta.custom_data", () => {
  const payload = {
    meta: {
      custom_data: {
        userId: "user_789",
      },
    },
  };
  assert.strictEqual(getUserIdFromPayload(payload), "user_789");
});

test("getUserIdFromPayload extracts userId from meta.custom", () => {
  const payload = {
    meta: {
      custom: {
        userId: "user_012",
      },
    },
  };
  assert.strictEqual(getUserIdFromPayload(payload), "user_012");
});

test("getUserIdFromPayload handles numeric user ID", () => {
  const payload = {
    meta: {
      custom_data: {
        user_id: 12345,
      },
    },
  };
  assert.strictEqual(getUserIdFromPayload(payload), "12345");
});

test("getUserIdFromPayload returns undefined when user ID is missing", () => {
  const payload = {
    meta: {
      custom_data: {},
    },
  };
  assert.strictEqual(getUserIdFromPayload(payload), undefined);
});

test("getUserIdFromPayload returns undefined when payload is empty", () => {
  assert.strictEqual(getUserIdFromPayload({}), undefined);
});

test("getUserIdFromPayload returns undefined when payload is null", () => {
  assert.strictEqual(getUserIdFromPayload(null), undefined);
});

test("getUserIdFromPayload follows priority order", () => {
  const payload = {
    meta: {
      custom_data: {
        user_id: "priority_1",
        userId: "priority_3",
      },
      custom: {
        user_id: "priority_2",
        userId: "priority_4",
      },
    },
  };
  assert.strictEqual(getUserIdFromPayload(payload), "priority_1");
});
