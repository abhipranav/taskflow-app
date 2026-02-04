"use client";

import { QuickCapture } from "@/components/quick-capture";

interface Board {
  id: string;
  name: string;
  columns: {
    id: string;
    name: string;
    position: number;
  }[];
}

interface QuickCaptureWrapperProps {
  boards: Board[];
}

export function QuickCaptureWrapper({ boards }: QuickCaptureWrapperProps) {
  return <QuickCapture boards={boards} />;
}
