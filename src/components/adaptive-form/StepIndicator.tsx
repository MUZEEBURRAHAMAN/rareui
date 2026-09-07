import { memo } from "react";
import { cn } from "@/lib/cn";

interface StepIndicatorProps {
  current: number;
  total: number;
}

export const StepIndicator = memo(function StepIndicator({
  current,
  total,
}: StepIndicatorProps) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={cn(
            "h-[3px] rounded-full transition-all duration-300",
            i === current
              ? "w-6 bg-accent"
              : i < current
                ? "w-3 bg-accent/40"
                : "w-3 bg-line",
          )}
        />
      ))}
    </div>
  );
});
