"use client";

import { memo, useCallback, useState, type ReactNode } from "react";
import { useLazyComponent } from "@/hooks/useLazyComponent";
import { ActionButton } from "./ActionButton";
import { AiIcon } from "./AiIcon";
import { PromptModal } from "./PromptModal";
import { CodeIcon } from "./CodeIcon";
import { CodeModal } from "./CodeModal";

interface PrimitiveShowcaseProps {
  title: string;
  description: string;
  children: ReactNode;
  /** Category tag shown on the card */
  category?: string;
  staggerDelay?: number;
  minHeight?: number;
  onViewCode?: () => void;
  code?: string;
  filePath?: string;
  codeNote?: string;
  installCommand?: string;
  foundationFile?: string;
  foundationHref?: string;
  extraFiles?: Array<{ path: string; code: string }>;
  expandUrl?: string;
}

export const PrimitiveShowcase = memo(function PrimitiveShowcase({
  title,
  description,
  children,
  category,
  staggerDelay = 0,
  minHeight = 380,
  onViewCode,
  code,
  filePath,
  codeNote,
  installCommand,
  foundationFile,
  foundationHref,
  extraFiles,
  expandUrl,
}: PrimitiveShowcaseProps) {
  const [ref, isVisible] = useLazyComponent({ rootMargin: "200px" });
  const [codeOpen, setCodeOpen] = useState(false);
  const [promptOpen, setPromptOpen] = useState(false);

  const openPrompt = useCallback(() => {
    if (code) setPromptOpen(true);
  }, [code]);

  const closePrompt = useCallback(() => setPromptOpen(false), []);

  const handleViewCode = useCallback(() => {
    if (onViewCode) onViewCode();
    else if (code) setCodeOpen(true);
  }, [onViewCode, code]);

  const closeCode = useCallback(() => setCodeOpen(false), []);

  return (
    <div
      ref={ref}
      className="group"
      style={{
        animation: isVisible
          ? `fade-up 600ms cubic-bezier(0.23, 1, 0.32, 1) ${staggerDelay}ms both`
          : "none",
        opacity: isVisible ? undefined : 0,
      }}
    >
      {/* ── Demo surface ── */}
      <div className="relative">
        <a
          href={expandUrl}
          className="block relative overflow-hidden rounded-[16px] border border-line/60 bg-surface transition-[border-color,box-shadow] duration-200 hover:border-line hover:shadow-[0_2px_20px_rgba(0,0,0,0.15)]"
          style={{ minHeight }}
        >
          {isVisible && children}
        </a>

        {/* Action buttons — outside demo surface to avoid event leaking */}
        <div className="pointer-events-none absolute inset-0 z-20">
          <div className="pointer-events-auto absolute top-3 right-3 flex gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100">
            <ActionButton
              label="AI prompt"
              icon={<AiIcon />}
              onClick={openPrompt}
            />
            <ActionButton
              label="View code"
              icon={<CodeIcon />}
              onClick={handleViewCode}
            />
          </div>
        </div>
      </div>

      {/* ── Label below the card ── */}
      <div className="mt-3 flex items-baseline justify-between px-1">
        <div>
          <h3 className="text-[14px] font-semibold text-ink">{title}</h3>
          <p className="mt-0.5 text-[12.5px] text-ink-3">{description}</p>
        </div>
        {category && (
          <span className="rounded-full border border-line px-2.5 py-0.5 text-[10px] font-medium text-ink-4">
            {category}
          </span>
        )}
      </div>

      {/* ── Modals ── */}
      {code && (
        <CodeModal
          open={codeOpen}
          onClose={closeCode}
          title={title}
          filePath={filePath ?? `components/${title.replace(/\s+/g, "")}.tsx`}
          description={codeNote}
          installCommand={installCommand}
          code={code}
          foundationFile={foundationFile}
          foundationHref={foundationHref}
        />
      )}

      {code && (
        <PromptModal
          open={promptOpen}
          onClose={closePrompt}
          title={title}
          filePath={filePath}
          code={code}
          extraFiles={extraFiles}
        />
      )}
    </div>
  );
});
