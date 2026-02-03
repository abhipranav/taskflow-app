"use client";

import { useEffect } from "react";
import { AlertOctagon, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error("Global error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen flex items-center justify-center bg-zinc-950 text-white p-4">
        <div className="text-center max-w-md">
          <div className="mx-auto mb-6 h-20 w-20 rounded-full bg-red-500/10 flex items-center justify-center">
            <AlertOctagon className="h-10 w-10 text-red-500" />
          </div>
          <h2 className="text-2xl font-semibold mb-2">
            Critical Error
          </h2>
          <p className="text-zinc-400 mb-6">
            A critical error occurred. We&apos;ve been notified and are working on it.
          </p>
          <Button 
            onClick={reset}
            className="gap-2 bg-white text-black hover:bg-zinc-200"
          >
            <RefreshCcw className="h-4 w-4" />
            Try again
          </Button>
        </div>
      </body>
    </html>
  );
}
