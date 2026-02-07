import Link from "next/link";

export default function BillingCancelPage() {
  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-white/5 p-6">
        <h1 className="text-2xl font-semibold">Checkout cancelled</h1>
        <p className="mt-2 text-white/70">
          No worries. Your account is still active — you can upgrade anytime.
        </p>

        <div className="mt-6 flex gap-3">
          <Link
            href="/dashboard"
            className="rounded-lg bg-white text-black font-semibold px-4 py-2"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
