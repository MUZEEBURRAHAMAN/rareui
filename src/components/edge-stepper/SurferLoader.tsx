import { memo } from "react";

/** Audio-wave / equalizer style bars */
export const SurferLoader = memo(function SurferLoader() {
  return (
    <span
      aria-hidden="true"
      className="flex h-[14px] shrink-0 items-end gap-[2px]"
    >
      {[0, 120, 240, 80, 200].map((delay, i) => (
        <span
          key={i}
          className="w-[2.5px] rounded-full bg-ink"
          style={{
            height: "100%",
            transformOrigin: "bottom",
            animation: `surfer-wave 600ms ease-in-out ${delay}ms infinite`,
          }}
        />
      ))}
    </span>
  );
});
