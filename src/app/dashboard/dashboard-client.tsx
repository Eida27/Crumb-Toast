"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function DashboardClient({ email }: { email: string }) {
  const router = useRouter();
  const supabase = createClient();

  async function logout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-black text-white p-6">
      <div className="max-w-3xl mx-auto space-y-4">
        <h1 className="text-3xl font-semibold">Dashboard</h1>
        <p className="text-white/60">Logged in as: {email}</p>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <p className="text-sm text-white/70">
            Next: we add Credits + Proposal Generator + History (the real SaaS loop).
          </p>
        </div>

        <button
          onClick={logout}
          className="rounded-lg bg-white text-black font-semibold px-4 py-2"
        >
          Logout
        </button>
      </div>
    </main>
  );
}
