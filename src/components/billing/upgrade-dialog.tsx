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
  key: Tier;
  name: string;
  credits: number;
  priceLabel: string;
  badge: string;
  bullets: string[];
}> = [
  {
    key: "starter",
    name: "Starter",
    credits: 100,
    priceLabel: "₱99",
    badge: "Warm-up",
    bullets: ["For testing + first clients", "100 generations", "No subscription"],
  },
  {
    key: "pro",
    name: "Pro",
    credits: 500,
    priceLabel: "₱399",
    badge: "Most Popular",
    bullets: ["Serious freelancing mode", "500 generations", "Better ROI per bid"],
  },
  {
    key: "beast",
    name: "Beast",
    credits: 2000,
    priceLabel: "₱999",
    badge: "Unfair Advantage",
    bullets: ["Agency / volume bidding", "2000 generations", "Max value pack"],
  },
];

export function UpgradeDialog() {
  const [open, setOpen] = useState(false);
  const [loadingTier, setLoadingTier] = useState<Tier | null>(null);

  async function startCheckout(tier: Tier) {
    try {
      setLoadingTier(tier);
      toast.message("Redirecting to Lemon Squeezy checkout…");

      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier }), // ✅ sends tier
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
          className="border border-white/10 bg-white/5 text-white hover:bg-white/10"
        >
          Upgrade
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-5xl p-6 border-white/10 bg-black text-white">
        <DialogHeader>
          <DialogTitle className="text-xl">Choose your power level</DialogTitle>
          <p className="text-sm text-white/60">
            Buy credits. Generate more proposals. Win more bids.
          </p>
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-3">
          {TIERS.map((t) => (
            <Card key={t.key} className="border-white/10 bg-white/5">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{t.name}</span>
                  <Badge className="border border-white/10 bg-black/30 text-white">
                    {t.badge}
                  </Badge>
                </CardTitle>
                <div className="text-sm text-white/60">
                  <span className="text-white/90 font-semibold">{t.credits}</span>{" "}
                  credits • {t.priceLabel}
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                <ul className="space-y-1 text-xs text-white/60">
                  {t.bullets.map((b) => (
                    <li key={b}>• {b}</li>
                  ))}
                </ul>

                <Button
                  className="w-full bg-white text-black hover:bg-white/90"
                  disabled={loadingTier !== null}
                  onClick={() => startCheckout(t.key)}
                >
                  {loadingTier === t.key ? "Redirecting..." : "Buy credits"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
