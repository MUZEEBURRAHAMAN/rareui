import { readFileSync } from "fs";
import { join } from "path";
import { ComponentDetailPage } from "@/components/ui/ComponentDetailPage";
import { CommandPaletteDemo } from "./CommandPaletteDemo";

function readSource(relativePath: string): string {
  return readFileSync(
    join(process.cwd(), "src/components/command-palette", relativePath),
    "utf-8"
  );
}

export default function CommandPalettePage() {
  const files = [
    { name: "CommandPalette.tsx", code: readSource("CommandPalette.tsx") },
    {
      name: "useCommandPalette.ts",
      code: readSource("useCommandPalette.ts"),
    },
    { name: "CommandGroup.tsx", code: readSource("CommandGroup.tsx") },
    { name: "CommandRow.tsx", code: readSource("CommandRow.tsx") },
  ];

  return (
    <ComponentDetailPage
      title="AI Command Palette"
      description="One command center for everything."
      category="AI"
      categoryGroup="Navigation & Discovery"
      installCommand="npx rareui add command-palette"
      foundationFile="src/app/globals.css"
      foundationHref="/theme.css"
      files={files}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <CommandPaletteDemo />
      </div>
    </ComponentDetailPage>
  );
}
