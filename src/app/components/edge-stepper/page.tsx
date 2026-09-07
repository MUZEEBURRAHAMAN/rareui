import { readFileSync } from "fs";
import { join } from "path";
import { ComponentDetailPage } from "@/components/ui/ComponentDetailPage";
import { EdgeStepperDemo } from "./EdgeStepperDemo";

function readSource(relativePath: string): string {
  return readFileSync(
    join(process.cwd(), "src/components/edge-stepper", relativePath),
    "utf-8"
  );
}

export default function EdgeStepperPage() {
  const files = [
    { name: "EdgeStepper.tsx", code: readSource("EdgeStepper.tsx") },
    { name: "useEdgeStepper.ts", code: readSource("useEdgeStepper.ts") },
    { name: "TickRail.tsx", code: readSource("TickRail.tsx") },
    { name: "OutlinePanel.tsx", code: readSource("OutlinePanel.tsx") },
    { name: "OutlineItem.tsx", code: readSource("OutlineItem.tsx") },
  ];

  return (
    <ComponentDetailPage
      title="Edge Stepper"
      description="A hover-reveal conversation outline with hierarchical navigation. Dock it to the edge of any scrollable content to give readers an always-available table of contents."
      category="Navigation"
      categoryGroup="Navigation & Discovery"
      installCommand="npx rareui add edge-stepper"
      foundationFile="src/app/globals.css"
      foundationHref="/theme.css"
      files={files}
    >
      <EdgeStepperDemo />
    </ComponentDetailPage>
  );
}
