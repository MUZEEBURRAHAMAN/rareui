import { memo } from "react";

/** Three dots pulsing in sequence */
export const DotsLoader = memo(function DotsLoader() {
  return (
    <span aria-hidden="true" className="flex shrink-0 items-center gap-[3px]">
      {[0, 150, 300].map((delay) => (
        <span
          key={delay}
          className="size-[5px] rounded-full bg-ink"
          style={{
            animation: `pulse-dot 800ms ease-in-out ${delay}ms infinite`,
          }}
        />
      ))}
    </span>
  );
});
