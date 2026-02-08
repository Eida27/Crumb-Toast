import { NextResponse } from "next/server";
import OpenAI from "openai";
import { z } from "zod";
import crypto from "node:crypto";
import { createClient } from "@/lib/supabase/server";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BodySchema = z.object({
  jobTitle: z.string().min(3).max(120),
  jobDescription: z.string().min(30).max(6000),
  angle: z.enum(["authority", "scarcity", "loss_aversion", "status", "neutral"]),
  tone: z.enum(["premium", "friendly", "direct"]),
  proof: z.string().max(2000).optional().default(""),
});

const angleInstructions: Record<string, string> = {
  authority: "Credibility-first. Confident structure. No fluff.",
  scarcity: "Ethical scarcity: limited slots/bandwidth. No fake deadlines.",
  loss_aversion: "Explain cost of delay grounded in context. No fearmongering.",
  status: "Premium positioning: process, standards, boundaries.",
  neutral: "Straightforward, professional, helpful.",
};

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

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
  }
  const client = new OpenAI({ apiKey });

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
