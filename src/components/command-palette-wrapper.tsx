"use client";

import { CommandPalette } from "@/components/command-palette";

interface Board {
  id: string;
  name: string;
}

interface CommandPaletteWrapperProps {
  boards: Board[];
}

// Client wrapper for the command palette
export function CommandPaletteWrapper({ boards }: CommandPaletteWrapperProps) {
  return <CommandPalette boards={boards} />;
}
