import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Anon client — respects RLS, safe for public reads
function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// Service-role client — bypasses RLS, used ONLY for admin writes.
// Never expose SUPABASE_SERVICE_ROLE_KEY to the browser.
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// ─── GET /api/components ─────────────────────────────────────
// Query params: category, search, limit, offset

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const search = searchParams.get("search");
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
  const offset = parseInt(searchParams.get("offset") || "0");

  const supabase = getSupabase();

  let query = supabase
    .from("components")
    .select(
      "id, name, slug, category, tags, description, thumbnail_url, display_name, copy_count, version, is_published, created_at, updated_at",
      { count: "exact" }
    )
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (category && category !== "all") {
    query = query.eq("category", category);
  }

  if (search) {
    query = query.or(
      `name.ilike.%${search}%,description.ilike.%${search}%,display_name.ilike.%${search}%`
    );
  }

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    components: data || [],
    total: count || 0,
  });
}

// ─── POST /api/components ────────────────────────────────────
// Body: ComponentCreatePayload
// Requires the x-admin-password header to match ADMIN_PASSWORD.

export async function POST(request: NextRequest) {
  const adminPassword = request.headers.get("x-admin-password");
  if (!process.env.ADMIN_PASSWORD || adminPassword !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  const { name, slug, category, tags, description, thumbnail_url, figmeta, figbuffer, display_name, source_url } = body;

  if (!name || !figmeta || !figbuffer) {
    return NextResponse.json(
      { error: "name, figmeta, and figbuffer are required" },
      { status: 400 }
    );
  }

  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("components")
    .insert({
      name,
      slug: slug || name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      category: category || "website",
      tags: tags || [],
      description: description || "",
      thumbnail_url: thumbnail_url || "",
      figmeta,
      figbuffer,
      display_name: display_name || name,
      source_url: source_url || "",
    })
    .select("id, name, slug")
    .single();

  if (error) {
    // Handle duplicate slug
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "A component with this slug already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ component: data }, { status: 201 });
}
