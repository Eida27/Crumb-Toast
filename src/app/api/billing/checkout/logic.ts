
export const PACKS = {
  starter: { variantId: "1283005", credits: 100, label: "Starter" },
  pro: { variantId: "1286595", credits: 500, label: "Pro" },
  beast: { variantId: "1286597", credits: 2000, label: "Beast" },
} as const;

export type Tier = keyof typeof PACKS;

export function resolveTierAndPack(inputTier?: string): { tier: Tier; pack: (typeof PACKS)[Tier] } {
  const tier = (inputTier && inputTier in PACKS ? inputTier : "starter") as Tier;
  const pack = PACKS[tier];
  return { tier, pack };
}
