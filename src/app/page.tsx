// rareui-components/src/app/page.tsx
import { readFileSync } from "fs";
import { join } from "path";
import { PrimitiveShowcase, CategorySection } from "@/components/ui";
import { EdgeStepperDemo } from "./components/edge-stepper/EdgeStepperDemo";
import { CommandPaletteDemo } from "./components/command-palette/CommandPaletteDemo";
import { AdaptiveFormDemo } from "./components/adaptive-form/AdaptiveFormDemo";

function readSource(dir: string, relativePath: string): string {
  return readFileSync(join(process.cwd(), dir, relativePath), "utf-8");
}

export default function HomePage() {
  const edgeStepperFiles = [
    {
      name: "EdgeStepper.tsx",
      code: readSource("src/components/edge-stepper", "EdgeStepper.tsx"),
    },
    {
      name: "useEdgeStepper.ts",
      code: readSource("src/components/edge-stepper", "useEdgeStepper.ts"),
    },
    {
      name: "TickRail.tsx",
      code: readSource("src/components/edge-stepper", "TickRail.tsx"),
    },
    {
      name: "OutlinePanel.tsx",
      code: readSource("src/components/edge-stepper", "OutlinePanel.tsx"),
    },
    {
      name: "OutlineItem.tsx",
      code: readSource("src/components/edge-stepper", "OutlineItem.tsx"),
    },
  ];

  const commandPaletteFiles = [
    {
      name: "CommandPalette.tsx",
      code: readSource("src/components/command-palette", "CommandPalette.tsx"),
    },
    {
      name: "useCommandPalette.ts",
      code: readSource(
        "src/components/command-palette",
        "useCommandPalette.ts"
      ),
    },
    {
      name: "CommandGroup.tsx",
      code: readSource("src/components/command-palette", "CommandGroup.tsx"),
    },
    {
      name: "CommandRow.tsx",
      code: readSource("src/components/command-palette", "CommandRow.tsx"),
    },
  ];

  const adaptiveFormFiles = [
    {
      name: "AdaptiveFormFlow.tsx",
      code: readSource("src/components/adaptive-form", "AdaptiveFormFlow.tsx"),
    },
    {
      name: "useAdaptiveForm.ts",
      code: readSource("src/components/adaptive-form", "useAdaptiveForm.ts"),
    },
    {
      name: "StepIndicator.tsx",
      code: readSource("src/components/adaptive-form", "StepIndicator.tsx"),
    },
    {
      name: "FormField.tsx",
      code: readSource("src/components/adaptive-form", "FormField.tsx"),
    },
  ];

  return (
    <div className="mx-auto min-h-svh max-w-4xl">
      {/* ── Hero ── */}
      <header className="flex flex-col items-center px-5 pt-16 pb-20 text-center sm:px-8 sm:pt-24 sm:pb-28">
        <div className="mb-6 inline-flex items-center rounded-full border border-accent/20 bg-accent-dim px-4 py-1.5 text-[12px] font-medium text-accent">
          Free to use UI components
        </div>
        <h1 className="max-w-xl text-[32px] font-bold leading-[1.1] tracking-tight text-ink sm:text-[48px]">
          UI components{" "}
          <span className="text-ink-3">for modern apps</span>
        </h1>
        <p className="mt-5 max-w-md text-[15px] leading-relaxed text-ink-3">
          Beautifully crafted, copy-paste primitives for everything your app
          needs: navigation, forms, commands, and more.
        </p>
        <a
          href="#components"
          className="mt-8 inline-flex items-center rounded-full bg-ink px-6 py-2.5 text-[13px] font-semibold text-canvas transition-opacity hover:opacity-90"
        >
          Browse components
        </a>
      </header>

      {/* ── Components ── */}
      <div id="components" className="scroll-mt-8">
        <CategorySection title="Navigation & Discovery" count={2}>
          <PrimitiveShowcase
            title="Edge Stepper"
            description="Hover-reveal conversation outline with hierarchical navigation."
            category="Navigation"
            minHeight={420}
            expandUrl="/components/edge-stepper"
            code={edgeStepperFiles[0].code}
            filePath="components/edge-stepper/EdgeStepper.tsx"
            extraFiles={edgeStepperFiles.slice(1).map((f) => ({
              path: f.name,
              code: f.code,
            }))}
            codeNote="Self-contained — needs only the foundation tokens."
            installCommand="npx rareui add edge-stepper"
            foundationFile="src/app/globals.css"
            foundationHref="/theme.css"
          >
            <EdgeStepperDemo />
          </PrimitiveShowcase>

          <PrimitiveShowcase
            title="AI Command Palette"
            description="One command center for everything."
            category="AI"
            staggerDelay={100}
            minHeight={420}
            expandUrl="/components/command-palette"
            code={commandPaletteFiles[0].code}
            filePath="components/command-palette/CommandPalette.tsx"
            extraFiles={commandPaletteFiles.slice(1).map((f) => ({
              path: f.name,
              code: f.code,
            }))}
            codeNote="Self-contained — needs only the foundation tokens."
            installCommand="npx rareui add command-palette"
            foundationFile="src/app/globals.css"
            foundationHref="/theme.css"
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <CommandPaletteDemo />
            </div>
          </PrimitiveShowcase>
        </CategorySection>

        <CategorySection title="Forms & Input" count={1}>
          <PrimitiveShowcase
            title="Adaptive Form Flow"
            description="Forms that think ahead — fields appear based on prior answers."
            category="Forms"
            staggerDelay={0}
            minHeight={420}
            expandUrl="/components/adaptive-form"
            code={adaptiveFormFiles[0].code}
            filePath="components/adaptive-form/AdaptiveFormFlow.tsx"
            extraFiles={adaptiveFormFiles.slice(1).map((f) => ({
              path: f.name,
              code: f.code,
            }))}
            codeNote="Self-contained — needs only the foundation tokens."
            installCommand="npx rareui add adaptive-form"
            foundationFile="src/app/globals.css"
            foundationHref="/theme.css"
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <AdaptiveFormDemo />
            </div>
          </PrimitiveShowcase>
        </CategorySection>
      </div>

      {/* ── Footer ── */}
      <footer className="flex flex-col items-center gap-3 border-t border-line/40 px-5 py-12 text-center sm:px-8">
        <span className="text-[14px] font-semibold text-ink">
          Rare<span className="text-accent">UI</span>
        </span>
        <p className="text-[12px] leading-relaxed text-ink-4">
          Built with React + Tailwind CSS v4 · Copy-paste · Tree-shakeable
        </p>
      </footer>
    </div>
  );
}
