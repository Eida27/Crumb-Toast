"use client";

import { useState } from "react";
import { toast } from "sonner";

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
  tier: Tier;
  name: string;
  credits: number;
  tagline: string;
  label?: string;
  highlight?: boolean;
  bullets: string[];
}> = [
  {
    tier: "starter",
    name: "Starter",
    credits: 100,
    tagline: "Get your first wins.",
    bullets: ["100 proposals", "Best for testing offers", "Instant refill via webhook"],
  },
  {
    tier: "pro",
    name: "Pro",
    credits: 500,
    tagline: "The serious freelancer pack.",
    label: "Most Popular",
    highlight: true,
    bullets: [
      "500 proposals",
      "Better value per credit",
      "Designed for daily bidding",
      "Status signal: you’re not cheap labor",
    ],
  },
  {
    tier: "beast",
    name: "Beast",
    credits: 2000,
    tagline: "Dominate the feed.",
    label: "Best Value",
    bullets: ["2000 proposals", "Lowest cost per credit", "For agencies / power users"],
  },
];

export function UpgradeDialog() {
  const [open, setOpen] = useState(false);
  const [loadingTier, setLoadingTier] = useState<Tier | null>(null);

  async function checkout(tier: Tier) {
    setLoadingTier(tier);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Checkout failed");

      toast.message("Redirecting to secure checkout...");
      window.location.href = data.url;
    } catch (e: any) {
      toast.error(e.message ?? "Checkout failed");
      setLoadingTier(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="secondary"
          className="border border-white/10 bg-white/5 text-white hover:bg-white/10"
        >
          Upgrade
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-4xl border-white/10 bg-black text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">
            Buy credits
          </DialogTitle>
          <p className="text-sm text-white/60">
            Credits are ammo. More credits = more bids = more chances to win.
          </p>
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-3">
          {TIERS.map((t) => (
            <Card
              key={t.tier}
              className={[
                "border-white/10 bg-white/5",
                t.highlight ? "ring-1 ring-white/20" : "",
              ].join(" ")}
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{t.name}</span>
                  {t.label ? (
                    <Badge className="border border-white/10 bg-black/30 text-white">
                      {t.label}
                    </Badge>
                  ) : null}
                </CardTitle>
                <div className="text-3xl font-semibold">{t.credits}</div>
                <div className="text-sm text-white/60">{t.tagline}</div>
              </CardHeader>

              <CardContent className="space-y-3">
                <ul className="space-y-2 text-sm text-white/70">
                  {t.bullets.map((b) => (
                    <li key={b} className="flex gap-2">
                      <span className="mt-[2px] h-2 w-2 rounded-full bg-white/60" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => checkout(t.tier)}
                  disabled={loadingTier !== null}
                  className={[
                    "w-full font-semibold",
                    t.highlight
                      ? "bg-white text-black hover:bg-white/90"
                      : "bg-white/10 text-white hover:bg-white/15 border border-white/10",
                  ].join(" ")}
                >
                  {loadingTier === t.tier ? "Opening checkout..." : "Choose"}
                </Button>

                {t.highlight ? (
                  <p className="text-xs text-white/50">
                    Most users who win consistently pick this.
                  </p>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>

        <p className="text-xs text-white/50">
          Ethical persuasion only. No fake claims. Your credibility is the asset.
        </p>
      </DialogContent>
    </Dialog>
  );
}
