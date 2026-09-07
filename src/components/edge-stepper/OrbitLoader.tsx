import { memo } from "react";

/** Orbital spinner — a dot circling a ring */
export const OrbitLoader = memo(function OrbitLoader() {
  return (
    <span
      aria-hidden="true"
      className="relative flex size-[16px] shrink-0 items-center justify-center"
    >
      <span className="absolute inset-0 rounded-full border border-ink/10" />
      <span
        className="absolute size-full"
        style={{ animation: "orbit 1s linear infinite" }}
      >
        <span className="absolute top-0 left-1/2 size-[4px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-ink" />
      </span>
    </span>
  );
});
