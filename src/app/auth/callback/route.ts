import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  const redirectTo = new URL(next, origin);
  if (redirectTo.pathname === "/dashboard") {
    redirectTo.searchParams.set("confirmed", "1");
  }

  return NextResponse.redirect(redirectTo);
}
