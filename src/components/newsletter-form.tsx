"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { subscribeToNewsletter } from "@/app/actions/newsletter";
import { Loader2, CheckCircle2, Mail } from "lucide-react";

interface NewsletterFormProps {
  source?: string;
  className?: string;
  variant?: "default" | "inline";
}

export function NewsletterForm({ source = "website", className = "", variant = "default" }: NewsletterFormProps) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    startTransition(async () => {
      const result = await subscribeToNewsletter(email, source);
      
      if (result.success) {
        setMessage({ type: "success", text: result.message || "Subscribed!" });
        setEmail("");
      } else {
        setMessage({ type: "error", text: result.error || "Failed to subscribe" });
      }
    });
  };

  if (variant === "inline") {
    return (
      <form onSubmit={handleSubmit} className={`flex gap-2 ${className}`}>
        <div className="relative flex-1">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="pl-10"
            disabled={isPending}
            required
          />
        </div>
        <Button type="submit" disabled={isPending}>
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Subscribe"}
        </Button>
      </form>
    );
  }

  return (
    <div className={className}>
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
        <div className="relative flex-1">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="pl-10 h-12"
            disabled={isPending}
            required
          />
        </div>
        <Button type="submit" size="lg" className="h-12 px-8" disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Subscribing...
            </>
          ) : (
            "Subscribe"
          )}
        </Button>
      </form>
      
      {message && (
        <div className={`mt-4 flex items-center justify-center gap-2 text-sm ${
          message.type === "success" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
        }`}>
          {message.type === "success" && <CheckCircle2 className="h-4 w-4" />}
          {message.text}
        </div>
      )}
      
      <p className="mt-4 text-xs text-muted-foreground">
        We respect your privacy. Unsubscribe at any time.
      </p>
    </div>
  );
}
