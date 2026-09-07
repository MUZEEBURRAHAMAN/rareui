"use client";

import { useEffect, useRef } from "react";
import type { ComponentCard } from "@/lib/types";
import { CopyToFigmaButton } from "./CopyToFigmaButton";

interface ComponentSideSheetProps {
  component: ComponentCard | null;
  onClose: () => void;
}

export function ComponentSideSheet({ component, onClose }: ComponentSideSheetProps) {
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!component) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [component, onClose]);

  if (!component) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        ref={backdropRef}
        onClick={(e) => { if (e.target === backdropRef.current) onClose(); }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-6 [animation:rl-fadeIn_200ms_ease]"
      >
        {/* Modal */}
        <div
          onClick={(e) => e.stopPropagation()}
          className="relative flex max-h-[90vh] w-[min(900px,100%)] flex-col overflow-hidden rounded-[16px] border border-line bg-canvas [animation:rl-scaleIn_250ms_ease]"
        >
          {/* Top bar */}
          <div className="flex flex-shrink-0 items-center justify-between px-5 py-3.5">
            {/* Copy to Figma */}
            <CopyToFigmaButton
              componentId={component.id}
              componentName={component.name}
              size="md"
            />

            {/* Right side: copy count + close */}
            <div className="flex items-center gap-4">
              <span className="text-[13px] text-ink-3">
                {component.copy_count} {component.copy_count === 1 ? "Copy" : "Copies"}
              </span>
              <button
                onClick={onClose}
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[10px] border border-line bg-field text-ink-3 transition-colors hover:bg-hover"
                aria-label="Close"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Preview area */}
          <div className="flex min-h-[300px] flex-1 items-center justify-center overflow-auto px-6 pb-6">
            {component.thumbnail_url ? (
              <img
                src={component.thumbnail_url}
                alt={component.name}
                className="max-h-[calc(90vh-100px)] max-w-full rounded-[12px] border border-line object-contain"
              />
            ) : (
              <div className="flex flex-col items-center gap-3 p-[60px] text-ink-3">
                <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="opacity-30">
                  <rect x="3" y="3" width="7" height="7" rx="1" />
                  <rect x="14" y="3" width="7" height="7" rx="1" />
                  <rect x="3" y="14" width="7" height="7" rx="1" />
                  <rect x="14" y="14" width="7" height="7" rx="1" />
                </svg>
                <span className="text-[14px]">No preview available</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes rl-fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes rl-scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </>
  );
}
