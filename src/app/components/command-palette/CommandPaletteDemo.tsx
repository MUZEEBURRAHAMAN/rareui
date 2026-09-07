"use client";

import { CommandPalette } from "@/components/command-palette";
import { sampleCommands } from "@/data/commandItems";

export function CommandPaletteDemo() {
  return (
    <CommandPalette
      commands={sampleCommands}
      onSelect={(cmd) => console.log("Selected:", cmd.label)}
      embedded
    />
  );
}
