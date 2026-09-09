import type { FigmaClipboardData, ClipboardPayload } from "./types";

// ─── Extract figmeta + figbuffer from clipboard ─────────────
// Used by the admin extraction tool: user copies a component
// in Figma, then pastes into our tool to extract the blobs.
//
// Figma's clipboard HTML never carries a raster preview — no native
// image/* representation, no embedded <img>. It only carries figmeta/
// figbuffer (for full-fidelity paste back into Figma) and one <span>
// per text layer, as a plain-text fallback for non-Figma paste targets.
// The real preview comes from a separate call to Figma's Images API,
// keyed off the fileKey/nodeId embedded inside figmeta — see
// fetchFigmaPreview below.

export async function extractFigmaClipboard(): Promise<FigmaClipboardData> {
  try {
    const clipboardItems = await navigator.clipboard.read();

    for (const item of clipboardItems) {
      if (item.types.includes("text/html")) {
        const blob = await item.getType("text/html");
        const html = await blob.text();

        // Figma embeds two encoded blobs inside HTML comments
        const metaMatch = html.match(/\(figmeta\)([^(]+)\(\/figmeta\)/);
        const bufferMatch = html.match(/\(figma\)([^(]+)\(\/figma\)/);
        // Every text-layer span carries "white-space: pre-wrap" (note the
        // space after the colon, and other style properties alongside it)
        // — the first match is the topmost text layer, used as a name hint.
        const nameMatch = html.match(
          /<span[^>]*style="[^"]*white-space:\s*pre-wrap;?[^"]*"[^>]*>([^<]*)<\/span>/
        );

        return {
          rawHtml: html,
          figmeta: metaMatch?.[1] || null,
          figbuffer: bufferMatch?.[1] || null,
          displayName: nameMatch?.[1] || null,
          previewImage: null,
          isValidFigmaData: !!(metaMatch && bufferMatch),
        };
      }
    }

    return {
      rawHtml: "",
      figmeta: null,
      figbuffer: null,
      displayName: null,
      previewImage: null,
      isValidFigmaData: false,
    };
  } catch (error) {
    console.error("Clipboard read failed:", error);
    throw new Error(
      "Could not read clipboard. Make sure you've copied a Figma component and granted clipboard permission."
    );
  }
}

// ─── Fetch a real rendered preview from Figma's Images API ──
// figmeta is base64 JSON containing the fileKey and the copied node's
// ID — ask our server (which holds the Figma token) to render it.

export async function fetchFigmaPreview(figmeta: string): Promise<string | null> {
  const res = await fetch("/api/figma-preview", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ figmeta }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to fetch preview from Figma");
  }

  const data = await res.json();
  return data.previewImage || null;
}

// ─── Convert a captured preview into a File for upload ──────
// previewImage may be a data: URI (native clipboard image, or one
// embedded inline in the HTML) or a remote https URL (an <img src>
// pointing at Figma-hosted asset storage) — handle both.

export async function previewImageToFile(
  previewImage: string,
  filename = "preview"
): Promise<File> {
  if (previewImage.startsWith("data:")) {
    const match = previewImage.match(/^data:([^;]+);base64,(.*)$/);
    if (!match) throw new Error("Unsupported preview image format");
    const [, mime, base64Data] = match;
    const byteChars = atob(base64Data);
    const byteArray = new Uint8Array(byteChars.length);
    for (let i = 0; i < byteChars.length; i++) byteArray[i] = byteChars.charCodeAt(i);
    const ext = mime.split("/")[1] || "png";
    return new File([byteArray], `${filename}.${ext}`, { type: mime });
  }

  const res = await fetch(previewImage);
  if (!res.ok) throw new Error(`Failed to fetch preview image (${res.status})`);
  const blob = await res.blob();
  const mime = blob.type || "image/png";
  const ext = mime.split("/")[1] || "png";
  return new File([blob], `${filename}.${ext}`, { type: mime });
}

// ─── Write clipboard payload for paste into Figma ────────────
// Used on the public catalog: user clicks "Copy to Figma",
// we reconstruct the HTML Figma expects and write it.

export async function copyToFigmaClipboard(
  payload: ClipboardPayload
): Promise<void> {
  const html = [
    '<meta charset="utf-8">',
    '<span data-metadata="<!--(figmeta)',
    payload.figmeta,
    '(/figmeta)-->"></span>',
    '<span data-buffer="<!--(figma)',
    payload.figbuffer,
    '(/figma)-->"></span>',
    '<span style="white-space:pre-wrap;">',
    payload.display_name,
    "</span>",
  ].join("");

  await navigator.clipboard.write([
    new ClipboardItem({
      "text/html": new Blob([html], { type: "text/html" }),
      "text/plain": new Blob([payload.display_name], { type: "text/plain" }),
    }),
  ]);
}

// ─── Generate a URL-safe slug from a component name ──────────

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
