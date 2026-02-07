import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DashboardClient from "./dashboard-client";

export default async function DashboardPage() {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const creditsRes = await supabase
    .from("credits")
    .select("balance")
    .eq("user_id", user.id)
    .single();

  const proposalsRes = await supabase
    .from("proposals")
    .select("id, job_title, angle, tone, created_at, proposal_md")
    .order("created_at", { ascending: false })
    .limit(10);

  return (
    <DashboardClient
      initialCredits={creditsRes.data?.balance ?? 0}
      initialProposals={proposalsRes.data ?? []}
    />
  );
}
