"use client";

import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Github, Layout, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-background to-muted/30">
      {/* Back to Home */}
      <Link 
        href="/welcome" 
        className="absolute top-6 left-6 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to home
      </Link>

      <div className="mx-auto flex w-full flex-col justify-center space-y-8 sm:w-[380px] px-4">
        {/* Logo */}
        <div className="flex flex-col items-center space-y-4 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Layout className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-semibold tracking-tight">Welcome back</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Sign in to continue to TaskFlow
            </p>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
          <Button 
            onClick={() => signIn("github", { callbackUrl: "/" })} 
            className="w-full h-11 text-sm font-medium" 
            size="lg"
          >
            <Github className="mr-2 h-5 w-5" />
            Continue with GitHub
          </Button>
          
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border/50"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Secure authentication</span>
            </div>
          </div>
          
          <p className="text-center text-xs text-muted-foreground leading-relaxed">
            Your data stays on your device. We only use GitHub for authentication, not to access your repositories.
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground">
          By continuing, you agree to our{" "}
          <Link href="#" className="underline underline-offset-4 hover:text-foreground">Terms</Link>
          {" "}and{" "}
          <Link href="#" className="underline underline-offset-4 hover:text-foreground">Privacy Policy</Link>
        </p>
      </div>
    </div>
  );
}
