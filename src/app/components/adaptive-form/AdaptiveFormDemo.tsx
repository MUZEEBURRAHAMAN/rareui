"use client";

import { AdaptiveFormFlow } from "@/components/adaptive-form";
import { sampleFormSteps } from "@/data/formSteps";

export function AdaptiveFormDemo() {
  return (
    <AdaptiveFormFlow
      steps={sampleFormSteps}
      onSubmit={(v) => console.log("Form submitted:", v)}
    />
  );
}
