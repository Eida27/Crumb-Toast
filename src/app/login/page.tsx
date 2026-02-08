"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [resending, setResending] = useState(false);

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (typeof window !== "undefined" ? window.location.origin : "");

  useEffect(() => {
    if (!cooldownUntil) return;

    const interval = window.setInterval(() => {
      const current = Date.now();
      setNow(current);
      if (current >= cooldownUntil) {
        window.clearInterval(interval);
        setCooldownUntil(null);
      }
    }, 1000);

    return () => window.clearInterval(interval);
  }, [cooldownUntil]);

  const cooldownRemaining = cooldownUntil
    ? Math.max(0, Math.ceil((cooldownUntil - now) / 1000))
    : 0;

  async function submit() {
    setErr(null);
    setNotice(null);
    if (!email.trim() || !password) {
      setErr("Please enter an email and password.");
      return;
    }
    if (cooldownRemaining > 0) {
      setErr(`Please wait ${cooldownRemaining}s before trying again.`);
      return;
    }
    setLoading(true);

    const result =
      mode === "login"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: appUrl ? `${appUrl}/auth/callback` : undefined,
            },
          });

    setLoading(false);

    if (result.error) {
      const message = result.error.message;
      if (message.toLowerCase().includes("rate limit")) {
        const nextCooldown = Date.now() + 60_000;
        setCooldownUntil(nextCooldown);
        setErr("Email rate limit exceeded. Please wait a minute before trying again.");
        return;
      }
      return setErr(message);
    }

    if (mode === "signup" && !result.data.session) {
      setNotice("Check your email for a confirmation link to finish signing up.");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  async function resendConfirmation() {
    setErr(null);
    setNotice(null);
    if (!email.trim()) {
      setErr("Enter your email to resend the confirmation link.");
      return;
    }
    setResending(true);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: {
        emailRedirectTo: appUrl ? `${appUrl}/auth/callback` : undefined,
      },
    });
    setResending(false);
    if (error) {
      setErr(error.message);
      return;
    }
    setNotice("Confirmation email resent. Please check your inbox or spam folder.");
  }

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-6">
        <h1 className="text-2xl font-semibold">BidWinner AI</h1>
        <p className="text-sm text-white/60 mt-1">
          {mode === "login" ? "Login" : "Create account"} — generate proposals that feel premium.
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
          {notice && <p className="text-sm text-emerald-300">{notice}</p>}

          {mode === "signup" && notice && (
            <button
              type="button"
              onClick={resendConfirmation}
              disabled={resending}
              className="w-full text-sm text-white/70 hover:text-white disabled:opacity-50"
            >
              {resending ? "Resending..." : "Resend confirmation email"}
            </button>
          )}

          <button
            onClick={submit}
            disabled={loading || cooldownRemaining > 0}
            className="w-full rounded-lg bg-white text-black font-semibold p-3 disabled:opacity-50"
          >
            {loading
              ? "Please wait..."
              : cooldownRemaining > 0
                ? `Try again in ${cooldownRemaining}s`
                : mode === "login"
                  ? "Login"
                  : "Sign up"}
          </button>

          <button
            onClick={() => setMode(mode === "login" ? "signup" : "login")}
            className="w-full text-sm text-white/70 hover:text-white"
          >
            {mode === "login" ? "New here? Create an account" : "Already have an account? Login"}
          </button>
        </div>
      </div>
    </main>
  );
}
