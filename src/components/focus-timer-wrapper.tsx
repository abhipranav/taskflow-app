"use client";

import { FocusTimer } from "@/components/focus-timer";

export function FocusTimerWrapper({ triggerVariant }: { triggerVariant?: "icon" | "compact" }) {
  return <FocusTimer triggerVariant={triggerVariant} />;
}
