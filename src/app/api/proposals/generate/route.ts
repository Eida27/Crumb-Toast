import { NextResponse } from "next/server";
import OpenAI from "openai";
import crypto from "node:crypto";
import { createClient } from "@/lib/supabase/server";
import { BodySchema } from "./schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const angleInstructions: Record<string, string> = {
  authority: "Credibility-first. Confident structure. No fluff.",
  scarcity: "Ethical scarcity: limited slots/bandwidth. No fake deadlines.",
  loss_aversion: "Explain cost of delay grounded in context. No fearmongering.",
  status: "Premium positioning: process, standards, boundaries.",
  neutral: "Straightforward, professional, helpful.",
};

const apiKey = process.env.OPENAI_API_KEY;
const client = apiKey ? new OpenAI({ apiKey }) : null;

export async function POST(req: Request) {
  const supabase = await createClient(); // ✅ IMPORTANT: await

  const { data: { user }, error: userErr } = await supabase.auth.getUser();
  if (userErr || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = BodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { jobTitle, jobDescription, angle, tone, proof } = parsed.data;

  // Spend 1 credit (atomic)
  const spend = await supabase.rpc("spend_credits", { p_amount: 1 });
  if (spend.error) {
    return NextResponse.json({ error: "No credits left." }, { status: 402 });
  }

  if (!client) {
    return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
  }

  const system = [
    "You are BidWinner AI: proposal writer optimized for replies.",
    "Never invent experience, clients, or metrics.",
    "If proof is missing, speak in process and intent, not claims.",
    "Output in clean Markdown. Skimmable. Strong 2-line hook.",
    "Include: deliverables, timeline, and 2 CTA questions.",
  ].join("\n");

  const prompt = [
    `Angle: ${angle} — ${angleInstructions[angle]}`,
    `Tone: ${tone}`,
    "",
    `Job Title: ${jobTitle}`,
    `Job Description:\n${jobDescription}`,
    "",
    proof ? `Truthful proof:\n${proof}` : "Proof: none provided.",
    "",
    "Write the proposal now in Markdown.",
  ].join("\n");

  const response = await client.responses.create({
    model: "gpt-4o-mini",
    max_output_tokens: 850,
    temperature: 0.6,
    safety_identifier: crypto.createHash("sha256").update(user.id).digest("hex"),
    input: [
      { role: "developer", content: system },
      { role: "user", content: prompt },
    ],
  });

  const proposal = (response.output_text ?? "").trim();

  const insert = await supabase
    .from("proposals")
    .insert({
      user_id: user.id,
      job_title: jobTitle,
      job_description: jobDescription,
      angle,
      tone,
      proposal_md: proposal,
    })
    .select("id, job_title, angle, tone, created_at, proposal_md")
    .single();

  if (insert.error) {
    return NextResponse.json({ error: "Failed to save proposal." }, { status: 500 });
  }

  return NextResponse.json({
    proposal,
    newBalance: spend.data,
    saved: insert.data,
  });
}
