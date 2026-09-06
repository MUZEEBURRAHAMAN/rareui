import type { FigmaClipboardData, ClipboardPayload } from "./types";

// ─── Extract figmeta + figbuffer from clipboard ─────────────
// Used by the admin extraction tool: user copies a component
// in Figma, then pastes into our tool to extract the blobs.

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
        const nameMatch = html.match(
          /<span[^>]*style="white-space:pre-wrap;"[^>]*>([^<]+)<\/span>/
        );
        const imgMatch = html.match(/<img[^>]+src="(data:image\/[^"]+)"/);

        return {
          rawHtml: html,
          figmeta: metaMatch?.[1] || null,
          figbuffer: bufferMatch?.[1] || null,
          displayName: nameMatch?.[1] || null,
          previewImage: imgMatch?.[1] || null,
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
