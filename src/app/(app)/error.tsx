"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCcw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import Link from "next/link";

interface ErrorBoundaryProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorBoundary({ error, reset }: ErrorBoundaryProps) {
  useEffect(() => {
    // Log error to console in development, could send to service in production
    console.error("Error boundary caught:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted/30">
      <Card className="w-full max-w-md shadow-2xl border-border/50 bg-background/95 backdrop-blur-sm">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <h2 className="text-2xl font-semibold tracking-tight">
            Something went wrong
          </h2>
          <p className="text-muted-foreground text-sm mt-2">
            We encountered an unexpected error. Don&apos;t worry, your data is safe.
          </p>
        </CardHeader>
        
        <CardContent className="text-center">
          {process.env.NODE_ENV === "development" && (
            <details className="mt-4 text-left">
              <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground transition-colors">
                Technical details
              </summary>
              <pre className="mt-2 p-3 bg-muted rounded-lg text-xs overflow-auto max-h-32 text-muted-foreground">
                {error.message}
                {error.digest && `\n\nDigest: ${error.digest}`}
              </pre>
            </details>
          )}
        </CardContent>
        
        <CardFooter className="flex flex-col gap-3 pt-2">
          <Button 
            onClick={reset} 
            className="w-full gap-2"
            size="lg"
          >
            <RefreshCcw className="h-4 w-4" />
            Try again
          </Button>
          <Button 
            asChild 
            variant="outline" 
            className="w-full gap-2"
            size="lg"
          >
            <Link href="/">
              <Home className="h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
