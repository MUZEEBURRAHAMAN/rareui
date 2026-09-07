"use client";

import { memo, useEffect, useRef } from "react";
import { cn } from "@/lib/cn";
import type { OutlineItem as OutlineItemType } from "./useEdgeStepper";
import { OutlineItem } from "./OutlineItem";

interface OutlinePanelProps {
  items: OutlineItemType[];
  activeId: string;
  isOpen: boolean;
  onItemClick: (id: string) => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

/**
 * Expanded state — slides in from the right with a hierarchical
 * outline of all sections. Auto-scrolls to keep the active item visible.
 */
export const OutlinePanel = memo(function OutlinePanel({
  items,
  activeId,
  isOpen,
  onItemClick,
  onMouseEnter,
  onMouseLeave,
}: OutlinePanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to active item when it changes
  useEffect(() => {
    if (!isOpen || !scrollRef.current) return;

    const active = scrollRef.current.querySelector<HTMLElement>(
      `[data-item-id="${activeId}"]`
    );
    if (!active) return;

    const container = scrollRef.current;
    const containerRect = container.getBoundingClientRect();
    const itemRect = active.getBoundingClientRect();

    if (
      itemRect.top < containerRect.top ||
      itemRect.bottom > containerRect.bottom
    ) {
      active.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [activeId, isOpen]);

  return (
    <div
      className={cn(
        "absolute inset-0 z-20 flex flex-col overflow-hidden",
        "bg-surface border-l border-line",
        "transition-[transform,opacity] duration-300",
        "[transition-timing-function:cubic-bezier(0.32,0.72,0,1)]",
        isOpen
          ? "translate-x-0 opacity-100 pointer-events-auto"
          : "translate-x-full opacity-0 pointer-events-none"
      )}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto py-5 scrollbar-thin"
      >
        {items.map((item) => (
          <div key={item.id} data-item-id={item.id}>
            <OutlineItem
              item={item}
              isActive={item.id === activeId}
              onClick={onItemClick}
            />
          </div>
        ))}
      </div>
    </div>
  );
});