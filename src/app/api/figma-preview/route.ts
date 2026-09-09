import { NextRequest, NextResponse } from "next/server";

// ─── POST /api/figma-preview ─────────────────────────────────
// Body: { figmeta: string } — the raw figmeta blob captured from
// Figma's clipboard data. figmeta is base64 JSON containing the
// fileKey and the copied node's ID; we use Figma's own Images API
// (server-side, token never reaches the browser) to render a real
// screenshot of that exact node and hand back a data URI.

export async function POST(request: NextRequest) {
  const token = process.env.FIGMA_ACCESS_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: "FIGMA_ACCESS_TOKEN is not configured on the server" },
      { status: 501 }
    );
  }

  const { figmeta } = await request.json();
  if (!figmeta || typeof figmeta !== "string") {
    return NextResponse.json({ error: "figmeta is required" }, { status: 400 });
  }

  let fileKey: string | undefined;
  let nodeId: string | undefined;
  try {
    const meta = JSON.parse(Buffer.from(figmeta, "base64").toString("utf8"));
    fileKey = meta.fileKey;
    nodeId = typeof meta.selectedNodeData === "string" ? meta.selectedNodeData.split("|")[0] : undefined;
  } catch {
    return NextResponse.json({ error: "Could not decode figmeta" }, { status: 400 });
  }

  if (!fileKey || !nodeId) {
    return NextResponse.json(
      { error: "figmeta did not contain a file key and node id" },
      { status: 400 }
    );
  }

  const imagesRes = await fetch(
    `https://api.figma.com/v1/images/${fileKey}?ids=${encodeURIComponent(nodeId)}&format=png&scale=2`,
    { headers: { "X-Figma-Token": token } }
  );

  if (!imagesRes.ok) {
    const detail = await imagesRes.text().catch(() => "");
    return NextResponse.json(
      { error: `Figma API error (${imagesRes.status}): ${detail || imagesRes.statusText}` },
      { status: 502 }
    );
  }

  const imagesData = await imagesRes.json();
  if (imagesData.err) {
    return NextResponse.json({ error: `Figma API error: ${imagesData.err}` }, { status: 502 });
  }

  const imageUrl: string | undefined = imagesData.images?.[nodeId];
  if (!imageUrl) {
    return NextResponse.json(
      { error: "Figma did not return a render for this node" },
      { status: 502 }
    );
  }

  const imageRes = await fetch(imageUrl);
  if (!imageRes.ok) {
    return NextResponse.json({ error: "Failed to download the rendered image" }, { status: 502 });
  }

  const arrayBuffer = await imageRes.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");
  const mime = imageRes.headers.get("content-type") || "image/png";

  return NextResponse.json({ previewImage: `data:${mime};base64,${base64}` });
}
