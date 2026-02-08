import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const PACKS = {
  starter: { variantId: "1283005", credits: 100, label: "Starter" },
  pro: { variantId: "1286595", credits: 500, label: "Pro" },
  beast: { variantId: "1286597", credits: 2000, label: "Beast" },
} as const;

type Tier = keyof typeof PACKS;

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Read tier once
  const body = (await req.json().catch(() => ({}))) as { tier?: string };
  const tier = (body.tier && body.tier in PACKS ? body.tier : "starter") as Tier;
  const pack = PACKS[tier];

  const apiKey = process.env.LEMON_SQUEEZY_API_KEY;
  const storeId = process.env.LEMON_SQUEEZY_STORE_ID;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!apiKey || !storeId || !appUrl) {
    return NextResponse.json(
      { error: "Missing LEMON_SQUEEZY_API_KEY / LEMON_SQUEEZY_STORE_ID / NEXT_PUBLIC_APP_URL" },
      { status: 500 }
    );
  }

  // NOTE: Lemon requires custom fields to be strings
  const lsBody = {
    data: {
      type: "checkouts",
      attributes: {
        product_options: {
          redirect_url: `${appUrl}/billing/success`,
        },
        checkout_data: {
          email: user.email ?? undefined,
          custom: {
            user_id: String(user.id),
            tier: String(tier),
            credits: String(pack.credits),
          },
        },
      },
      relationships: {
        store: { data: { type: "stores", id: String(storeId) } },
        variant: { data: { type: "variants", id: String(pack.variantId) } },
      },
    },
  };

  const res = await fetch("https://api.lemonsqueezy.com/v1/checkouts", {
    method: "POST",
    headers: {
      Accept: "application/vnd.api+json",
      "Content-Type": "application/vnd.api+json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(lsBody),
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    const detail = json?.errors?.[0]?.detail ?? "Checkout failed";
    return NextResponse.json({ error: detail, raw: json }, { status: 400 });
  }

  const url = json?.data?.attributes?.url;
  if (!url) {
    return NextResponse.json({ error: "Missing checkout URL", raw: json }, { status: 500 });
  }

  return NextResponse.json({ url });
}
