import { FileQuestion, Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted/30">
      <div className="text-center max-w-md">
        <div className="mx-auto mb-6 h-24 w-24 rounded-full bg-muted/50 flex items-center justify-center">
          <FileQuestion className="h-12 w-12 text-muted-foreground" />
        </div>
        
        <h1 className="text-7xl font-bold text-foreground/10 mb-2">404</h1>
        <h2 className="text-2xl font-semibold tracking-tight mb-2">
          Page not found
        </h2>
        <p className="text-muted-foreground mb-8">
          Sorry, we couldn&apos;t find the page you&apos;re looking for. 
          It might have been moved or doesn&apos;t exist.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild size="lg" className="gap-2">
            <Link href="/">
              <Home className="h-4 w-4" />
              Go to Dashboard
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="gap-2">
            <Link href="javascript:history.back()">
              <ArrowLeft className="h-4 w-4" />
              Go back
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
