"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";

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
        setErr(
          "Email rate limit exceeded. Please wait a minute before trying again."
        );
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
    setNotice(
      "Confirmation email resent. Please check your inbox or spam folder."
    );
  }

  return (
    <main className="min-h-screen bg-void flex items-center justify-center p-6">
      <Card className="w-full max-w-md backdrop-blur-xl bg-black/40 border-white/10 hover:shadow-[0_0_20px_rgba(0,243,255,0.15)] transition-all duration-500 hover:border-cyan-500/20">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold tracking-tight text-white">
            BidWinner AI
          </CardTitle>
          <CardDescription className="text-slate-400">
            {mode === "login" ? "Login" : "Create account"} — generate proposals
            that feel premium.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-4">
            <Input
              className="bg-white/5 border-transparent text-white placeholder:text-white/40 focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:border-transparent transition-all duration-300 h-11"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input
              className="bg-white/5 border-transparent text-white placeholder:text-white/40 focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:border-transparent transition-all duration-300 h-11"
              placeholder="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {err && <p className="text-sm text-red-400">{err}</p>}
          {notice && <p className="text-sm text-emerald-300">{notice}</p>}

          {mode === "signup" && notice && (
            <Button
              variant="link"
              onClick={resendConfirmation}
              disabled={resending}
              className="w-full text-white/70 hover:text-white p-0 h-auto font-normal"
            >
              {resending ? "Resending..." : "Resend confirmation email"}
            </Button>
          )}
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          <Button
            onClick={submit}
            disabled={loading || cooldownRemaining > 0}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold uppercase tracking-widest shadow-[0_0_20px_rgba(79,70,229,0.5)] transition-all duration-300 h-11 border-none cursor-pointer"
          >
            {loading
              ? "Please wait..."
              : cooldownRemaining > 0
              ? `Try again in ${cooldownRemaining}s`
              : mode === "login"
              ? "Login"
              : "Sign up"}
          </Button>

          <Button
            variant="ghost"
            onClick={() => setMode(mode === "login" ? "signup" : "login")}
            className="w-full text-slate-400 hover:text-white hover:bg-white/5"
          >
            {mode === "login"
              ? "New here? Create an account"
              : "Already have an account? Login"}
          </Button>
        </CardFooter>
      </Card>
    </main>
  );
}
