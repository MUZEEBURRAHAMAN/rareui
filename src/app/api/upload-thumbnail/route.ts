import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// ─── POST /api/upload-thumbnail ─────────────────────────────
// Accepts multipart form data with:
//   - file: the image file
//   - componentId: the component to update
// Requires x-admin-password header.

export async function POST(request: NextRequest) {
  const adminPassword = request.headers.get("x-admin-password");
  if (!process.env.ADMIN_PASSWORD || adminPassword !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const componentId = formData.get("componentId") as string | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (!componentId) {
    return NextResponse.json({ error: "No componentId provided" }, { status: 400 });
  }

  const allowed = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];
  if (!allowed.includes(file.type)) {
    return NextResponse.json(
      { error: `Unsupported file type: ${file.type}. Use PNG, JPEG, WebP, or SVG.` },
      { status: 400 }
    );
  }

  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 400 });
  }

  const ext = file.name.split(".").pop() || "png";
  const fileName = `${componentId}-${Date.now()}.${ext}`;

  const supabase = getSupabaseAdmin();

  const arrayBuffer = await file.arrayBuffer();
  const { error: uploadError } = await supabase.storage
    .from("thumbnails")
    .upload(fileName, arrayBuffer, {
      contentType: file.type,
      upsert: true,
    });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: urlData } = supabase.storage
    .from("thumbnails")
    .getPublicUrl(fileName);

  const thumbnailUrl = urlData.publicUrl;

  const { error: updateError } = await supabase
    .from("components")
    .update({ thumbnail_url: thumbnailUrl })
    .eq("id", componentId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ thumbnail_url: thumbnailUrl });
}
