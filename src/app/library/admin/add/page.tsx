"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { extractFigmaClipboard, fetchFigmaPreview, copyToFigmaClipboard, previewImageToFile, slugify } from "@/lib/clipboard";
import type { FigmaClipboardData, ComponentCreatePayload } from "@/lib/types";
import { CATEGORIES } from "@/lib/categories";
import { useAdminSession } from "@/hooks/useAdminSession";
import { AdminSessionBar } from "@/components/admin/AdminSessionBar";
import { CheckIcon, BackArrowIcon, CopiesIcon } from "@/components/admin/icons";

export default function AddComponentPage() {
  const router = useRouter();
  const { password, unlocked, unlock, lock } = useAdminSession();

  const [extracted, setExtracted] = useState<FigmaClipboardData | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isFetchingPreview, setIsFetchingPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  const [name, setName] = useState("");
  const [category, setCategory] = useState("website");
  const [tags, setTags] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");

  const handleExtract = useCallback(async () => {
    setIsExtracting(true);
    try {
      const data = await extractFigmaClipboard();
      setExtracted(data);
      if (data.isValidFigmaData) {
        toast.success("Figma data extracted successfully");
        if (data.displayName) setName(data.displayName);

        if (data.figmeta) {
          setIsFetchingPreview(true);
          try {
            const previewImage = await fetchFigmaPreview(data.figmeta);
            setExtracted((prev) => (prev ? { ...prev, previewImage } : prev));
          } catch (err) {
            toast.warning(
              err instanceof Error ? err.message : "Couldn't fetch a preview from Figma"
            );
          } finally {
            setIsFetchingPreview(false);
          }
        }
      } else {
        toast.error("No valid Figma data found in clipboard. Copy a component in Figma first.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Extraction failed");
    } finally {
      setIsExtracting(false);
    }
  }, []);

  const handleTestPaste = useCallback(async () => {
    if (!extracted?.figmeta || !extracted?.figbuffer) return;
    setIsTesting(true);
    try {
      await copyToFigmaClipboard({
        figmeta: extracted.figmeta,
        figbuffer: extracted.figbuffer,
        display_name: name || extracted.displayName || "Component",
      });
      toast.success("Copied to clipboard — paste in Figma to verify");
    } catch {
      toast.error("Failed to write to clipboard");
    } finally {
      setIsTesting(false);
    }
  }, [extracted, name]);

  const handleSave = useCallback(async () => {
    if (!extracted?.figmeta || !extracted?.figbuffer) return;
    if (!name.trim()) {
      toast.error("Component name is required");
      return;
    }
    if (!password) {
      toast.error("Unlock the admin session first");
      return;
    }

    setIsSaving(true);
    try {
      const payload: ComponentCreatePayload = {
        name: name.trim(),
        slug: slugify(name.trim()),
        category,
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        description: description.trim(),
        thumbnail_url: thumbnailUrl.trim(),
        figmeta: extracted.figmeta,
        figbuffer: extracted.figbuffer,
        display_name: name.trim(),
        source_url: sourceUrl.trim(),
      };

      const res = await fetch("/api/components", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-password": password },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save");
      }

      const savedData = await res.json();

      // Auto-capture is the default thumbnail; a manually entered URL above wins if set.
      if (!thumbnailUrl.trim() && extracted.previewImage && savedData.component?.id) {
        try {
          const file = await previewImageToFile(extracted.previewImage);

          const formData = new FormData();
          formData.append("file", file);
          formData.append("componentId", savedData.component.id);

          const uploadRes = await fetch("/api/upload-thumbnail", {
            method: "POST",
            headers: { "x-admin-password": password },
            body: formData,
          });

          if (!uploadRes.ok) {
            toast.warning("Saved, but the captured thumbnail failed to upload — add one manually from the dashboard.");
          }
        } catch {
          // Don't block the save on a failed thumbnail capture — just tell the admin.
          toast.warning("Saved, but the captured thumbnail failed to upload — add one manually from the dashboard.");
        }
      }

      toast.success("Component saved to library");
      router.push("/library/admin");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setIsSaving(false);
    }
  }, [extracted, name, category, tags, description, thumbnailUrl, sourceUrl, password, router]);

  const categoryLabel = CATEGORIES.find((c) => c.id === category)?.label || category;

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <div className="border-b border-line px-5 py-4 sm:px-8">
        <div className="mx-auto flex max-w-[1180px] items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-[13px] text-ink-3">
            <Link href="/library" className="transition-colors hover:text-ink">Library</Link>
            <span className="text-ink-4">/</span>
            <Link href="/library/admin" className="transition-colors hover:text-ink">Admin</Link>
            <span className="text-ink-4">/</span>
            <span className="font-medium text-ink">Add Component</span>
          </div>
          <Link
            href="/library/admin"
            className="flex items-center gap-1.5 rounded-control border border-line bg-field px-3 py-1.5 text-[12.5px] font-medium text-ink"
          >
            <BackArrowIcon />
            Back to dashboard
          </Link>
        </div>
      </div>

      <div className="mx-auto grid max-w-[1180px] grid-cols-1 lg:grid-cols-[460px_1fr]">
        {/* Left: form */}
        <div className="border-line px-6 py-8 sm:px-8 lg:border-r">
          <div className="mb-3">
            <AdminSessionBar unlocked={unlocked} onUnlock={unlock} onLock={lock} compact />
          </div>

          <section className="mb-9">
            <h2 className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-accent">
              Step 1
            </h2>
            <p className="mb-2 text-[17px] font-semibold">Extract from Figma</p>
            <p className="mb-3.5 text-[13px] leading-relaxed text-ink-2">
              Select a component in Figma, copy it (Ctrl+C / Cmd+C), then click below. The preview
              on the right updates as soon as valid data is found.
            </p>

            <button
              onClick={handleExtract}
              disabled={isExtracting}
              className={`w-full rounded-control bg-ink px-6 py-3 text-[14px] font-medium text-canvas ${
                isExtracting ? "cursor-wait opacity-70" : "cursor-pointer"
              }`}
            >
              {isExtracting ? "Reading clipboard…" : "Extract from Clipboard"}
            </button>
          </section>

          {extracted?.isValidFigmaData && (
            <section className="mb-9">
              <h2 className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-accent">
                Step 2
              </h2>
              <p className="mb-5 text-[17px] font-semibold">Component Details</p>

              <div className="flex flex-col gap-4">
                <Field label="Name" required>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Hero Section — Split Layout"
                    className="w-full rounded-control border border-line bg-field px-3 py-2.5 text-[14px] text-ink outline-none"
                  />
                </Field>

                <Field label="Category">
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-control border border-line bg-field px-3 py-2.5 text-[14px] text-ink outline-none"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                </Field>

                <Field label="Tags" hint="Comma-separated">
                  <input
                    type="text"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="hero, landing, split-layout"
                    className="w-full rounded-control border border-line bg-field px-3 py-2.5 text-[14px] text-ink outline-none"
                  />
                </Field>

                <Field label="Description">
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="A brief description of this component..."
                    rows={3}
                    className="w-full resize-y rounded-control border border-line bg-field px-3 py-2.5 text-[14px] text-ink outline-none"
                  />
                </Field>

                <Field label="Custom Thumbnail URL" hint="optional — overrides the captured preview">
                  <input
                    type="text"
                    value={thumbnailUrl}
                    onChange={(e) => setThumbnailUrl(e.target.value)}
                    placeholder="Leave blank to use the captured preview automatically"
                    className="w-full rounded-control border border-line bg-field px-3 py-2.5 text-[14px] text-ink outline-none"
                  />
                  <p className="mt-1.5 text-[12px] leading-relaxed text-ink-3">
                    By default the screenshot captured on the right becomes this component's
                    thumbnail — no upload needed. Only fill this in if you want a different image.
                  </p>
                </Field>

                <Field label="Figma Source URL" hint="for re-extraction later">
                  <input
                    type="text"
                    value={sourceUrl}
                    onChange={(e) => setSourceUrl(e.target.value)}
                    placeholder="https://www.figma.com/file/..."
                    className="w-full rounded-control border border-line bg-field px-3 py-2.5 text-[14px] text-ink outline-none"
                  />
                </Field>
              </div>
            </section>
          )}

          {extracted?.isValidFigmaData && (
            <section>
              <h2 className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-accent">
                Step 3
              </h2>
              <p className="mb-5 text-[17px] font-semibold">Test & Save</p>

              <div className="flex gap-2.5">
                <button
                  onClick={handleTestPaste}
                  disabled={isTesting}
                  className={`flex-1 rounded-control border border-line bg-field px-6 py-3 text-[14px] font-medium text-ink ${
                    isTesting ? "opacity-70" : ""
                  }`}
                >
                  {isTesting ? "Copied!" : "Test Paste"}
                </button>

                <button
                  onClick={handleSave}
                  disabled={isSaving || !name.trim()}
                  className={`flex-1 rounded-control bg-accent px-6 py-3 text-[14px] font-medium text-white ${
                    isSaving || !name.trim() ? "cursor-not-allowed opacity-50" : "cursor-pointer"
                  }`}
                >
                  {isSaving ? "Saving…" : "Save to Library"}
                </button>
              </div>
            </section>
          )}
        </div>

        {/* Right: live preview */}
        <div className="px-6 py-8 sm:px-8 lg:sticky lg:top-0 lg:self-start">
          <div className="overflow-hidden rounded-[12px] border border-line bg-surface">
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3">
                Captured preview
              </span>
              {extracted?.isValidFigmaData && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-green-400/10 px-2.5 py-1 text-[11px] font-medium text-green-500">
                  <CheckIcon size={10} />
                  Valid Figma data
                </span>
              )}
            </div>

            <div
              className="flex aspect-[16/11] items-center justify-center p-7"
              style={{
                backgroundImage:
                  "linear-gradient(var(--color-line) 1px, transparent 1px), linear-gradient(90deg, var(--color-line) 1px, transparent 1px)",
                backgroundSize: "16px 16px",
                backgroundColor: "var(--color-canvas)",
              }}
            >
              {isFetchingPreview ? (
                <div className="flex flex-col items-center gap-2 text-center text-ink-3">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent opacity-60" />
                  <p className="max-w-[220px] text-[13px] leading-relaxed">
                    Rendering the real preview from Figma…
                  </p>
                </div>
              ) : extracted?.isValidFigmaData && extracted.previewImage ? (
                <img
                  src={extracted.previewImage}
                  alt="Component preview"
                  className="max-h-full max-w-full rounded-[8px] object-contain shadow-[0_12px_32px_rgba(20,20,35,0.14)]"
                />
              ) : (
                <div className="flex flex-col items-center gap-2 text-center text-ink-3">
                  <CopiesIcon size={28} />
                  <p className="max-w-[220px] text-[13px] leading-relaxed">
                    Extract a component to preview its captured screenshot here.
                  </p>
                </div>
              )}
            </div>

            {extracted?.isValidFigmaData && (
              <div className="px-4 py-3.5">
                <div className="rounded-[6px] bg-field px-3 py-2.5 font-mono text-[11.5px] leading-relaxed text-ink-3">
                  <b className="text-ink-2">figmeta</b> {extracted.figmeta?.length ?? 0} chars ·{" "}
                  <b className="text-ink-2">figbuffer</b> {extracted.figbuffer?.length ?? 0} chars
                  <br />
                  <b className="text-ink-2">preview</b>{" "}
                  {isFetchingPreview
                    ? "fetching from Figma…"
                    : extracted.previewImage
                    ? "rendered by Figma ✓"
                    : "not captured"}{" "}
                  · <b className="text-ink-2">display_name</b> "{extracted.displayName || name || "—"}"
                </div>

                {!isFetchingPreview && !extracted.previewImage && (
                  <details className="mt-2.5 rounded-[6px] border border-amber-400/30 bg-amber-400/5 px-3 py-2.5">
                    <summary className="cursor-pointer text-[12px] font-medium text-amber-500">
                      Preview render failed — inspect raw clipboard data
                    </summary>
                    <p className="mt-2 text-[11.5px] leading-relaxed text-ink-3">
                      Check the toast above for the exact error (missing/invalid Figma token, or an
                      API issue). This is the raw clipboard payload, for reference.
                    </p>
                    <textarea
                      readOnly
                      value={extracted.rawHtml}
                      onClick={(e) => e.currentTarget.select()}
                      className="mt-2 h-32 w-full resize-y rounded-[4px] border border-line bg-canvas px-2.5 py-2 font-mono text-[10.5px] leading-relaxed text-ink-2 outline-none"
                    />
                  </details>
                )}
              </div>
            )}
          </div>

          {extracted?.isValidFigmaData && (
            <div className="mt-4 flex flex-col gap-0">
              <SummaryRow label="Will save as" value={name.trim() ? slugify(name.trim()) : "—"} />
              <SummaryRow label="Category" value={categoryLabel} />
              <SummaryRow label="Visible on" value="rareui.vercel.app/library" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Field helper ────────────────────────────────────────────

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-medium text-ink">
        {label}
        {required && <span className="ml-0.5 text-red-400">*</span>}
        {hint && <span className="ml-2 font-normal text-ink-3">{hint}</span>}
      </span>
      {children}
    </label>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-dashed border-line py-2.5 text-[12.5px] last:border-b-0">
      <span className="text-ink-3">{label}</span>
      <span className="max-w-[60%] overflow-hidden text-ellipsis whitespace-nowrap font-medium text-ink">
        {value}
      </span>
    </div>
  );
}
