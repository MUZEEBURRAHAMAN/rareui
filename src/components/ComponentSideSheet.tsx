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
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.6)",
          zIndex: 100,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          animation: "rl-fadeIn 200ms ease",
        }}
      >
        {/* Modal */}
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: "relative",
            width: "min(900px, 100%)",
            maxHeight: "90vh",
            background: "var(--bg)",
            borderRadius: 16,
            border: "1px solid var(--border)",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            animation: "rl-scaleIn 250ms ease",
          }}
        >
          {/* Top bar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "14px 20px",
              flexShrink: 0,
            }}
          >
            {/* Copy to Figma */}
            <CopyToFigmaButton
              componentId={component.id}
              componentName={component.name}
              size="md"
            />

            {/* Right side: copy count + close */}
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
                {component.copy_count} {component.copy_count === 1 ? "Copy" : "Copies"}
              </span>
              <button
                onClick={onClose}
                style={{
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border)",
                  borderRadius: 10,
                  width: 36,
                  height: 36,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "var(--text-secondary)",
                  flexShrink: 0,
                  transition: "background 150ms ease",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--border)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "var(--bg-elevated)"; }}
                aria-label="Close"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Preview area */}
          <div
            style={{
              flex: 1,
              overflow: "auto",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0 24px 24px",
              minHeight: 300,
            }}
          >
            {component.thumbnail_url ? (
              <img
                src={component.thumbnail_url}
                alt={component.name}
                style={{
                  maxWidth: "100%",
                  maxHeight: "calc(90vh - 100px)",
                  borderRadius: 12,
                  border: "1px solid var(--border)",
                  objectFit: "contain",
                }}
              />
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 12,
                  color: "var(--text-muted)",
                  padding: 60,
                }}
              >
                <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.3 }}>
                  <rect x="3" y="3" width="7" height="7" rx="1" />
                  <rect x="14" y="3" width="7" height="7" rx="1" />
                  <rect x="3" y="14" width="7" height="7" rx="1" />
                  <rect x="14" y="14" width="7" height="7" rx="1" />
                </svg>
                <span style={{ fontSize: 14 }}>No preview available</span>
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
