import { useEffect, useRef, useState } from "react";

/**
 * Returns an elapsed time string (e.g. "12.4s") that updates
 * at a configurable interval. Starts counting on mount.
 */
export function useElapsedTime(intervalMs = 100): string {
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef(Date.now());

  useEffect(() => {
    startRef.current = Date.now();

    const id = setInterval(() => {
      setElapsed(Date.now() - startRef.current);
    }, intervalMs);

    return () => clearInterval(id);
  }, [intervalMs]);

  const seconds = (elapsed / 1000).toFixed(1);
  return `${seconds}s`;
}
