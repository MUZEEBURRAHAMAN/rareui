"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CloseIcon } from "./CloseIcon";

export interface PromptModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  filePath?: string;
  code: string;
  /** Additional files to include in the prompt (e.g. hooks, sub-components) */
  extraFiles?: Array<{ path: string; code: string }>;
}

const AI_TOOLS = [
  { name: "Claude", color: "#D97757" },
  { name: "Cursor", color: "#00B4D8" },
  { name: "Codex", color: "#10A37F" },
  { name: "Lovable", color: "#FF6B9D" },
  { name: "V0", color: "#FFFFFF" },
];

function buildPrompt(
  title: string,
  filePath: string,
  code: string,
  extraFiles?: Array<{ path: string; code: string }>
): string {
  const fileName = filePath.split("/").pop() ?? `${title.replace(/\s+/g, "")}.tsx`;

  let codeBlock = `\`\`\`tsx\n${fileName}\n${code}\n\`\`\``;

  if (extraFiles?.length) {
    for (const f of extraFiles) {
      const name = f.path.split("/").pop() ?? f.path;
      codeBlock += `\n\n\`\`\`tsx\n${name}\n${f.code}\n\`\`\``;
    }
  }

  return `You are given a task to integrate an existing React component in the codebase

The codebase should support:
- shadcn project structure  
- Tailwind CSS
- Typescript

If it doesn't, provide instructions on how to setup project via shadcn CLI, install Tailwind or Typescript.

Determine the default path for components and styles. 
If default path for components is not /components/ui, provide instructions on why it's important to create this folder
Copy-paste this component to /components/ui folder:
${codeBlock}

Implementation Guidelines
 1. Analyze the component structure and identify all required dependencies
 2. Review the component's arguments and state
 3. Identify any required context providers or hooks and install them
 4. Questions to Ask
 - What data/props will be passed to this component?
 - Are there any specific state management requirements?
 - Are there any required assets (images, icons, etc.)?
 - What is the expected responsive behavior?
 - What is the best place to use this component in the app?

Steps to integrate
 0. Copy paste all the code above in the correct directories
 1. Install external dependencies
 2. Fill image assets with Unsplash stock images you know exist
 3. Use lucide-react icons for svgs or logos if component requires them`;
}

export const PromptModal = memo(function PromptModal({
  open,
  onClose,
  title,
  filePath,
  code,
  extraFiles,
}: PromptModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const resolvedPath = filePath ?? `components/ui/${title.replace(/\s+/g, "")}.tsx`;
  const prompt = buildPrompt(title, resolvedPath, code, extraFiles);

  const handleCopy = useCallback(() => {
    navigator.clipboard?.writeText(prompt);
    setCopied(true);
  }, [prompt]);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1600);
    return () => clearTimeout(t);
  }, [copied]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
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
        aria-label={`${title} AI prompt`}
        tabIndex={-1}
        className="flex max-h-[86svh] w-full max-w-2xl flex-col overflow-hidden
          rounded-window bg-canvas outline-none"
        style={{
          boxShadow:
            "0 0 0 1px var(--color-line), 0 24px 60px rgba(0, 0, 0, 0.22)",
          animation: "modal-in 200ms cubic-bezier(0.23, 1, 0.32, 1) both",
        }}
      >
        {/* ── Header ── */}
        <div className="flex items-start gap-3 border-b border-line px-5 py-4 sm:px-6 sm:py-5">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="shrink-0 text-accent">
                <path
                  d="M9 4.5a.75.75 0 0 1 .721.544l.813 2.846a3.75 3.75 0 0 0 2.576 2.576l2.846.813a.75.75 0 0 1 0 1.442l-2.846.813a3.75 3.75 0 0 0-2.576 2.576l-.813 2.846a.75.75 0 0 1-1.442 0l-.813-2.846a3.75 3.75 0 0 0-2.576-2.576l-2.846-.813a.75.75 0 0 1 0-1.442l2.846-.813A3.75 3.75 0 0 0 7.734 7.89l.813-2.846A.75.75 0 0 1 9 4.5Z"
                  fill="currentColor"
                />
                <path
                  d="M17 13.5a.75.75 0 0 1 .712.513l.394 1.183c.15.447.5.799.948.948l1.183.395a.75.75 0 0 1 0 1.422l-1.183.395c-.447.15-.799.5-.948.948l-.395 1.183a.75.75 0 0 1-1.422 0l-.395-1.183a1.5 1.5 0 0 0-.948-.948l-1.183-.395a.75.75 0 0 1 0-1.422l1.183-.395c.447-.15.799-.5.948-.948l.395-1.183A.75.75 0 0 1 17 13.5Z"
                  fill="currentColor"
                  opacity="0.55"
                />
              </svg>
              <h2 className="text-[15px] font-semibold tracking-tight text-ink">
                AI Prompt
              </h2>
            </div>
            <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-3">
              Copy this prompt and paste it into any AI tool to generate the{" "}
              <span className="font-medium text-ink-2">{title}</span> component.
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={handleCopy}
              className={`rounded-control px-3.5 py-2 text-[13px] font-medium
                transition-all duration-150 focus-visible:ring-2
                focus-visible:ring-accent focus-visible:outline-none ${
                  copied
                    ? "bg-green-500/15 text-green-400"
                    : "bg-ink text-canvas hover:opacity-85"
                }`}
            >
              {copied ? "Copied!" : "Copy Prompt"}
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

        {/* ── AI Tools chips ── */}
        <div className="flex flex-wrap items-center gap-2 border-b border-line px-5 py-3 sm:px-6">
          <span className="text-[12px] text-ink-4">Works with</span>
          {AI_TOOLS.map((tool) => (
            <span
              key={tool.name}
              className="inline-flex items-center gap-1.5 rounded-full bg-field px-2.5 py-1
                text-[12px] font-medium text-ink-2"
            >
              <span
                className="size-2 rounded-full"
                style={{ backgroundColor: tool.color }}
              />
              {tool.name}
            </span>
          ))}
        </div>

        {/* ── Prompt body ── */}
        <div className="min-h-0 flex-1 overflow-auto bg-surface px-5 py-4 sm:px-6 sm:py-5">
          <pre className="font-mono text-[12.5px] leading-[1.65] whitespace-pre-wrap text-ink-2">
            {prompt}
          </pre>
        </div>
      </div>
    </div>,
    document.body,
  );
});
