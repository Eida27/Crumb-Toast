"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function StockpileButton() {
  const [loading, setLoading] = useState(false);

  async function handleStockpile() {
    try {
      setLoading(true);

      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Default to starter if tier is not provided, but explicit is better
        body: JSON.stringify({ tier: "starter" }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data?.error ?? "Connection failed.");
        setLoading(false);
        return;
      }

      if (data?.url) {
        // Redirect
        window.location.href = data.url;
      } else {
        toast.error("Invalid coordinates received.");
        setLoading(false);
      }

    } catch (e) {
      console.error(e);
      toast.error("Network error.");
      setLoading(false);
    }
  }

  return (
    <Button
      onClick={handleStockpile}
      disabled={loading}
      className="w-full bg-[#00f3ff] text-black hover:bg-[#00f3ff]/80 font-bold uppercase tracking-widest rounded-none h-12 shadow-[0_0_20px_rgba(0,243,255,0.3)] hover:shadow-[0_0_30px_rgba(0,243,255,0.5)] transition-all"
    >
      {loading ? "INITIALIZING..." : "STOCKPILE WEAPONS"}
    </Button>
  );
}
