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
    .single();

  const credits = creditsRes.data?.balance ?? 0;

  // show last 10 webhook events (proof of payments)
  const eventsRes = await supabase
    .from("billing_webhook_events")
    .select("event_name, created_at")
    .order("created_at", { ascending: false })
    .limit(10);

  const events = eventsRes.data ?? [];

  const plan = credits > 0 ? "Pro" : "Free";

  return (
    <main className="min-h-screen bg-black text-white p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold">Billing</h1>
            <p className="text-white/60 text-sm">Control your credits. Control your output.</p>
          </div>
          <Link href="/dashboard">
            <Button className="bg-white text-black hover:bg-white/90">Back</Button>
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="border-white/10 bg-white/5 lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Account Status</span>
                <Badge className="border border-white/10 bg-black/30 text-white">
                  {plan.toUpperCase()}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                <div className="text-sm text-white/60">Current credits</div>
                <div className="text-4xl font-semibold mt-1">{credits}</div>
                <div className="text-xs text-white/50 mt-2">
                  Updated: {creditsRes.data?.updated_at ? new Date(creditsRes.data.updated_at).toLocaleString() : "—"}
                </div>
              </div>

              <Separator className="bg-white/10" />

              <div className="flex flex-wrap gap-2">
                <form action="/api/billing/checkout" method="post">
                  <Button className="bg-white text-black hover:bg-white/90">
                    Buy credits
                  </Button>
                </form>

                <Link href="/dashboard">
                  <Button variant="secondary" className="border border-white/10 bg-white/5 text-white hover:bg-white/10">
                    Use credits now
                  </Button>
                </Link>
              </div>

              <p className="text-sm text-white/60">
                Credits are your weapon. Spend them only on high-quality leads.
              </p>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/5">
            <CardHeader>
              <CardTitle>Recent payments</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {events.length === 0 ? (
                <p className="text-sm text-white/60">No events yet.</p>
              ) : (
                events.map((e, i) => (
                  <div key={i} className="rounded-lg border border-white/10 bg-black/30 p-3">
                    <div className="text-sm font-medium">{e.event_name}</div>
                    <div className="text-xs text-white/50">{new Date(e.created_at).toLocaleString()}</div>
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
