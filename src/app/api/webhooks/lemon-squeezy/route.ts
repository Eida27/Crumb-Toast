import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserIdFromPayload } from "@/lib/lemon-squeezy";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ ok: true });
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  const secret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "Missing LEMON_SQUEEZY_WEBHOOK_SECRET" },
      { status: 500 }
    );
  }
  const signatureHeader = req.headers.get("x-signature") || "";

  const computedHex = crypto
    .createHmac("sha256", secret)
    .update(rawBody, "utf8")
    .digest("hex");

  // Compare as HEX buffers (more correct than utf8 for signatures)
  const sigOk =
    signatureHeader &&
    signatureHeader.length === computedHex.length &&
    crypto.timingSafeEqual(
      Buffer.from(computedHex, "hex"),
      Buffer.from(signatureHeader, "hex")
    );

  if (!sigOk) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const payload = JSON.parse(rawBody);
  const eventName = req.headers.get("x-event-name") || "unknown";

  const userId = getUserIdFromPayload(payload);

  console.log("[LEMON]", {
    eventName,
    status: payload?.data?.attributes?.status,
    custom_data: payload?.meta?.custom_data,
  });

  // Idempotency
  const eventHash = crypto.createHash("sha256").update(rawBody).digest("hex");
  const admin = createAdminClient();

  const ins = await admin
    .from("billing_webhook_events")
    .insert({ event_hash: eventHash, event_name: eventName, payload })
    .select("id")
    .single();

  if (ins.error?.code === "23505") {
    return NextResponse.json({ ok: true, duplicate: true });
  }
  if (ins.error) {
    return NextResponse.json({ error: ins.error.message }, { status: 500 });
  }

  // One-time purchase top-up
  if (eventName === "order_created") {
    const status = String(payload?.data?.attributes?.status ?? "").toLowerCase();
    if (status !== "paid") {
      return NextResponse.json({ ok: true, ignored: `order status: ${status}` });
    }

    if (!userId) {
      return NextResponse.json({ ok: true, ignored: "missing user_id" });
    }

    const rawCredits = payload?.meta?.custom_data?.credits ?? "100";
    const creditsToGrant = Number(rawCredits);

    if (!Number.isFinite(creditsToGrant) || creditsToGrant <= 0) {
      return NextResponse.json({ ok: true, ignored: "invalid credits" });
    }

    const creditRes = await admin.rpc("grant_credits", {
      p_user_id: userId,
      p_amount: creditsToGrant,
    });

    if (creditRes.error) {
      return NextResponse.json(
        { error: creditRes.error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, credited: creditsToGrant });
  }

  return NextResponse.json({ ok: true, ignored: eventName });
}
