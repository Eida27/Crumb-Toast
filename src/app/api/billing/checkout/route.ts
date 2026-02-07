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
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const tier = (body?.tier as Tier) ?? "starter";
  const pack = PACKS[tier] ?? PACKS.starter;

  const apiKey = process.env.LEMON_SQUEEZY_API_KEY!;
  const storeId = process.env.LEMON_SQUEEZY_STORE_ID!;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

  const payload = {
    data: {
      type: "checkouts",
      attributes: {
        product_options: {
          redirect_url: `${appUrl}/billing/success`,
          enabled_variants: [Number(pack.variantId)],
        },
        checkout_options: {
          background_color: "#000000",
          headings_color: "#FFFFFF",
          primary_text_color: "#FFFFFF",
          secondary_text_color: "#A1A1AA",
          borders_color: "#27272A",
          button_color: "#FFFFFF",
          button_text_color: "#000000",
        },
        checkout_data: {
          email: user.email,
          custom: {
            user_id: String(user.id),
            credits: String(pack.credits),  // ✅ MUST BE STRING
            tier: String(tier),
            pack: String(pack.label),
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
    body: JSON.stringify(payload),
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    const detail = json?.errors?.[0]?.detail ?? "Checkout failed";
    return NextResponse.json({ error: detail, raw: json }, { status: 400 });
  }

  return NextResponse.json({ url: json?.data?.attributes?.url });
}
