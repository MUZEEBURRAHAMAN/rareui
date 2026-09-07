import { memo } from "react";
import { cn } from "@/lib/cn";
import type { OutlineItem } from "./useEdgeStepper";

interface TickRailProps {
  items: OutlineItem[];
  activeId: string;
  isOpen: boolean;
  onMouseEnter: () => void;
}

/**
 * Collapsed state — vertical strip of subtle tick marks.
 * Each tick corresponds to one outline item. The active tick is brighter.
 */
export const TickRail = memo(function TickRail({
  items,
  activeId,
  isOpen,
  onMouseEnter,
}: TickRailProps) {
  return (
    <div
      className={cn(
        "absolute inset-0 z-10 flex cursor-pointer flex-col items-center justify-center gap-[7px] py-14",
        "transition-opacity duration-200",
        isOpen && "pointer-events-none opacity-0"
      )}
      onMouseEnter={onMouseEnter}
    >
      {items.map((item) => (
        <span
          key={item.id}
          className={cn(
            "h-[1.5px] rounded-[1px] transition-all duration-150",
            item.id === activeId
              ? "w-[18px] bg-ink/55"
              : "w-[14px] bg-ink/[0.18]"
          )}
        />
      ))}
    </div>
  );
});
