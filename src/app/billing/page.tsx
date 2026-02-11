import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export default async function BillingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const creditsRes = await supabase
    .from("credits")
    .select("balance, updated_at")
    .eq("user_id", user.id)
    .maybeSingle();

  const credits = creditsRes.data?.balance ?? 0;
  const creditsError = creditsRes.error?.message ?? null;

  const eventsRes = await supabase
    .from("billing_webhook_events")
    .select("event_name, created_at")
    .order("created_at", { ascending: false })
    .limit(10);

  const events = eventsRes.data ?? [];

  const plan = credits > 0 ? "ELITE" : "ROOKIE";

  return (
    <main className="min-h-screen bg-[#050505] text-white p-6 relative overflow-hidden selection:bg-[#00f3ff] selection:text-black">
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

      <div className="mx-auto max-w-5xl space-y-8 relative z-10">
        <div className="flex items-end justify-between gap-3 border-b border-white/5 pb-6">
          <div>
            <h1 className="text-2xl lg:text-4xl font-black tracking-tighter uppercase italic"
              style={{ textShadow: "0 0 20px rgba(0, 243, 255, 0.3)" }}>
              WAR CHEST
            </h1>
            <p className="mt-2 text-white/60 font-mono text-sm">
              Resources are the lifeblood of empire. <span className="text-[#39ff14]">Starve the weak, feed the strong.</span>
            </p>
          </div>
          <Link href="/dashboard">
            <Button variant="ghost" className="border border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-[#00f3ff] rounded-sm uppercase tracking-wider text-xs font-bold">
              Return to Base
            </Button>
          </Link>
        </div>

        <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
          <Card className="border-white/10 bg-black/40 backdrop-blur-xl lg:col-span-2 rounded-none relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#00f3ff]/50 to-transparent" />
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="text-[#00f3ff] font-bold uppercase tracking-widest text-sm">/// POWER LEVEL</span>
                <Badge className="border border-white/10 bg-black text-white/70 rounded-none font-mono text-xs">
                  {plan}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="rounded-none border border-white/10 bg-black/50 p-6 relative group">
                 <div className="absolute inset-0 bg-[#00f3ff]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="text-xs text-[#00f3ff]/70 font-mono uppercase tracking-widest mb-2">Ammunition Available</div>
                <div className="text-4xl lg:text-6xl font-black text-white tracking-tighter" style={{ textShadow: "0 0 30px rgba(0, 243, 255, 0.2)" }}>
                    {credits}
                </div>
                <div className="text-[10px] text-white/30 font-mono mt-4 uppercase">
                  Last Resupply: {creditsRes.data?.updated_at ? new Date(creditsRes.data.updated_at).toLocaleString() : "NEVER"}
                </div>
              </div>

              {credits === 0 && !creditsError && (
                <div className="rounded-none border border-red-500/30 bg-red-500/5 p-4">
                  <div className="text-sm font-bold text-red-500 uppercase tracking-widest">
                    CRITICAL: MAGAZINE EMPTY
                  </div>
                  <p className="mt-1 text-xs text-red-200/70 font-mono">
                    You are vulnerable. Stockpile immediately to maintain dominance.
                  </p>
                </div>
              )}

              {creditsError && (
                <div className="rounded-none border border-red-500/30 bg-red-500/5 p-4">
                  <div className="text-sm font-bold text-red-500 uppercase tracking-widest">
                    CONNECTION SEVERED
                  </div>
                  <p className="mt-1 text-xs text-red-200/70 font-mono">
                    {creditsError}
                  </p>
                </div>
              )}

              <Separator className="bg-white/5" />

              <div className="flex flex-wrap gap-4">
                <form action="/api/billing/checkout" method="post" className="flex-1">
                  <Button className="w-full bg-[#00f3ff] text-black hover:bg-[#00f3ff]/80 font-bold uppercase tracking-widest rounded-none h-12 shadow-[0_0_20px_rgba(0,243,255,0.3)] hover:shadow-[0_0_30px_rgba(0,243,255,0.5)] transition-all">
                    STOCKPILE WEAPONS
                  </Button>
                </form>

                <Link href="/dashboard" className="flex-1">
                  <Button variant="outline" className="w-full border-white/10 bg-transparent text-white hover:bg-white/5 rounded-none font-mono text-xs h-12 uppercase tracking-widest">
                    DEPLOY ASSETS
                  </Button>
                </Link>
              </div>

              <p className="text-xs text-white/40 font-mono text-center pt-2">
                &quot;Influence is a game of reserves. Never be caught empty-handed.&quot;
              </p>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-black/40 backdrop-blur-xl rounded-none h-fit">
            <CardHeader>
              <CardTitle className="text-white font-bold uppercase tracking-widest text-sm">
                Transaction Log
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {events.length === 0 ? (
                <div className="border border-dashed border-white/10 bg-white/5 p-6 text-center rounded-none">
                    <p className="text-xs text-white/40 font-mono">No trace found.</p>
                </div>
              ) : (
                events.map((e, i) => (
                  <div key={i} className="rounded-none border-l-2 border-[#39ff14] bg-white/5 p-3 hover:bg-white/10 transition-colors">
                    <div className="text-xs font-bold text-white uppercase tracking-wider">{e.event_name}</div>
                    <div className="text-[10px] text-white/40 font-mono mt-1">{new Date(e.created_at).toLocaleString()}</div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
