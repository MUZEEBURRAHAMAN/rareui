"use client";

import { useCallback, useRef } from "react";
import { EdgeStepper } from "@/components/edge-stepper";
import { sampleOutline } from "@/data/outlineItems";
import { contentBlocks } from "@/data/contentBlocks";

export function EdgeStepperDemo() {
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleNavigate = useCallback((id: string) => {
    const el = scrollRef.current?.querySelector(`[data-section-id="${id}"]`);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  return (
    <div ref={scrollRef} className="absolute inset-0 overflow-y-auto">
      <EdgeStepper items={sampleOutline} onNavigate={handleNavigate}>
        <div className="px-6 py-8 sm:px-10">
          {contentBlocks.map((block) => (
            <article
              key={block.id}
              data-section-id={block.id}
              className="mb-6 last:mb-0"
              style={{ paddingLeft: block.depth * 16 }}
            >
              <h3
                className={
                  block.depth === 0
                    ? "mb-1.5 text-[14px] font-semibold text-ink"
                    : block.depth === 1
                      ? "mb-1 text-[13px] font-medium text-ink-2"
                      : "mb-1 text-[12.5px] font-medium text-ink-3"
                }
              >
                {block.heading}
              </h3>
              <p
                className={
                  block.depth === 0
                    ? "text-[13px] leading-relaxed text-ink-3"
                    : "text-[12.5px] leading-relaxed text-ink-4"
                }
              >
                {block.body}
              </p>
            </article>
          ))}
        </div>
      </EdgeStepper>
    </div>
  );
}
