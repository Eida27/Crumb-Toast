"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    setErr(null);
    setLoading(true);

    const action =
      mode === "login"
        ? supabase.auth.signInWithPassword({ email, password })
        : supabase.auth.signUp({ email, password });

    const { error } = await action;

    setLoading(false);

    if (error) return setErr(error.message);

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-6">
        <h1 className="text-2xl font-semibold">BidWinner AI</h1>
        <p className="text-sm text-white/60 mt-1">
          {mode === "login" ? "Login" : "Create account"} to generate proposals.
        </p>

        <div className="mt-6 space-y-3">
          <input
            className="w-full rounded-lg bg-black/40 border border-white/10 p-3"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className="w-full rounded-lg bg-black/40 border border-white/10 p-3"
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {err && <p className="text-sm text-red-400">{err}</p>}

          <button
            onClick={submit}
            disabled={loading}
            className="w-full rounded-lg bg-white text-black font-semibold p-3 disabled:opacity-50"
          >
            {loading ? "Please wait..." : mode === "login" ? "Login" : "Sign up"}
          </button>

          <button
            onClick={() => setMode(mode === "login" ? "signup" : "login")}
            className="w-full text-sm text-white/70 hover:text-white"
          >
            {mode === "login"
              ? "New here? Create an account"
              : "Already have an account? Login"}
          </button>
        </div>
      </div>
    </main>
  );
}
