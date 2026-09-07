"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { extractFigmaClipboard, copyToFigmaClipboard, slugify } from "@/lib/clipboard";
import type { FigmaClipboardData, ComponentCreatePayload, ComponentCard } from "@/lib/types";
import { toast } from "sonner";

const CATEGORIES = [
  { id: "website", label: "Website" },
  { id: "mobile", label: "Mobile" },
  { id: "dashboard", label: "Dashboard" },
  { id: "marketing", label: "Marketing" },
  { id: "ecommerce", label: "E-commerce" },
  { id: "saas", label: "SaaS" },
];

export default function AdminPage() {
  const [extracted, setExtracted] = useState<FigmaClipboardData | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [category, setCategory] = useState("website");
  const [tags, setTags] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [adminPassword, setAdminPassword] = useState("");

  // Manage components state
  const [existingComponents, setExistingComponents] = useState<ComponentCard[]>([]);
  const [loadingComponents, setLoadingComponents] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  const fetchExistingComponents = useCallback(async () => {
    setLoadingComponents(true);
    try {
      const res = await fetch("/api/components?limit=100");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setExistingComponents(data.components || []);
    } catch {
      setExistingComponents([]);
    } finally {
      setLoadingComponents(false);
    }
  }, []);

  useEffect(() => {
    fetchExistingComponents();
  }, [fetchExistingComponents]);

  const handleDelete = useCallback(async (id: string, componentName: string) => {
    if (!adminPassword) {
      toast.error("Enter admin password first");
      return;
    }
    if (!confirm(`Delete "${componentName}"? This cannot be undone.`)) return;

    setDeletingId(id);
    try {
      const res = await fetch(`/api/components/${id}`, {
        method: "DELETE",
        headers: { "x-admin-password": adminPassword },
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Delete failed");
      }
      toast.success(`"${componentName}" deleted`);
      setExistingComponents((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeletingId(null);
    }
  }, [adminPassword]);

  const handleThumbnailUpload = useCallback(async (componentId: string, file: File) => {
    if (!adminPassword) {
      toast.error("Enter admin password first");
      return;
    }

    setUploadingId(componentId);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("componentId", componentId);

      const res = await fetch("/api/upload-thumbnail", {
        method: "POST",
        headers: { "x-admin-password": adminPassword },
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Upload failed");
      }

      const data = await res.json();
      toast.success("Thumbnail uploaded");
      setExistingComponents((prev) =>
        prev.map((c) =>
          c.id === componentId ? { ...c, thumbnail_url: data.thumbnail_url } : c
        )
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploadingId(null);
    }
  }, [adminPassword]);

  const handleExtract = useCallback(async () => {
    setIsExtracting(true);
    try {
      const data = await extractFigmaClipboard();
      setExtracted(data);
      if (data.isValidFigmaData) {
        toast.success("Figma data extracted successfully");
        if (data.displayName) {
          setName(data.displayName);
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

    setIsSaving(true);
    try {
      const payload: ComponentCreatePayload = {
        name: name.trim(),
        slug: slugify(name.trim()),
        category,
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        description: description.trim(),
        thumbnail_url: thumbnailUrl.trim(),
        figmeta: extracted.figmeta,
        figbuffer: extracted.figbuffer,
        display_name: name.trim(),
        source_url: sourceUrl.trim(),
      };

      const res = await fetch("/api/components", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": adminPassword,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save");
      }

      const savedData = await res.json();

      // Auto-upload the Figma preview image as thumbnail
      if (extracted.previewImage && savedData.component?.id) {
        try {
          const base64Data = extracted.previewImage.split(",")[1];
          const mimeMatch = extracted.previewImage.match(/data:([^;]+);/);
          const mime = mimeMatch?.[1] || "image/png";
          const ext = mime.split("/")[1] || "png";

          const byteChars = atob(base64Data);
          const byteArray = new Uint8Array(byteChars.length);
          for (let i = 0; i < byteChars.length; i++) {
            byteArray[i] = byteChars.charCodeAt(i);
          }
          const file = new File([byteArray], `preview.${ext}`, { type: mime });

          const formData = new FormData();
          formData.append("file", file);
          formData.append("componentId", savedData.component.id);

          await fetch("/api/upload-thumbnail", {
            method: "POST",
            headers: { "x-admin-password": adminPassword },
            body: formData,
          });
        } catch {
          // Thumbnail upload is best-effort, don't block the save
        }
      }

      toast.success("Component saved to library");
      fetchExistingComponents();

      // Reset form
      setExtracted(null);
      setName("");
      setTags("");
      setDescription("");
      setThumbnailUrl("");
      setSourceUrl("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setIsSaving(false);
    }
  }, [extracted, name, category, tags, description, thumbnailUrl, sourceUrl, adminPassword, fetchExistingComponents]);

  return (
    <div className="min-h-screen bg-canvas text-ink">
      {/* Header */}
      <div className="border-b border-line px-5 py-4 sm:px-8">
        <div className="flex items-center gap-2 text-[13px] text-ink-3">
          <Link href="/library" className="transition-colors hover:text-ink">Library</Link>
          <span className="text-ink-4">/</span>
          <span>Admin — Extract Components</span>
        </div>
      </div>

      <main className="mx-auto max-w-[640px] px-6 py-10">
        {/* Manage Existing Components */}
        <section className="mb-12">
          <h2 className="mb-2 text-[13px] font-semibold uppercase tracking-[0.05em] text-ink-3">
            Manage
          </h2>
          <p className="mb-4 text-[20px] font-semibold">
            Existing Components
          </p>

          <div className="mb-4">
            <Field label="Admin Password" hint="Required for delete">
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="Enter admin password"
                className="w-full rounded-control border border-line bg-field px-3 py-2.5 text-[14px] text-ink outline-none"
              />
            </Field>
          </div>

          {loadingComponents ? (
            <p className="text-[13px] text-ink-3">Loading...</p>
          ) : existingComponents.length === 0 ? (
            <p className="text-[13px] text-ink-3">No components yet.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {existingComponents.map((comp) => (
                <div
                  key={comp.id}
                  className="rounded-[10px] border border-line bg-field p-3.5"
                >
                  <div className="mb-2.5 flex items-center gap-3">
                    {/* Thumbnail preview */}
                    <div className="flex h-9 w-14 shrink-0 items-center justify-center overflow-hidden rounded-[6px] border border-line bg-canvas">
                      {comp.thumbnail_url ? (
                        <img
                          src={comp.thumbnail_url}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-ink-3 opacity-50">
                          <rect x="3" y="3" width="18" height="18" rx="2" />
                          <circle cx="8.5" cy="8.5" r="1.5" />
                          <path d="M21 15l-5-5L5 21" />
                        </svg>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="overflow-hidden text-ellipsis whitespace-nowrap text-[14px] font-medium">
                        {comp.name}
                      </p>
                      <p className="mt-0.5 text-[12px] text-ink-3">
                        {comp.category} · {comp.copy_count} copies
                      </p>
                    </div>
                  </div>
                  {/* Actions row */}
                  <div className="flex items-center gap-2">
                    <label
                      className={`flex flex-1 items-center justify-center gap-1.5 rounded-control border border-line bg-field px-3 py-1.5 text-[12px] font-medium text-ink ${
                        uploadingId === comp.id ? "cursor-wait opacity-50" : "cursor-pointer"
                      }`}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                      {uploadingId === comp.id ? "Uploading..." : comp.thumbnail_url ? "Replace Thumbnail" : "Upload Thumbnail"}
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/svg+xml"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleThumbnailUpload(comp.id, file);
                          e.target.value = "";
                        }}
                        disabled={uploadingId === comp.id}
                      />
                    </label>
                    <button
                      onClick={() => handleDelete(comp.id, comp.name)}
                      disabled={deletingId === comp.id}
                      className={`whitespace-nowrap rounded-control border border-red-400/40 bg-transparent px-3 py-1.5 text-[12px] font-medium text-red-400 ${
                        deletingId === comp.id ? "cursor-wait opacity-50" : "cursor-pointer"
                      }`}
                    >
                      {deletingId === comp.id ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Step 1: Extract */}
        <section className="mb-12">
          <div className="mb-4">
            <h2 className="mb-2 text-[13px] font-semibold uppercase tracking-[0.05em] text-ink-3">
              Step 1
            </h2>
            <p className="text-[20px] font-semibold">
              Extract from Figma
            </p>
            <p className="mt-2 text-[14px] leading-relaxed text-ink-2">
              Select a component in Figma, copy it (Ctrl+C / Cmd+C), then click
              the button below. The tool reads your clipboard and extracts the
              encoded component data.
            </p>
          </div>

          <button
            onClick={handleExtract}
            disabled={isExtracting}
            className={`w-full rounded-control bg-ink px-6 py-3 text-[14px] font-medium text-canvas ${
              isExtracting ? "cursor-wait opacity-70" : "cursor-pointer"
            }`}
          >
            {isExtracting ? "Reading clipboard..." : "Extract from Clipboard"}
          </button>

          {extracted && (
            <div
              className={`mt-4 rounded-[8px] border border-line p-4 ${
                extracted.isValidFigmaData ? "bg-green-400/10" : "bg-field"
              }`}
            >
              <p
                className={`text-[13px] ${
                  extracted.isValidFigmaData ? "text-green-400" : "text-ink-2"
                }`}
              >
                {extracted.isValidFigmaData
                  ? `✓ Valid Figma data extracted — "${extracted.displayName || "unnamed"}"`
                  : "✗ No Figma data found. Make sure you copied a component."}
              </p>
              {extracted.isValidFigmaData && (
                <>
                  <p className="mt-1 text-[12px] text-ink-3">
                    figmeta: {extracted.figmeta?.length} chars · figbuffer:{" "}
                    {extracted.figbuffer?.length} chars
                    {extracted.previewImage ? " · preview captured" : " · no preview image"}
                  </p>
                  {extracted.previewImage && (
                    <div className="mt-3 overflow-hidden rounded-[8px] border border-line bg-canvas">
                      <img
                        src={extracted.previewImage}
                        alt="Component preview"
                        className="mx-auto block max-h-[200px] max-w-full object-contain"
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </section>

        {/* Step 2: Details */}
        {extracted?.isValidFigmaData && (
          <section className="mb-12">
            <h2 className="mb-2 text-[13px] font-semibold uppercase tracking-[0.05em] text-ink-3">
              Step 2
            </h2>
            <p className="mb-6 text-[20px] font-semibold">
              Component Details
            </p>

            <div className="flex flex-col gap-5">
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
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
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

              <Field label="Thumbnail URL" hint="Paste an image URL or upload to Supabase Storage">
                <input
                  type="text"
                  value={thumbnailUrl}
                  onChange={(e) => setThumbnailUrl(e.target.value)}
                  placeholder="https://your-project.supabase.co/storage/v1/object/public/thumbnails/hero.png"
                  className="w-full rounded-control border border-line bg-field px-3 py-2.5 text-[14px] text-ink outline-none"
                />
              </Field>

              <Field label="Figma Source URL" hint="Link to original Figma file for re-extraction">
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

        {/* Step 3: Test & Save */}
        {extracted?.isValidFigmaData && (
          <section>
            <h2 className="mb-2 text-[13px] font-semibold uppercase tracking-[0.05em] text-ink-3">
              Step 3
            </h2>
            <p className="mb-6 text-[20px] font-semibold">
              Test & Save
            </p>

            <div className="flex gap-3">
              <button
                onClick={handleTestPaste}
                disabled={isTesting}
                className={`flex-1 rounded-control border border-line bg-field px-6 py-3 text-[14px] font-medium text-ink ${
                  isTesting ? "opacity-70" : ""
                }`}
              >
                {isTesting ? "Copied!" : "Test Paste → Copy to Clipboard"}
              </button>

              <button
                onClick={handleSave}
                disabled={isSaving || !name.trim()}
                className={`flex-1 rounded-control bg-ink px-6 py-3 text-[14px] font-medium text-canvas ${
                  isSaving || !name.trim() ? "cursor-not-allowed opacity-50" : "cursor-pointer"
                }`}
              >
                {isSaving ? "Saving..." : "Save to Library"}
              </button>
            </div>

            <p className="mt-3 text-[12px] leading-relaxed text-ink-3">
              Tip: Click "Test Paste" first, switch to Figma, and press Ctrl+V
              to verify the component pastes correctly before saving.
            </p>
          </section>
        )}
      </main>
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
        {required && (
          <span className="ml-0.5 text-red-400">*</span>
        )}
        {hint && (
          <span className="ml-2 font-normal text-ink-3">
            {hint}
          </span>
        )}
      </span>
      {children}
    </label>
  );
}
