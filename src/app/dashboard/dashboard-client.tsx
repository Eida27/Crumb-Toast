"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

import { createClient } from "@/lib/supabase/client";

import { Button } from "@/components/ui/button";
import { TypewriterText } from "@/components/ui/typewriter-text";
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

import Link from "next/link";
import { UpgradeDialog } from "@/components/billing/upgrade-dialog";
import { CopyButton } from "@/components/copy-button";
import { MobileNav } from "@/components/mobile-nav";
import { Menu } from "lucide-react";

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

const MotionButton = motion.create(Button);
const MotionCard = motion.create(Card);

export default function DashboardClient({
  userId,
  email,
  initialCredits,
  initialProposals,
}: {
  userId: string;
  email: string;
  initialCredits: number;
  initialProposals: ProposalRow[];
}) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const searchParams = useSearchParams();
  const fromPurchase = searchParams.get("purchase") === "1";
  const fromConfirmation = searchParams.get("confirmed") === "1";
  const [syncing, setSyncing] = useState<boolean>(fromPurchase);
  const lastErrorRef = useRef<string | null>(null);

  useEffect(() => {
    if (!fromPurchase) return;
    const t = setTimeout(() => setSyncing(false), 60000);
    return () => clearTimeout(t);
  }, [fromPurchase]);

  useEffect(() => {
    if (!fromConfirmation) return;
    toast.success("Email confirmed! You're now signed in.");
  }, [fromConfirmation]);

  const [credits, setCredits] = useState<number>(initialCredits ?? 0);
  const creditsRef = useRef<number>(initialCredits ?? 0);
  const [creditsStatus, setCreditsStatus] = useState<"idle" | "loading" | "error">(
    "idle"
  );
  const [creditsError, setCreditsError] = useState<string | null>(null);
  const [lastCreditsCheck, setLastCreditsCheck] = useState<Date | null>(null);
  const [lastCreditsSuccess, setLastCreditsSuccess] = useState<Date | null>(null);
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

  const [mobileOpen, setMobileOpen] = useState(false);

  const applyCreditsUpdate = useCallback(
    (nextBalance: number, options: { silentToast?: boolean } = {}) => {
      const prevBalance = creditsRef.current;
      creditsRef.current = nextBalance;
      setCredits(nextBalance);

      const delta = nextBalance - prevBalance;
      if (delta > 0 && !options.silentToast) {
        toast.success(`Credits added: +${delta}`);
        setSyncing(false);
      }
      if (nextBalance > prevBalance && options.silentToast) {
        setSyncing(false);
      }
    },
    []
  );

  const refreshCredits = useCallback(
    async ({ silent }: { silent?: boolean } = {}) => {
      setCreditsStatus("loading");
      setCreditsError(null);
      try {
        const res = await fetch("/api/credits", {
          method: "GET",
          cache: "no-store",
        });

        let data: { balance?: number; error?: string } | null = null;
        try {
          data = await res.json();
        } catch {
          data = null;
        }

        if (res.status === 401) {
          setCreditsStatus("error");
          setCreditsError("Session expired. Please sign in again.");
          if (!silent) {
            toast.error("Session expired. Please sign in again.");
          }
          router.push("/login");
          return;
        }

        if (!res.ok) {
          const message =
            data?.error ?? `Failed to load credits (status ${res.status}).`;
          throw new Error(message);
        }

        if (typeof data?.balance !== "number") {
          throw new Error("Credits response was missing a balance.");
        }

        applyCreditsUpdate(data.balance, { silentToast: silent });

        setLastCreditsSuccess(new Date());
        setCreditsStatus("idle");
        lastErrorRef.current = null;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unable to fetch credits.";
        setCreditsStatus("error");
        setCreditsError(message);

        if (!silent && lastErrorRef.current !== message) {
          toast.error(message);
        }
        lastErrorRef.current = message;
      } finally {
        setLastCreditsCheck(new Date());
      }
    },
    [applyCreditsUpdate, router]
  );

  // ✅ Credits sync: realtime first, polling fallback
  useEffect(() => {
    // 1) immediate fetch
    refreshCredits();

    // 2) realtime subscription (instant updates)
    const channel = supabase
      .channel(`credits:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "credits",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const next = (payload.new as { balance?: number } | null)?.balance;
          if (typeof next === "number") {
            applyCreditsUpdate(next);
          }
        }
      )
      .subscribe();

    // 3) burst polling (covers webhook delay)
    const fast = setInterval(() => refreshCredits({ silent: true }), 3000);
    const fastStop = setTimeout(() => clearInterval(fast), 45000);

    // 4) slow polling fallback (covers realtime disabled / flaky)
    const slow = setInterval(() => refreshCredits({ silent: true }), 30000);

    return () => {
      clearInterval(fast);
      clearTimeout(fastStop);
      clearInterval(slow);
      supabase.removeChannel(channel);
    };
  }, [applyCreditsUpdate, refreshCredits, supabase, userId]);

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
      if (typeof data.newBalance === "number") {
        applyCreditsUpdate(data.newBalance, { silentToast: true });
      }

      if (data.saved) {
        setProposals((prev) => [data.saved, ...prev].slice(0, 10));
      }

      toast.success("LETHAL COPY DEPLOYED.");
    } catch {
      toast.error("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#050505] text-white overflow-x-hidden selection:bg-[#00f3ff] selection:text-black">
      {/* Cyberpunk Grid Background */}
      <div className="fixed inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: "linear-gradient(rgba(0, 243, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 243, 255, 0.05) 1px, transparent 1px)",
          backgroundSize: "40px 40px"
        }}
      />

      {/* Ambient Glows */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[10%] w-[600px] h-[600px] bg-[#00f3ff]/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[10%] w-[600px] h-[600px] bg-[#39ff14]/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-8 z-10">
        {syncing && (
          <div className="mb-5 rounded-none border-l-4 border-[#39ff14] bg-[#39ff14]/5 p-4 backdrop-blur-md">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="text-sm font-bold text-[#39ff14] uppercase tracking-widest">
                  Processing Payment
                </div>
                <div className="mt-1 text-xs text-white/60 font-mono">
                  Funds securing... Credits will deploy automatically.
                </div>
              </div>
              <Badge className="border border-[#39ff14] bg-[#39ff14]/10 text-[#39ff14] animate-pulse rounded-none">
                SYNCING
              </Badge>
            </div>
          </div>
        )}

        {/* Header */}
        {/* Mobile Header */}
        <div className="mb-6 flex items-center justify-between lg:hidden border-b border-white/5 pb-4">
          <h1 className="text-2xl font-black tracking-tighter text-white uppercase italic">
            Crumb Toast
          </h1>
          <Button variant="ghost" size="icon" onClick={() => setMobileOpen(true)} className="text-white">
            <Menu className="h-6 w-6" />
          </Button>
        </div>

        <MobileNav
          isOpen={mobileOpen}
          onClose={() => setMobileOpen(false)}
          email={email}
          credits={credits}
          onLogout={logout}
        >
           <UpgradeDialog />
        </MobileNav>

        <div className="hidden lg:flex mb-8 flex-wrap items-end justify-between gap-6 border-b border-white/5 pb-6">
          <div>
            <h1
              className="text-4xl font-black tracking-tighter text-white uppercase italic"
              style={{
                textShadow: "0 0 20px rgba(0, 243, 255, 0.3)"
              }}
            >
              Crumb Toast: <span className="text-[#00f3ff]">The Edge</span>
            </h1>
            <p className="mt-2 text-sm text-gray-400 font-mono">
              Logged in as <span className="text-white">{email}</span>
            </p>
            <p className="mt-2 text-lg text-white/90 font-light">
              While they sleep, <span className="text-[#39ff14] font-semibold">you dominate</span>. Authority, Urgency, and Control—on demand.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Badge
              variant="outline"
              className="border-[#39ff14]/50 bg-[#39ff14]/5 text-[#39ff14] shadow-[0_0_10px_rgba(57,255,20,0.2)] animate-pulse rounded-sm px-3 py-1 text-xs uppercase tracking-widest"
            >
              SYSTEM: HUNTING
            </Badge>

            <Badge
              className={`border border-white/10 bg-black/50 backdrop-blur-md text-white rounded-sm px-3 py-1 font-mono ${credits === 0 ? "text-red-500 border-red-500/50" : ""}`}
            >
              AMMO: {credits}
            </Badge>

            <UpgradeDialog />

            <Link href="/billing">
              <Button
                variant="ghost"
                className="border border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-[#00f3ff] rounded-sm uppercase tracking-wider text-xs font-bold"
              >
                Arsenal
              </Button>
            </Link>

            <Button
              onClick={logout}
              variant="ghost"
              className="text-white/50 hover:text-white hover:bg-transparent"
            >
              Logout
            </Button>
          </div>
        </div>

        {credits <= 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 border border-red-500/30 bg-red-500/5 p-4 rounded-sm"
          >
             <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="text-sm font-bold text-red-500 uppercase tracking-widest">
                  CRITICAL ALERT: OUT OF AMMO
                </div>
                <p className="mt-1 text-sm text-red-200/70 font-mono">
                  Reload immediately to maintain competitive advantage.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <UpgradeDialog />
              </div>
            </div>
          </motion.div>
        )}

        <div className="grid gap-8 lg:grid-cols-2">
          {/* LEFT: Generator */}
          <MotionCard
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="border-white/10 bg-black/40 backdrop-blur-xl rounded-none relative overflow-hidden group"
          >
            {/* Neon Border Effect */}
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#00f3ff]/50 to-transparent" />
            <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#00f3ff]/50 to-transparent" />

            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="text-[#00f3ff] font-bold uppercase tracking-widest text-sm">
                   /// Target Parameters
                </span>
                <Badge className="border border-white/10 bg-black text-white/70 rounded-none font-mono text-xs">
                  {ANGLE_META[angle]?.badge ?? "Angle"}
                </Badge>
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs text-[#00f3ff]/70 font-mono uppercase tracking-widest">Job Title</label>
                <Input
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="e.g. Need a Python developer to scrape a website"
                  className="border-white/10 bg-black/50 text-white placeholder:text-white/20 rounded-none focus:border-[#00f3ff] focus:ring-1 focus:ring-[#00f3ff]/50 transition-all duration-300"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs text-[#00f3ff]/70 font-mono uppercase tracking-widest">Target Requirements</label>
                <Textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste the target's requirements here. We will dismantle them."
                  className="min-h-[180px] border-white/10 bg-black/50 text-white placeholder:text-white/20 rounded-none focus:border-[#00f3ff] focus:ring-1 focus:ring-[#00f3ff]/50 transition-all duration-300 font-mono text-sm"
                />
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs text-[#00f3ff]/70 font-mono uppercase tracking-widest">Attack Angle</label>
                  <Select value={angle} onValueChange={setAngle}>
                    <SelectTrigger className="border-white/10 bg-black/50 text-white rounded-none focus:ring-[#00f3ff]/50">
                      <SelectValue placeholder="Select angle" />
                    </SelectTrigger>
                    <SelectContent className="bg-black border-white/10 text-white">
                      <SelectItem value="authority">Authority</SelectItem>
                      <SelectItem value="scarcity">Scarcity</SelectItem>
                      <SelectItem value="loss_aversion">Loss Aversion</SelectItem>
                      <SelectItem value="status">Status</SelectItem>
                      <SelectItem value="neutral">Neutral</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-[10px] text-white/40 font-mono">{ANGLE_META[angle]?.hint}</p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs text-[#00f3ff]/70 font-mono uppercase tracking-widest">Tone Protocol</label>
                  <Select value={tone} onValueChange={setTone}>
                    <SelectTrigger className="border-white/10 bg-black/50 text-white rounded-none focus:ring-[#00f3ff]/50">
                      <SelectValue placeholder="Select tone" />
                    </SelectTrigger>
                    <SelectContent className="bg-black border-white/10 text-white">
                      <SelectItem value="premium">Premium</SelectItem>
                      <SelectItem value="friendly">Friendly</SelectItem>
                      <SelectItem value="direct">Direct</SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="flex items-center gap-2 pt-1">
                    <Badge className="border border-white/10 bg-black/50 text-white rounded-none">
                      {TONE_META[tone]?.badge ?? "Tone"}
                    </Badge>
                  </div>
                </div>
              </div>

              <Separator className="bg-white/5" />

              <div className="space-y-2">
                <label className="text-xs text-[#00f3ff]/70 font-mono uppercase tracking-widest">Proof Assets (Truth Only)</label>
                <Textarea
                  value={proof}
                  onChange={(e) => setProof(e.target.value)}
                  placeholder="Portfolio links, real metrics, relevant stack..."
                  className="min-h-[90px] border-white/10 bg-black/50 text-white placeholder:text-white/20 rounded-none focus:border-[#00f3ff] focus:ring-1 focus:ring-[#00f3ff]/50 transition-all duration-300 font-mono text-sm"
                />
              </div>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <MotionButton
                  onClick={generate}
                  disabled={!canGenerate}
                  className="bg-[#00f3ff] text-black hover:bg-[#00f3ff] disabled:opacity-50 font-bold uppercase tracking-widest rounded-none h-12 px-8 flex-1"
                  whileHover={{ scale: 1.02, boxShadow: "0 0 20px rgba(0, 243, 255, 0.4)" }}
                  whileTap={{ scale: 0.98 }}
                  animate={{ boxShadow: ["0 0 0px #00f3ff", "0 0 10px rgba(0, 243, 255, 0.5)", "0 0 0px #00f3ff"] }}
                  transition={{
                    boxShadow: {
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }
                  }}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="h-3 w-3 animate-spin rounded-full border-2 border-black border-t-transparent" />
                      HACKING SYSTEM...
                    </span>
                  ) : (
                    "DEPLOY LETHAL COPY"
                  )}
                </MotionButton>

                <Button
                  variant="outline"
                  onClick={() => {
                    setJobTitle("");
                    setJobDescription("");
                    setProof("");
                    setOutput("");
                    toast.message("Systems flushed.");
                  }}
                  className="border-white/10 bg-transparent text-white/50 hover:text-white hover:bg-white/5 rounded-none font-mono text-xs h-12"
                >
                  RESET
                </Button>
              </div>
            </CardContent>
          </MotionCard>

          {/* RIGHT: Output + History */}
          <div className="space-y-6">
            <MotionCard
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="border-white/10 bg-black/40 backdrop-blur-xl rounded-none h-[500px] flex flex-col"
            >
              <CardHeader className="flex-row items-center justify-between space-y-0 border-b border-white/5 pb-4">
                <CardTitle className="text-[#39ff14] font-bold uppercase tracking-widest text-sm flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#39ff14] animate-pulse shadow-[0_0_5px_#39ff14]" />
                  System Output
                </CardTitle>
                <div className="flex items-center gap-2">
                  {output ? (
                    <CopyButton
                      value={output}
                      className="border border-[#00f3ff]/30 bg-[#00f3ff]/10 text-[#00f3ff] hover:bg-[#00f3ff]/20 rounded-none uppercase text-xs font-bold"
                    />
                  ) : (
                    <span className="text-white/20 font-mono text-xs animate-pulse">
                      AWAITING INSTRUCTION
                    </span>
                  )}
                </div>
              </CardHeader>

              <CardContent className="flex-1 p-0 relative">
                 <div className="absolute inset-0 p-6 overflow-auto font-mono text-sm leading-relaxed text-white/90 selection:bg-[#39ff14] selection:text-black">
                   {output ? (
                      <TypewriterText text={output} speed={5} />
                   ) : (
                     <div className="h-full flex flex-col items-center justify-center text-white/20">
                        <div className="text-4xl mb-4 opacity-20">⌨</div>
                        <p>Initiate sequence to generate lethal copy.</p>
                     </div>
                   )}
                 </div>
              </CardContent>
            </MotionCard>

            <MotionCard
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="border-white/10 bg-black/40 backdrop-blur-xl rounded-none"
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="text-white font-bold uppercase tracking-widest text-sm">
                    Kill List
                  </span>
                  <Badge className="border border-white/10 bg-black text-white/50 rounded-none font-mono text-xs">
                    {proposals.length} TARGETS
                  </Badge>
                </CardTitle>
              </CardHeader>

              <CardContent>
                <ScrollArea className="h-[200px] pr-3">
                  {proposals.length === 0 ? (
                    <div className="border border-dashed border-white/10 bg-white/5 p-6 text-center rounded-none">
                      <p className="text-sm text-white/40 font-mono">
                        No confirmed kills yet.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {proposals.map((p) => (
                        <div
                          key={p.id}
                          className="border border-white/5 bg-black/30 p-3 rounded-none hover:border-[#00f3ff]/30 transition-colors group"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div className="font-medium text-white/80 group-hover:text-[#00f3ff] transition-colors truncate max-w-[200px]">
                              {p.job_title}
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className="border-0 bg-white/5 text-white/50 rounded-none text-[10px] uppercase">
                                {p.angle}
                              </Badge>
                            </div>
                          </div>

                          <div className="mt-2 flex items-center justify-between">
                             <span className="text-[10px] text-white/30 font-mono">
                                {new Date(p.created_at).toLocaleDateString()}
                             </span>
                             <div className="flex gap-2">
                                <button
                                  className="text-[10px] text-white/50 hover:text-[#00f3ff] uppercase font-bold tracking-wider"
                                  onClick={() => {
                                    setOutput(p.proposal_md);
                                    toast.message("Loaded from kill list.");
                                  }}
                                >
                                  Load
                                </button>
                             </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </MotionCard>

            <MotionCard
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="border-white/10 bg-black/40 backdrop-blur-xl rounded-none opacity-50 hover:opacity-100 transition-opacity"
            >
              <CardHeader>
                <CardTitle className="text-white/50 font-mono uppercase tracking-widest text-xs">
                  System Diagnostics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs text-white/50 font-mono">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div>Link Status</div>
                    <div className="text-[10px] text-white/30">
                      {creditsStatus === "loading"
                        ? "PINGING..."
                        : creditsStatus === "error"
                          ? "LINK SEVERED"
                          : "OPTIMAL"}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="border-white/10 bg-transparent text-white/50 hover:text-white h-6 text-[10px] uppercase"
                    onClick={() => refreshCredits()}
                  >
                    Ping
                  </Button>
                </div>

                <Separator className="bg-white/5" />

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div>Operator ID</div>
                    <div className="text-[10px] text-white/30 max-w-[150px] truncate">{userId}</div>
                  </div>
                  <CopyButton
                    value={userId}
                    label="COPY"
                    className="border-white/10 bg-transparent text-white/50 hover:text-white h-6 w-auto px-2 text-[10px]"
                  />
                </div>
              </CardContent>
            </MotionCard>
          </div>
        </div>
      </div>
    </main>
  );
}
