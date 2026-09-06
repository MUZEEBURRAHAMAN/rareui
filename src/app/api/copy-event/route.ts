import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// ─── POST /api/copy-event ────────────────────────────────────
// Logs a copy event and increments the component's copy_count.

export async function POST(request: NextRequest) {
  const { component_id } = await request.json();

  if (!component_id) {
    return NextResponse.json(
      { error: "component_id is required" },
      { status: 400 }
    );
  }

  const supabase = getSupabase();
  const userAgent = request.headers.get("user-agent") || "";

  // Insert copy event
  await supabase.from("copy_events").insert({
    component_id,
    user_agent: userAgent,
  });

  // Increment counter
  await supabase.rpc("increment_copy_count", { comp_id: component_id });

  return NextResponse.json({ ok: true });
}
