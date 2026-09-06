"use client";

import type { ComponentCard as ComponentCardType } from "@/lib/types";
import { CopyToFigmaButton } from "./CopyToFigmaButton";

interface ComponentCardProps {
  component: ComponentCardType;
  onClick?: () => void;
}

export function ComponentCard({ component, onClick }: ComponentCardProps) {
  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        overflow: "hidden",
        transition: "border-color 150ms ease, box-shadow 150ms ease",
        cursor: onClick ? "pointer" : undefined,
      }}
      onClick={onClick}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "var(--border-strong)";
        e.currentTarget.style.boxShadow =
          "0 4px 12px rgba(0,0,0,0.06)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--border)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      {/* Thumbnail */}
      <div
        style={{
          aspectRatio: "16/10",
          background: "var(--bg-elevated)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {component.thumbnail_url ? (
          <img
            src={component.thumbnail_url}
            alt={component.name}
            loading="lazy"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 8,
              color: "var(--text-muted)",
            }}
          >
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
            <span style={{ fontSize: 12 }}>No preview</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: "12px 14px 14px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 8,
            marginBottom: 8,
          }}
        >
          <div style={{ minWidth: 0, flex: 1 }}>
            <h3
              style={{
                fontSize: 14,
                fontWeight: 600,
                margin: 0,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {component.name}
            </h3>
            {component.description && (
              <p
                style={{
                  fontSize: 12,
                  color: "var(--text-secondary)",
                  margin: "4px 0 0",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {component.description}
              </p>
            )}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 500,
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                padding: "3px 7px",
                borderRadius: 4,
                background: "var(--bg-elevated)",
                color: "var(--text-muted)",
              }}
            >
              {component.category}
            </span>
            {component.copy_count > 0 && (
              <span
                style={{
                  fontSize: 11,
                  color: "var(--text-muted)",
                }}
              >
                {component.copy_count} copies
              </span>
            )}
          </div>

          <div onClick={(e) => e.stopPropagation()}>
            <CopyToFigmaButton
              componentId={component.id}
              componentName={component.name}
              size="sm"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
