import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// ─── GET /api/components/[id]/clipboard ──────────────────────
// Returns only the clipboard payload (figmeta + figbuffer)
// Called when user clicks "Copy to Figma" to avoid loading
// the large blobs in the catalog listing.

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("components")
    .select("figmeta, figbuffer, display_name")
    .eq("id", id)
    .eq("is_published", true)
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: "Component not found" },
      { status: 404 }
    );
  }

  return NextResponse.json(data);
}
