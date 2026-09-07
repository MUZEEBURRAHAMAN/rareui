import { useEffect, useRef, useState } from "react";

/**
 * Returns true once the target element enters the viewport.
 * Uses IntersectionObserver for lazy rendering.
 */
export function useLazyComponent(
  options: IntersectionObserverInit = { rootMargin: "100px" }
): [React.RefObject<HTMLDivElement | null>, boolean] {
  const ref = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || isVisible) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        observer.disconnect();
      }
    }, options);

    observer.observe(el);
    return () => observer.disconnect();
  }, [isVisible, options]);

  return [ref, isVisible];
}
