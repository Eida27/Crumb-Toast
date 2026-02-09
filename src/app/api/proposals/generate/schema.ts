import { z } from "zod";

export const BodySchema = z.object({
  jobTitle: z.string().min(3).max(120),
  jobDescription: z.string().min(30).max(6000),
  angle: z.enum(["authority", "scarcity", "loss_aversion", "status", "neutral"]),
  tone: z.enum(["premium", "friendly", "direct"]),
  proof: z.string().max(2000).optional().default(""),
});
