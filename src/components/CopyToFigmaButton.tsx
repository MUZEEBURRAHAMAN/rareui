"use client";

import { useState, useCallback } from "react";
import { copyToFigmaClipboard } from "@/lib/clipboard";
import type { ClipboardPayload } from "@/lib/types";
import { toast } from "sonner";

interface CopyToFigmaButtonProps {
  componentId: string;
  componentName: string;
  /** If provided, skip the API call and use these directly */
  payload?: ClipboardPayload;
  size?: "sm" | "md";
}

export function CopyToFigmaButton({
  componentId,
  componentName,
  payload,
  size = "md",
}: CopyToFigmaButtonProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "copied" | "error">(
    "idle"
  );

  const handleCopy = useCallback(async () => {
    setStatus("loading");
    try {
      let clipboardPayload: ClipboardPayload;

      if (payload) {
        clipboardPayload = payload;
      } else {
        // Fetch clipboard data from API
        const res = await fetch(`/api/components/${componentId}/clipboard`);
        if (!res.ok) throw new Error("Failed to fetch component data");
        clipboardPayload = await res.json();
      }

      // Write to clipboard in Figma's format
      await copyToFigmaClipboard(clipboardPayload);

      // Log copy event (fire and forget)
      fetch("/api/copy-event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ component_id: componentId }),
      }).catch(() => {});

      setStatus("copied");
      toast.success(`Copied "${componentName}" — paste in Figma`, {
        duration: 3000,
      });

      setTimeout(() => setStatus("idle"), 3000);
    } catch (err) {
      console.error("Copy failed:", err);
      setStatus("error");
      toast.error("Failed to copy. Make sure you're using a supported browser.");
      setTimeout(() => setStatus("idle"), 3000);
    }
  }, [componentId, componentName, payload]);

  const isSmall = size === "sm";

  const label = {
    idle: "Copy to Figma",
    loading: "Copying...",
    copied: "Copied!",
    error: "Failed",
  }[status];

  const icon = {
    idle: copyIcon,
    loading: loadingIcon,
    copied: checkIcon,
    error: errorIcon,
  }[status];

  return (
    <button
      onClick={handleCopy}
      disabled={status === "loading"}
      title="Copy component — paste in Figma with Ctrl+V"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: isSmall ? 4 : 6,
        padding: isSmall ? "6px 10px" : "8px 14px",
        fontSize: isSmall ? 12 : 13,
        fontWeight: 500,
        fontFamily: "inherit",
        background:
          status === "copied"
            ? "var(--success-bg)"
            : status === "error"
              ? "#fef2f2"
              : "var(--accent)",
        color:
          status === "copied"
            ? "var(--success)"
            : status === "error"
              ? "var(--destructive)"
              : "var(--accent-text)",
        border: "none",
        borderRadius: 6,
        cursor: status === "loading" ? "wait" : "pointer",
        transition: "all 150ms ease",
        whiteSpace: "nowrap",
      }}
    >
      <span
        style={{ display: "flex", width: isSmall ? 14 : 16, height: isSmall ? 14 : 16 }}
        dangerouslySetInnerHTML={{ __html: icon }}
      />
      {label}
    </button>
  );
}

const copyIcon = `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="5.5" y="5.5" width="8" height="8" rx="1.5"/><path d="M10.5 5.5V3.5a1.5 1.5 0 00-1.5-1.5H3.5A1.5 1.5 0 002 3.5V9a1.5 1.5 0 001.5 1.5h2"/></svg>`;

const checkIcon = `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 8.5l3 3 6-7"/></svg>`;

const errorIcon = `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M4 12L12 4M4 4l8 8"/></svg>`;

const loadingIcon = `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M8 2v3M8 11v3M2 8h3M11 8h3" stroke-linecap="round" opacity="0.3"/><path d="M8 2v3" stroke-linecap="round"><animateTransform attributeName="transform" type="rotate" from="0 8 8" to="360 8 8" dur="0.8s" repeatCount="indefinite"/></path></svg>`;
