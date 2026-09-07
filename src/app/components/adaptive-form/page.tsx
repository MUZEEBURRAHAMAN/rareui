import { readFileSync } from "fs";
import { join } from "path";
import { ComponentDetailPage } from "@/components/ui/ComponentDetailPage";
import { AdaptiveFormDemo } from "./AdaptiveFormDemo";

function readSource(relativePath: string): string {
  return readFileSync(
    join(process.cwd(), "src/components/adaptive-form", relativePath),
    "utf-8"
  );
}

export default function AdaptiveFormPage() {
  const files = [
    {
      name: "AdaptiveFormFlow.tsx",
      code: readSource("AdaptiveFormFlow.tsx"),
    },
    { name: "useAdaptiveForm.ts", code: readSource("useAdaptiveForm.ts") },
    { name: "StepIndicator.tsx", code: readSource("StepIndicator.tsx") },
    { name: "FormField.tsx", code: readSource("FormField.tsx") },
  ];

  return (
    <ComponentDetailPage
      title="Adaptive Form Flow"
      description="Forms that think ahead — fields appear based on prior answers."
      category="Forms"
      categoryGroup="Forms & Input"
      installCommand="npx rareui add adaptive-form"
      foundationFile="src/app/globals.css"
      foundationHref="/theme.css"
      files={files}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <AdaptiveFormDemo />
      </div>
    </ComponentDetailPage>
  );
}
