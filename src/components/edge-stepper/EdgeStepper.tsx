"use client";

import { memo, useCallback, type ReactNode } from "react";
import { useEdgeStepper, type OutlineItem } from "./useEdgeStepper";
import { TickRail } from "./TickRail";
import { OutlinePanel } from "./OutlinePanel";

interface EdgeStepperProps {
  /** The outline items (sections/headings of your content) */
  items: OutlineItem[];
  /** The scrollable content area */
  children: ReactNode;
  /** Called when an outline item is clicked */
  onNavigate?: (id: string) => void;
  /** Width of the collapsed tick rail in px */
  railWidth?: number;
  /** Width of the expanded outline panel in px */
  panelWidth?: number;
}

/**
 * EdgeStepper — ChatGPT-style edge-anchored conversation stepper.
 *
 * Collapsed: subtle tick marks along the right edge.
 * Hover: expands into a hierarchical outline panel.
 * Click: navigates to the corresponding section.
 *
 * @example
 * ```tsx
 * <EdgeStepper items={outline} onNavigate={(id) => scrollTo(id)}>
 *   <YourContent />
 * </EdgeStepper>
 * ```
 */
export const EdgeStepper = memo(function EdgeStepper({
  items,
  children,
  onNavigate,
  railWidth = 32,
  panelWidth = 240,
}: EdgeStepperProps) {
  const { isOpen, activeId, setActiveId, close, railProps, panelProps } =
    useEdgeStepper({ items });

  const handleItemClick = useCallback(
    (id: string) => {
      setActiveId(id);
      onNavigate?.(id);
    },
    [setActiveId, onNavigate]
  );

  return (
    <div className="relative flex h-full w-full overflow-hidden">
      {/* ── Content area ── */}
      <div
        className="flex-1 overflow-y-auto"
        onClick={close}
      >
        {children}
      </div>

      {/* ── Right edge rail ── */}
      <div
        className="relative shrink-0 transition-[width] duration-300 [transition-timing-function:cubic-bezier(0.32,0.72,0,1)]"
        style={{ width: isOpen ? panelWidth : railWidth }}
      >
        <TickRail
          items={items}
          activeId={activeId}
          isOpen={isOpen}
          onMouseEnter={railProps.onMouseEnter}
        />
        <OutlinePanel
          items={items}
          activeId={activeId}
          isOpen={isOpen}
          onItemClick={handleItemClick}
          onMouseEnter={panelProps.onMouseEnter}
          onMouseLeave={panelProps.onMouseLeave}
        />
      </div>
    </div>
  );
});