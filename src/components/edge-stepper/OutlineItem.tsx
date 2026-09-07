"use client";

import { memo, useCallback } from "react";
import { cn } from "@/lib/cn";
import type { OutlineItem as OutlineItemType } from "./useEdgeStepper";

interface OutlineItemProps {
  item: OutlineItemType;
  isActive: boolean;
  onClick: (id: string) => void;
}

const DEPTH_PADDING: Record<number, string> = {
  0: "pl-5",
  1: "pl-9",
  2: "pl-13",
  3: "pl-17",
};

const DEPTH_STYLE: Record<number, string> = {
  0: "font-medium text-ink text-[13px]",
  1: "text-ink-2 text-[13px]",
  2: "text-ink-3 text-[12.5px]",
  3: "text-ink-3 text-[12px]",
};

/**
 * Single row in the expanded outline panel.
 * Handles depth-based indentation, link styling, and expand indicators.
 */
export const OutlineItem = memo(function OutlineItem({
  item,
  isActive,
  onClick,
}: OutlineItemProps) {
  const handleClick = useCallback(() => onClick(item.id), [item.id, onClick]);

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "block w-full cursor-pointer pr-4 py-[5px] text-left leading-[1.45]",
        "transition-[background-color,color] duration-100",
        DEPTH_PADDING[item.depth] ?? "pl-5",
        DEPTH_STYLE[item.depth] ?? "text-ink-3 text-[12px]",
        item.isLink && "!text-[#5b8ad0]",
        isActive ? "bg-ink/[0.05]" : "hover:bg-ink/[0.03] hover:text-ink"
      )}
    >
      {item.label}
      {item.hasExpand && (
        <svg
          className="ml-1 inline-block size-3.5 align-[-2px] opacity-50"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 6l4 4 4-4" />
        </svg>
      )}
    </button>
  );
});