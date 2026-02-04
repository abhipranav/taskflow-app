"use client";

import dynamic from "next/dynamic";

// Dynamic import to avoid SSR issues with browser APIs
const AIChat = dynamic(
  () => import("@/components/ai-chat").then(mod => ({ default: mod.AIChat })),
  { 
    ssr: false,
    loading: () => null 
  }
);

interface AIChatWrapperProps {
  userName?: string;
}

export function AIChatWrapper({ userName }: AIChatWrapperProps) {
  return <AIChat userName={userName} />;
}
