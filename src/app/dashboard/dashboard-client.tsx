"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type ProposalRow = {
  id: string;
  job_title: string;
  angle: string;
  tone: string;
  created_at: string;
  proposal_md: string;
};

export default function DashboardClient({
  email,
  initialCredits,
  initialProposals,
}: {
  email: string;
  initialCredits: number;
  initialProposals: ProposalRow[];
}) {
  const router = useRouter();
  const supabase = createClient();

  const [credits, setCredits] = useState(initialCredits);
  const [proposals, setProposals] = useState(initialProposals);

  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [proof, setProof] = useState("");
  const [angle, setAngle] = useState("authority");
  const [tone, setTone] = useState("premium");

  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);

  async function logout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  async function generate() {
    if (credits <= 0) return alert("No credits left.");

    setLoading(true);
    setOutput("");

    const res = await fetch("/api/proposals/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobTitle, jobDescription, proof, angle, tone }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) return alert(data?.error ?? "Failed");

    setOutput(data.proposal);
    setCredits(data.newBalance ?? credits);

    if (data.saved) setProposals((p) => [data.saved, ...p].slice(0, 10));
  }

  async function copy(text: string) {
    await navigator.clipboard.writeText(text);
    alert("Copied!");
  }

  return (
    <main className="min-h-screen bg-black text-white p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold">BidWinner AI</h1>
            <p className="text-white/60 text-sm">Logged in as: {email}</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm">
              Credits: <span className="font-semibold">{credits}</span>
            </div>
            <button
              onClick={logout}
              className="rounded-lg bg-white text-black font-semibold px-4 py-2"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-3">
            <h2 className="text-lg font-semibold">Generate proposal</h2>

            <input
              className="w-full rounded-lg bg-black/40 border border-white/10 p-3"
              placeholder="Job title"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
            />

            <textarea
              className="w-full min-h-40 rounded-lg bg-black/40 border border-white/10 p-3"
              placeholder="Job description (paste full job post)"
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
            />

            <div className="grid grid-cols-2 gap-3">
              <select
                className="w-full rounded-lg bg-black/40 border border-white/10 p-3"
                value={angle}
                onChange={(e) => setAngle(e.target.value)}
              >
                <option value="authority">Authority</option>
                <option value="scarcity">Scarcity</option>
                <option value="loss_aversion">Loss Aversion</option>
                <option value="status">Status</option>
                <option value="neutral">Neutral</option>
              </select>

              <select
                className="w-full rounded-lg bg-black/40 border border-white/10 p-3"
                value={tone}
                onChange={(e) => setTone(e.target.value)}
              >
                <option value="premium">Premium</option>
                <option value="friendly">Friendly</option>
                <option value="direct">Direct</option>
              </select>
            </div>

            <textarea
              className="w-full min-h-24 rounded-lg bg-black/40 border border-white/10 p-3"
              placeholder="Proof (truth only): portfolio links, metrics you can prove"
              value={proof}
              onChange={(e) => setProof(e.target.value)}
            />

            <button
              onClick={generate}
              disabled={loading}
              className="w-full rounded-lg bg-white text-black font-semibold p-3 disabled:opacity-50"
            >
              {loading ? "Generating..." : "Generate (1 credit)"}
            </button>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Output</h2>
                {output ? (
                  <button
                    onClick={() => copy(output)}
                    className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm"
                  >
                    Copy
                  </button>
                ) : null}
              </div>

              <pre className="whitespace-pre-wrap text-sm bg-black/40 border border-white/10 rounded-lg p-3 min-h-40">
                {output || "Generate a proposal to see output here."}
              </pre>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-3">
              <h2 className="text-lg font-semibold">History</h2>

              <div className="space-y-2">
                {proposals.map((p) => (
                  <div
                    key={p.id}
                    className="rounded-lg bg-black/40 border border-white/10 p-3"
                  >
                    <div className="font-medium">{p.job_title}</div>
                    <div className="text-xs text-white/60">
                      {p.angle} • {p.tone}
                    </div>

                    <div className="mt-2 flex gap-2">
                      <button
                        onClick={() => setOutput(p.proposal_md)}
                        className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm"
                      >
                        View
                      </button>
                      <button
                        onClick={() => copy(p.proposal_md)}
                        className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                ))}

                {proposals.length === 0 && (
                  <p className="text-sm text-white/60">No proposals yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
