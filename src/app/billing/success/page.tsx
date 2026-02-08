import Link from "next/link";

export default function BillingSuccessPage() {
  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-white/5 p-6">
        <h1 className="text-2xl font-semibold">Payment received ✅</h1>
        <p className="mt-2 text-white/70">
          Your purchase was received. If credits don’t update immediately, give it a moment —
          our system applies credits after the payment webhook confirms.
        </p>

        <div className="mt-6 flex gap-3">
          <Link
            href="/dashboard?purchase=1"
            className="rounded-lg bg-white text-black font-semibold px-4 py-2"
          >
            Go to Dashboard
          </Link>

          <Link
            href="/billing"
            className="rounded-lg border border-white/10 bg-white/5 text-white px-4 py-2"
          >
            View Billing
          </Link>
        </div>
      </div>
    </main>
  );
}
