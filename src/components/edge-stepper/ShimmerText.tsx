import { memo } from "react";

interface ShimmerTextProps {
  children: string;
}

/** Text with a sliding gradient shimmer effect */
export const ShimmerText = memo(function ShimmerText({
  children,
}: ShimmerTextProps) {
  return (
    <span
      className="bg-clip-text text-[13px] font-medium text-transparent"
      style={{
        backgroundImage:
          "linear-gradient(90deg, var(--color-ink-3) 35%, var(--color-ink) 50%, var(--color-ink-3) 65%)",
        backgroundSize: "200% 100%",
        animation: "shimmer-text 1.4s linear infinite",
      }}
    >
      {children}
    </span>
  );
});
