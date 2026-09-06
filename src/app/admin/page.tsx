"use client";

import { useState, useEffect, useCallback } from "react";
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
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg)",
        color: "var(--text-primary)",
      }}
    >
      {/* Header */}
      <header
        style={{
          borderBottom: "1px solid var(--border)",
          padding: "16px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <a
            href="/"
            style={{
              color: "var(--text-muted)",
              textDecoration: "none",
              fontSize: 14,
            }}
          >
            ← Back to catalog
          </a>
          <span style={{ color: "var(--text-muted)" }}>·</span>
          <h1 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>
            Admin — Extract Components
          </h1>
        </div>
      </header>

      <main style={{ maxWidth: 640, margin: "0 auto", padding: "40px 24px" }}>
        {/* Manage Existing Components */}
        <section style={{ marginBottom: 48 }}>
          <h2
            style={{
              fontSize: 13,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: "var(--text-muted)",
              margin: "0 0 8px",
            }}
          >
            Manage
          </h2>
          <p style={{ fontSize: 20, fontWeight: 600, margin: "0 0 16px" }}>
            Existing Components
          </p>

          <div style={{ marginBottom: 16 }}>
            <Field label="Admin Password" hint="Required for delete">
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="Enter admin password"
                style={inputStyle}
              />
            </Field>
          </div>

          {loadingComponents ? (
            <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Loading...</p>
          ) : existingComponents.length === 0 ? (
            <p style={{ fontSize: 13, color: "var(--text-muted)" }}>No components yet.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {existingComponents.map((comp) => (
                <div
                  key={comp.id}
                  style={{
                    padding: "14px",
                    background: "var(--bg-elevated)",
                    border: "1px solid var(--border)",
                    borderRadius: 10,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                    {/* Thumbnail preview */}
                    <div
                      style={{
                        width: 56,
                        height: 36,
                        borderRadius: 6,
                        overflow: "hidden",
                        background: "var(--bg)",
                        border: "1px solid var(--border)",
                        flexShrink: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {comp.thumbnail_url ? (
                        <img
                          src={comp.thumbnail_url}
                          alt=""
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: "var(--text-muted)", opacity: 0.5 }}>
                          <rect x="3" y="3" width="18" height="18" rx="2" />
                          <circle cx="8.5" cy="8.5" r="1.5" />
                          <path d="M21 15l-5-5L5 21" />
                        </svg>
                      )}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <p style={{ fontSize: 14, fontWeight: 500, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {comp.name}
                      </p>
                      <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "2px 0 0" }}>
                        {comp.category} · {comp.copy_count} copies
                      </p>
                    </div>
                  </div>
                  {/* Actions row */}
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <label
                      style={{
                        ...secondaryButtonStyle,
                        padding: "6px 12px",
                        fontSize: 12,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        cursor: uploadingId === comp.id ? "wait" : "pointer",
                        opacity: uploadingId === comp.id ? 0.5 : 1,
                        flex: 1,
                        justifyContent: "center",
                      }}
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
                        style={{ display: "none" }}
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
                      style={{
                        background: "transparent",
                        color: "var(--destructive, #ef4444)",
                        border: "1px solid var(--destructive, #ef4444)",
                        borderRadius: 8,
                        padding: "6px 12px",
                        fontSize: 12,
                        fontWeight: 500,
                        cursor: deletingId === comp.id ? "wait" : "pointer",
                        opacity: deletingId === comp.id ? 0.5 : 1,
                        whiteSpace: "nowrap",
                      }}
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
        <section style={{ marginBottom: 48 }}>
          <div style={{ marginBottom: 16 }}>
            <h2
              style={{
                fontSize: 13,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                color: "var(--text-muted)",
                margin: "0 0 8px",
              }}
            >
              Step 1
            </h2>
            <p style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>
              Extract from Figma
            </p>
            <p
              style={{
                fontSize: 14,
                color: "var(--text-secondary)",
                margin: "8px 0 0",
                lineHeight: 1.5,
              }}
            >
              Select a component in Figma, copy it (Ctrl+C / Cmd+C), then click
              the button below. The tool reads your clipboard and extracts the
              encoded component data.
            </p>
          </div>

          <button
            onClick={handleExtract}
            disabled={isExtracting}
            style={{
              background: "var(--accent)",
              color: "var(--accent-text)",
              border: "none",
              borderRadius: 8,
              padding: "12px 24px",
              fontSize: 14,
              fontWeight: 500,
              cursor: isExtracting ? "wait" : "pointer",
              opacity: isExtracting ? 0.7 : 1,
              width: "100%",
            }}
          >
            {isExtracting ? "Reading clipboard..." : "Extract from Clipboard"}
          </button>

          {extracted && (
            <div
              style={{
                marginTop: 16,
                padding: 16,
                background: extracted.isValidFigmaData
                  ? "var(--success-bg)"
                  : "var(--bg-elevated)",
                borderRadius: 8,
                border: "1px solid var(--border)",
              }}
            >
              <p
                style={{
                  fontSize: 13,
                  margin: 0,
                  color: extracted.isValidFigmaData
                    ? "var(--success)"
                    : "var(--text-secondary)",
                }}
              >
                {extracted.isValidFigmaData
                  ? `✓ Valid Figma data extracted — "${extracted.displayName || "unnamed"}"`
                  : "✗ No Figma data found. Make sure you copied a component."}
              </p>
              {extracted.isValidFigmaData && (
                <>
                  <p
                    style={{
                      fontSize: 12,
                      margin: "4px 0 0",
                      color: "var(--text-muted)",
                    }}
                  >
                    figmeta: {extracted.figmeta?.length} chars · figbuffer:{" "}
                    {extracted.figbuffer?.length} chars
                    {extracted.previewImage ? " · preview captured" : " · no preview image"}
                  </p>
                  {extracted.previewImage && (
                    <div style={{ marginTop: 12, borderRadius: 8, overflow: "hidden", border: "1px solid var(--border)", background: "var(--bg)" }}>
                      <img
                        src={extracted.previewImage}
                        alt="Component preview"
                        style={{ display: "block", maxWidth: "100%", maxHeight: 200, objectFit: "contain", margin: "0 auto" }}
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
          <section style={{ marginBottom: 48 }}>
            <h2
              style={{
                fontSize: 13,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                color: "var(--text-muted)",
                margin: "0 0 8px",
              }}
            >
              Step 2
            </h2>
            <p style={{ fontSize: 20, fontWeight: 600, margin: "0 0 24px" }}>
              Component Details
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <Field label="Name" required>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Hero Section — Split Layout"
                  style={inputStyle}
                />
              </Field>

              <Field label="Category">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  style={inputStyle}
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
                  style={inputStyle}
                />
              </Field>

              <Field label="Description">
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="A brief description of this component..."
                  rows={3}
                  style={{ ...inputStyle, resize: "vertical" as const }}
                />
              </Field>

              <Field label="Thumbnail URL" hint="Paste an image URL or upload to Supabase Storage">
                <input
                  type="text"
                  value={thumbnailUrl}
                  onChange={(e) => setThumbnailUrl(e.target.value)}
                  placeholder="https://your-project.supabase.co/storage/v1/object/public/thumbnails/hero.png"
                  style={inputStyle}
                />
              </Field>

              <Field label="Figma Source URL" hint="Link to original Figma file for re-extraction">
                <input
                  type="text"
                  value={sourceUrl}
                  onChange={(e) => setSourceUrl(e.target.value)}
                  placeholder="https://www.figma.com/file/..."
                  style={inputStyle}
                />
              </Field>
            </div>
          </section>
        )}

        {/* Step 3: Test & Save */}
        {extracted?.isValidFigmaData && (
          <section>
            <h2
              style={{
                fontSize: 13,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                color: "var(--text-muted)",
                margin: "0 0 8px",
              }}
            >
              Step 3
            </h2>
            <p style={{ fontSize: 20, fontWeight: 600, margin: "0 0 24px" }}>
              Test & Save
            </p>

            <div style={{ display: "flex", gap: 12 }}>
              <button
                onClick={handleTestPaste}
                disabled={isTesting}
                style={{
                  ...secondaryButtonStyle,
                  opacity: isTesting ? 0.7 : 1,
                  flex: 1,
                }}
              >
                {isTesting ? "Copied!" : "Test Paste → Copy to Clipboard"}
              </button>

              <button
                onClick={handleSave}
                disabled={isSaving || !name.trim()}
                style={{
                  background: "var(--accent)",
                  color: "var(--accent-text)",
                  border: "none",
                  borderRadius: 8,
                  padding: "12px 24px",
                  fontSize: 14,
                  fontWeight: 500,
                  cursor:
                    isSaving || !name.trim() ? "not-allowed" : "pointer",
                  opacity: isSaving || !name.trim() ? 0.5 : 1,
                  flex: 1,
                }}
              >
                {isSaving ? "Saving..." : "Save to Library"}
              </button>
            </div>

            <p
              style={{
                fontSize: 12,
                color: "var(--text-muted)",
                marginTop: 12,
                lineHeight: 1.5,
              }}
            >
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
    <label style={{ display: "block" }}>
      <span
        style={{
          display: "block",
          fontSize: 13,
          fontWeight: 500,
          marginBottom: 6,
          color: "var(--text-primary)",
        }}
      >
        {label}
        {required && (
          <span style={{ color: "var(--destructive)", marginLeft: 2 }}>*</span>
        )}
        {hint && (
          <span
            style={{
              fontWeight: 400,
              color: "var(--text-muted)",
              marginLeft: 8,
            }}
          >
            {hint}
          </span>
        )}
      </span>
      {children}
    </label>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  fontSize: 14,
  background: "var(--bg-input)",
  color: "var(--text-primary)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  outline: "none",
  boxSizing: "border-box",
  fontFamily: "inherit",
};

const secondaryButtonStyle: React.CSSProperties = {
  background: "var(--bg-elevated)",
  color: "var(--text-primary)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  padding: "12px 24px",
  fontSize: 14,
  fontWeight: 500,
  cursor: "pointer",
};
