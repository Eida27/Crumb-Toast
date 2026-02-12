"use client";

import { useState } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type Tier = "starter" | "pro" | "beast";

const TIERS: Array<{
  key: Tier;
  name: string;
  credits: number;
  priceLabel: string;
  badge: string;
  bullets: string[];
  recommended?: boolean;
  color: string;
}> = [
  {
    key: "starter",
    name: "The Amateur",
    credits: 100,
    priceLabel: "₱99",
    badge: "Weakness",
    bullets: ["For testing only", "100 generations", "Zero leverage"],
    color: "text-white/60",
  },
  {
    key: "pro",
    name: "The Hustler",
    credits: 500,
    priceLabel: "₱399",
    badge: "Respect",
    bullets: ["Serious contender", "500 generations", "High ROI protocol"],
    recommended: true,
    color: "text-[#00f3ff]",
  },
  {
    key: "beast",
    name: "The Top 1%",
    credits: 2000,
    priceLabel: "₱999",
    badge: "Unfair Advantage",
    bullets: ["Agency Volume", "2000 generations", "Market Domination"],
    recommended: true,
    color: "text-[#39ff14]",
  },
];

const MotionCard = motion.create(Card);

export function UpgradeDialog() {
  const [open, setOpen] = useState(false);
  const [loadingTier, setLoadingTier] = useState<Tier | null>(null);

  async function startCheckout(tier: Tier) {
    try {
      setLoadingTier(tier);
      toast.message("Securing encrypted payment channel...");

      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data?.error ?? "Checkout failed.");
        return;
      }

      if (!data?.url) {
        toast.error("Missing checkout URL.");
        return;
      }

      setOpen(false);
      console.log("LEMON CHECKOUT URL:", data.url);
      window.location.href = data.url;

    } catch {
      toast.error("Network error. Try again.");
    } finally {
      setLoadingTier(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="secondary"
          className="border border-[#00f3ff]/30 bg-[#00f3ff]/10 text-[#00f3ff] hover:bg-[#00f3ff]/20 rounded-none uppercase tracking-widest text-xs font-bold shadow-[0_0_10px_rgba(0,243,255,0.2)]"
        >
          Upgrade Arsenal
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-5xl p-8 border border-white/10 bg-[#050505]/95 backdrop-blur-xl text-white shadow-[0_0_50px_rgba(0,0,0,0.8)] sm:rounded-none">
        {/* Neon Grid Overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-10"
           style={{
             backgroundImage: "linear-gradient(rgba(0, 243, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 243, 255, 0.1) 1px, transparent 1px)",
             backgroundSize: "20px 20px"
           }}
        />

        <DialogHeader className="relative z-10 text-center mb-6">
          <DialogTitle className="text-3xl font-black uppercase italic tracking-tighter">
            Select Your <span className="text-[#00f3ff] text-shadow-[0_0_20px_#00f3ff]">Weapon Grade</span>
          </DialogTitle>
          <p className="text-sm text-white/60 font-mono mt-2">
            More credits = More shots on target. Do not hesitate.
          </p>
        </DialogHeader>

        <div className="relative z-10 grid gap-6 md:grid-cols-3">
          {TIERS.map((t) => {
            const isPremium = t.key !== "starter";
            return (
              <MotionCard
                key={t.key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className={`relative border bg-black/80 backdrop-blur-md rounded-none flex flex-col justify-between h-full
                  ${isPremium ? "border-[#00f3ff]/30 shadow-[0_0_30px_rgba(0,243,255,0.1)]" : "border-white/10"}
                  ${t.key === "beast" ? "border-[#39ff14]/30 shadow-[0_0_30px_rgba(57,255,20,0.1)]" : ""}
                `}
              >
                {t.recommended && (
                   <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-black ${t.key === 'beast' ? 'bg-[#39ff14]' : 'bg-[#00f3ff]'}`}>
                     {t.key === 'beast' ? 'Total Domination' : 'Best Value'}
                   </div>
                )}

                <CardHeader className="flex flex-col items-center text-center pt-8 pb-2">
                  <div className={`text-xl font-black uppercase italic tracking-tighter ${t.color}`}>
                    {t.name}
                  </div>
                  <Badge className={`mt-2 border bg-transparent rounded-none uppercase text-[10px] tracking-widest px-2 py-0.5
                    ${t.key === 'starter' ? 'border-white/20 text-white/40' : ''}
                    ${t.key === 'pro' ? 'border-[#00f3ff]/50 text-[#00f3ff]' : ''}
                    ${t.key === 'beast' ? 'border-[#39ff14]/50 text-[#39ff14]' : ''}
                  `}>
                    {t.badge}
                  </Badge>

                  <div className="mt-6 text-center">
                    <div className={`text-5xl font-black tracking-tighter ${t.color} drop-shadow-lg`}>
                      {t.credits}
                    </div>
                    <div className="text-xs uppercase tracking-widest text-white/40 mt-1 font-mono">
                      Credits (Ammo)
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6 pb-8 px-6">
                  <div className="text-center">
                     <span className="text-xl font-bold text-white">{t.priceLabel}</span>
                  </div>

                  <ul className="space-y-2 text-xs text-white/60 font-mono text-center">
                    {t.bullets.map((b) => (
                      <li key={b} className="flex items-center justify-center gap-2">
                         <span className={t.color}>///</span> {b}
                      </li>
                    ))}
                  </ul>

                  <Button
                    className={`w-full rounded-md font-black uppercase tracking-widest h-12 transition-all duration-200 active:scale-95
                      ${t.key === 'starter' ? 'bg-white/10 text-white hover:bg-white/20' : ''}
                      ${t.key === 'pro' ? 'bg-[#00f3ff] text-black hover:bg-[#00f3ff] hover:shadow-[0_0_20px_#00f3ff]' : ''}
                      ${t.key === 'beast' ? 'bg-[#39ff14] text-black hover:bg-[#39ff14] hover:shadow-[0_0_20px_#39ff14]' : ''}
                    `}
                    disabled={loadingTier !== null}
                    onClick={() => startCheckout(t.key)}
                  >
                    {loadingTier === t.key ? (
                       <span className="animate-pulse">Initializing...</span>
                    ) : (
                       "UPGRADE"
                    )}
                  </Button>
                </CardContent>
              </MotionCard>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
