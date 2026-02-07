"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { UpgradeDialog } from "@/components/billing/upgrade-dialog";

type ProposalRow = {
  id: string;
  job_title: string;
  angle: string;
  tone: string;
  created_at: string;
  proposal_md: string;
};

const ANGLE_META: Record<string, { label: string; hint: string; badge: string }> =
  {
    authority: {
      label: "Authority",
      hint: "Signals competence + control. Client feels safe choosing you.",
      badge: "Safe Bet",
    },
    scarcity: {
      label: "Scarcity",
      hint: "Ethical scarcity: boundaries + limited slots. Premium positioning.",
      badge: "Booked",
    },
    loss_aversion: {
      label: "Loss Aversion",
      hint: "Makes delay feel expensive: risks + opportunity cost, not fear.",
      badge: "Urgency",
    },
    status: {
      label: "Status",
      hint: "High-end vibe: standards, process, and outcomes > cheap labor.",
      badge: "Premium",
    },
    neutral: {
      label: "Neutral",
      hint: "Clean, direct, professional. No psychological spice.",
      badge: "Classic",
    },
  };

const TONE_META: Record<string, { label: string; badge: string }> = {
  premium: { label: "Premium", badge: "High-Status" },
  friendly: { label: "Friendly", badge: "Warm" },
  direct: { label: "Direct", badge: "Sharp" },
};

export default function DashboardClient({
  email,
  initialCredits,
  initialProposals,
}: {
  email: string;
  initialCredits: number;
  initialProposals: ProposalRow[];
}) {
  const router = useRouter();
  const supabase = createClient();

  const [credits, setCredits] = useState<number>(initialCredits ?? 0);
  const [proposals, setProposals] = useState<ProposalRow[]>(
    initialProposals ?? []
  );

  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [proof, setProof] = useState("");

  const [angle, setAngle] = useState<string>("authority");
  const [tone, setTone] = useState<string>("premium");

  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);

  // ✅ Refresh credits on page load (useful after returning from Lemon checkout)
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/credits", { method: "GET" });
        if (!res.ok) return;
        const data = await res.json();
        if (typeof data.balance === "number") setCredits(data.balance);
      } catch {
        // silent (no toast) - avoid annoying users on load
      }
    })();
  }, []);

  const canGenerate = useMemo(() => {
    const jt = jobTitle.trim().length >= 3;
    const jd = jobDescription.trim().length >= 30;
    return jt && jd && !loading && credits > 0;
  }, [jobTitle, jobDescription, loading, credits]);

  async function logout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  async function generate() {
    if (credits <= 0) {
      toast.error("No credits left. Upgrade to continue.");
      return;
    }
    if (jobTitle.trim().length < 3) {
      toast.error("Add a job title (at least 3 characters).");
      return;
    }
    if (jobDescription.trim().length < 30) {
      toast.error("Paste a longer job description (at least 30 characters).");
      return;
    }

    setLoading(true);
    setOutput("");

    try {
      const res = await fetch("/api/proposals/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobTitle, jobDescription, proof, angle, tone }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data?.error ?? "Generation failed.");
        return;
      }

      setOutput(data.proposal ?? "");
      setCredits(typeof data.newBalance === "number" ? data.newBalance : credits);

      if (data.saved) {
        setProposals((prev) => [data.saved, ...prev].slice(0, 10));
      }

      toast.success("Proposal generated.");
    } catch {
      toast.error("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard.");
    } catch {
      toast.error("Copy failed. Try again.");
    }
  }

  return (
    <main className="min-h-screen bg-black text-white">
      {/* Subtle premium background */}
      <div className="pointer-events-none fixed inset-0 opacity-60">
        <div className="absolute -top-24 left-1/2 h-64 w-[900px] -translate-x-1/2 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute top-1/3 left-10 h-52 w-52 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute bottom-20 right-10 h-52 w-52 rounded-full bg-white/5 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 py-10">
        {/* Header */}
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">
              BidWinner AI
            </h1>
            <p className="mt-1 text-sm text-white/60">
              Logged in as <span className="text-white/80">{email}</span>
            </p>
            <p className="mt-2 text-sm text-white/60">
              Your edge:{" "}
              <span className="text-white/80">
                authority, urgency, and premium framing
              </span>{" "}
              — without lying.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Badge
              variant={credits > 0 ? "secondary" : "destructive"}
              className="border border-white/10 bg-white/5 text-white"
            >
              Credits: {credits}
            </Badge>

            <UpgradeDialog />

            <Link href="/billing">
              <Button
                variant="secondary"
                className="border border-white/10 bg-white/5 text-white hover:bg-white/10"
              >
                Billing
              </Button>
            </Link>

            <Button
              onClick={logout}
              className="bg-white text-black hover:bg-white/90"
            >
              Logout
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* LEFT: Generator */}
          <Card className="border-white/10 bg-white/5">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Generate proposal</span>
                <Badge className="border border-white/10 bg-black/30 text-white">
                  {ANGLE_META[angle]?.badge ?? "Angle"}
                </Badge>
              </CardTitle>
              <p className="text-sm text-white/60">
                Paste the job post. Choose your angle. Output becomes copy-ready.
              </p>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm text-white/70">Job title</label>
                <Input
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="e.g. Need a Python developer to scrape a website"
                  className="border-white/10 bg-black/30 text-white placeholder:text-white/30"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm text-white/70">Job description</label>
                <Textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste the full job post here..."
                  className="min-h-[180px] border-white/10 bg-black/30 text-white placeholder:text-white/30"
                />
                <p className="text-xs text-white/50">
                  More context = higher reply rate.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm text-white/70">Power angle</label>
                  <Select value={angle} onValueChange={setAngle}>
                    <SelectTrigger className="border-white/10 bg-black/30 text-white">
                      <SelectValue placeholder="Select angle" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="authority">Authority</SelectItem>
                      <SelectItem value="scarcity">Scarcity</SelectItem>
                      <SelectItem value="loss_aversion">Loss Aversion</SelectItem>
                      <SelectItem value="status">Status</SelectItem>
                      <SelectItem value="neutral">Neutral</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-white/50">
                    {ANGLE_META[angle]?.hint}
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-white/70">Tone</label>
                  <Select value={tone} onValueChange={setTone}>
                    <SelectTrigger className="border-white/10 bg-black/30 text-white">
                      <SelectValue placeholder="Select tone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="premium">Premium</SelectItem>
                      <SelectItem value="friendly">Friendly</SelectItem>
                      <SelectItem value="direct">Direct</SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="flex items-center gap-2 pt-1">
                    <Badge className="border border-white/10 bg-black/30 text-white">
                      {TONE_META[tone]?.badge ?? "Tone"}
                    </Badge>
                    <span className="text-xs text-white/50">
                      {TONE_META[tone]?.label}
                    </span>
                  </div>
                </div>
              </div>

              <Separator className="bg-white/10" />

              <div className="space-y-2">
                <label className="text-sm text-white/70">Proof (truth only)</label>
                <Textarea
                  value={proof}
                  onChange={(e) => setProof(e.target.value)}
                  placeholder="Portfolio links, real metrics, relevant stack, past results you can prove..."
                  className="min-h-[90px] border-white/10 bg-black/30 text-white placeholder:text-white/30"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={generate}
                  disabled={!canGenerate}
                  className="bg-white text-black hover:bg-white/90 disabled:opacity-50"
                >
                  {loading ? "Generating..." : "Generate (1 credit)"}
                </Button>

                <Button
                  variant="secondary"
                  onClick={() => {
                    setJobTitle("");
                    setJobDescription("");
                    setProof("");
                    setOutput("");
                    toast.message("Cleared.");
                  }}
                  className="border border-white/10 bg-white/5 text-white hover:bg-white/10"
                >
                  Clear
                </Button>
              </div>

              {credits <= 0 && (
                <p className="text-sm text-red-300">
                  You’re out of credits. Upgrade is the next build.
                </p>
              )}
            </CardContent>
          </Card>

          {/* RIGHT: Output + History */}
          <div className="space-y-6">
            <Card className="border-white/10 bg-white/5">
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <CardTitle>Output</CardTitle>
                <div className="flex items-center gap-2">
                  {output ? (
                    <>
                      <Button
                        variant="secondary"
                        className="border border-white/10 bg-white/5 text-white hover:bg-white/10"
                        onClick={() => copy(output)}
                      >
                        Copy
                      </Button>
                      <Button
                        variant="secondary"
                        className="border border-white/10 bg-white/5 text-white hover:bg-white/10"
                        onClick={() => toast.info("Export PDF comes next.")}
                      >
                        Export
                      </Button>
                    </>
                  ) : (
                    <Badge className="border border-white/10 bg-black/30 text-white">
                      Awaiting generation
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent>
                {loading ? (
                  <div className="space-y-3">
                    <div className="h-4 w-5/6 animate-pulse rounded bg-white/10" />
                    <div className="h-4 w-4/6 animate-pulse rounded bg-white/10" />
                    <div className="h-4 w-3/6 animate-pulse rounded bg-white/10" />
                    <div className="h-4 w-5/6 animate-pulse rounded bg-white/10" />
                  </div>
                ) : (
                  <pre className="min-h-[220px] whitespace-pre-wrap rounded-xl border border-white/10 bg-black/30 p-4 text-sm leading-relaxed text-white/90">
                    {output || "Generate once and your proposal appears here."}
                  </pre>
                )}
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-white/5">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>History</span>
                  <Badge className="border border-white/10 bg-black/30 text-white">
                    Last {proposals.length}
                  </Badge>
                </CardTitle>
                <p className="text-sm text-white/60">
                  Reuse winners. Your best proposals become templates.
                </p>
              </CardHeader>

              <CardContent>
                <ScrollArea className="h-[320px] pr-3">
                  {proposals.length === 0 ? (
                    <p className="text-sm text-white/60">No proposals yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {proposals.map((p) => (
                        <div
                          key={p.id}
                          className="rounded-xl border border-white/10 bg-black/20 p-4"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div>
                              <div className="font-medium text-white/90">
                                {p.job_title}
                              </div>
                              <div className="mt-1 text-xs text-white/50">
                                {new Date(p.created_at).toLocaleString()}
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <Badge className="border border-white/10 bg-black/30 text-white">
                                {p.angle}
                              </Badge>
                              <Badge
                                variant="secondary"
                                className="border border-white/10 bg-white/5 text-white"
                              >
                                {p.tone}
                              </Badge>
                            </div>
                          </div>

                          <Separator className="my-3 bg-white/10" />

                          <div className="flex flex-wrap gap-2">
                            <Button
                              variant="secondary"
                              className="border border-white/10 bg-white/5 text-white hover:bg-white/10"
                              onClick={() => {
                                setOutput(p.proposal_md);
                                toast.message("Loaded from history.");
                              }}
                            >
                              View
                            </Button>
                            <Button
                              variant="secondary"
                              className="border border-white/10 bg-white/5 text-white hover:bg-white/10"
                              onClick={() => copy(p.proposal_md)}
                            >
                              Copy
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
