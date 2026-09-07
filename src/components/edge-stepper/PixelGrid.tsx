import { memo } from "react";

/** 3×3 pixel grid loader with staggered blink animation */
const DELAYS = [90, 180, 270, 0, 90, 180, 90, 180, 270];

export const PixelGrid = memo(function PixelGrid() {
  return (
    <span
      aria-hidden="true"
      className="grid shrink-0 grid-cols-[repeat(3,4px)] gap-[1.5px]"
    >
      {DELAYS.map((delay, i) => (
        <span
          key={i}
          className="size-[4px] rounded-[1px] bg-ink"
          style={{
            opacity: 0.15,
            animation: `pixel-on 650ms ease-in-out ${delay}ms infinite`,
          }}
        />
      ))}
    </span>
  );
});
