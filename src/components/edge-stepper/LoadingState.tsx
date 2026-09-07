"use client";

import { lazy, memo, Suspense, useCallback, useState } from "react";
import { useElapsedTime } from "@/hooks/useElapsedTime";
import { ShimmerText } from "./ShimmerText";
import { VariantSwitcher, type LoaderVariant } from "./VariantSwitcher";

// Lazy-load each animation variant
const PixelGrid = lazy(() =>
  import("./PixelGrid").then((m) => ({ default: m.PixelGrid }))
);
const DotsLoader = lazy(() =>
  import("./DotsLoader").then((m) => ({ default: m.DotsLoader }))
);
const OrbitLoader = lazy(() =>
  import("./OrbitLoader").then((m) => ({ default: m.OrbitLoader }))
);
const SurferLoader = lazy(() =>
  import("./SurferLoader").then((m) => ({ default: m.SurferLoader }))
);

interface LoadingStateProps {
  /** Text shown with shimmer effect */
  label?: string;
  /** Initial animation variant */
  defaultVariant?: LoaderVariant;
  /** Show the variant switcher */
  showSwitcher?: boolean;
  /** Show elapsed time counter */
  showTimer?: boolean;
}

const LOADER_MAP: Record<LoaderVariant, React.LazyExoticComponent<React.ComponentType>> = {
  drive: PixelGrid,
  dots: DotsLoader,
  orbit: OrbitLoader,
  surfer: SurferLoader,
};

/** Inline fallback while a variant loads — keeps layout stable */
function LoaderFallback() {
  return <span className="size-[16px] shrink-0" />;
}

export const LoadingState = memo(function LoadingState({
  label = "Churning",
  defaultVariant = "drive",
  showSwitcher = true,
  showTimer = true,
}: LoadingStateProps) {
  const [variant, setVariant] = useState<LoaderVariant>(defaultVariant);
  const elapsed = useElapsedTime(100);

  const handleChange = useCallback((v: LoaderVariant) => setVariant(v), []);

  const ActiveLoader = LOADER_MAP[variant];

  return (
    <div className="relative flex min-h-[272px] w-full items-center justify-center">
      {/* Main loader display */}
      <div className="w-full max-w-120 [&>*]:mx-auto">
        <div role="status" className="flex w-fit items-center gap-2.5">
          <Suspense fallback={<LoaderFallback />}>
            <ActiveLoader />
          </Suspense>

          <ShimmerText>{label}</ShimmerText>

          {showTimer && (
            <span className="font-mono text-[12px] tabular-nums text-ink-3">
              {elapsed}
            </span>
          )}
        </div>
      </div>

      {/* Variant switcher — bottom center */}
      {showSwitcher && (
        <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2">
          <VariantSwitcher active={variant} onChange={handleChange} />
        </div>
      )}
    </div>
  );
});