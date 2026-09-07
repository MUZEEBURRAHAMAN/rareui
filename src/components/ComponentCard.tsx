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
      className={`overflow-hidden rounded-[12px] border border-line/60 bg-surface transition-[border-color,box-shadow] duration-150 hover:border-line hover:shadow-[0_2px_20px_rgba(0,0,0,0.15)] ${
        onClick ? "cursor-pointer" : ""
      }`}
      onClick={onClick}
    >
      {/* Thumbnail */}
      <div className="relative flex aspect-[16/10] items-center justify-center overflow-hidden bg-field">
        {component.thumbnail_url ? (
          <img
            src={component.thumbnail_url}
            alt={component.name}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-ink-3">
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
            <span className="text-[12px]">No preview</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="px-3.5 pb-3.5 pt-3">
        <div className="mb-2 flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="m-0 overflow-hidden text-ellipsis whitespace-nowrap text-[14px] font-semibold text-ink">
              {component.name}
            </h3>
            {component.description && (
              <p className="m-0 mt-1 overflow-hidden text-ellipsis whitespace-nowrap text-[12px] text-ink-2">
                {component.description}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span className="rounded bg-field px-[7px] py-[3px] text-[11px] font-medium uppercase tracking-[0.04em] text-ink-3">
              {component.category}
            </span>
            {component.copy_count > 0 && (
              <span className="text-[11px] text-ink-3">
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
