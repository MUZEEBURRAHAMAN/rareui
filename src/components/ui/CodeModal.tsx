"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CloseIcon } from "./CloseIcon";
import { InfoIcon } from "./InfoIcon";

export interface CodeModalProps {
  /** Whether the dialog is mounted + visible */
  open: boolean;
  /** Called on backdrop click, Escape, or close button */
  onClose: () => void;
  /** Component name, e.g. "Edge Stepper" */
  title: string;
  /** Source path shown under the title, e.g. "components/EdgeStepper.tsx" */
  filePath: string;
  /** One-line note about dependencies */
  description?: string;
  /** Registry install command, rendered after a `$` prompt */
  installCommand?: string;
  /** The full source that Copy puts on the clipboard */
  code: string;
  /** Footer hint — the stylesheet that must be pasted once */
  foundationFile?: string;
  /** Where the footer link points */
  foundationHref?: string;
}

/**
 * Full-source viewer, opened from a showcase card's `</>` button.
 *
 * Header carries the file path, install command and a Copy button;
 * the body scrolls the raw source; the footer pins the one-time
 * foundation-stylesheet reminder.
 */
export const CodeModal = memo(function CodeModal({
  open,
  onClose,
  title,
  filePath,
  description,
  installCommand,
  code,
  foundationFile = "app/globals.css",
  foundationHref,
}: CodeModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard?.writeText(code);
    setCopied(true);
  }, [code]);

  /* Reset the Copy label after a beat */
  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1600);
    return () => clearTimeout(t);
  }, [copied]);

  /* Escape to close + lock the page behind the dialog */
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) setCopied(false);
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      style={{
        background: "rgba(20, 20, 30, 0.28)",
        backdropFilter: "blur(3px)",
        WebkitBackdropFilter: "blur(3px)",
        animation: "fade-in 160ms ease-out both",
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={`${title} source`}
        tabIndex={-1}
        className="flex max-h-[86svh] w-full max-w-3xl flex-col overflow-hidden
          rounded-window bg-canvas shadow-hairline outline-none"
        style={{
          boxShadow:
            "0 0 0 1px var(--color-line), 0 24px 60px rgba(0, 0, 0, 0.22)",
          animation: "modal-in 200ms cubic-bezier(0.23, 1, 0.32, 1) both",
        }}
      >
        {/* ── Header ── */}
        <div className="flex items-start gap-3 border-b border-line px-5 py-4 sm:px-6 sm:py-5">
          <div className="min-w-0 flex-1">
            <h2 className="text-[15px] font-semibold tracking-tight text-ink">
              {title}
            </h2>
            <p className="mt-1 truncate font-mono text-[12.5px] text-ink-2">
              {filePath}
            </p>
            {description && (
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-3">
                {description}
              </p>
            )}
            {installCommand && (
              <p className="mt-2 overflow-x-auto font-mono text-[12.5px] whitespace-nowrap text-ink-2">
                <span className="mr-2 select-none text-ink-4">$</span>
                {installCommand}
              </p>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={handleCopy}
              className="rounded-control bg-ink px-3.5 py-2 text-[13px] font-medium
                text-canvas transition-opacity duration-100 hover:opacity-85
                focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
            >
              {copied ? "Copied" : "Copy"}
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="flex size-8 items-center justify-center rounded-control
                text-ink-3 transition-colors duration-100 hover:bg-hover hover:text-ink
                focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
            >
              <CloseIcon />
            </button>
          </div>
        </div>

        {/* ── Source ── */}
        <div className="min-h-0 flex-1 overflow-auto bg-surface px-5 py-4 sm:px-6 sm:py-5">
          <pre className="font-mono text-[12.5px] leading-[1.65] text-ink">
            <code>{code}</code>
          </pre>
        </div>

        {/* ── Foundation note ── */}
        <div className="flex items-center gap-2 border-t border-line px-5 py-3 sm:px-6">
          <span className="shrink-0 text-ink-4">
            <InfoIcon />
          </span>
          <p className="min-w-0 flex-1 text-[12.5px] leading-relaxed text-ink-3">
            Foundation required — paste{" "}
            <code className="rounded-[4px] bg-field px-1.5 py-0.5 font-mono text-[12px] text-ink-2">
              {foundationFile}
            </code>{" "}
            once (tokens, <code className="font-mono text-[12px]">@theme</code>{" "}
            mappings, keyframes, reduced-motion).
          </p>
          {foundationHref && (
            <a
              href={foundationHref}
              target="_blank"
              rel="noreferrer"
              className="shrink-0 text-[12.5px] font-medium text-ink
                underline-offset-2 hover:underline"
            >
              {foundationFile.split("/").pop()} <span aria-hidden="true">↗</span>
            </a>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
});
