"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, User, Palette, Plug, Database, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const settingsNav = [
  { name: "Profile", href: "/settings/profile", icon: User },
  { name: "Notifications", href: "/settings/notifications", icon: Bell },
  { name: "Appearance", href: "/settings/appearance", icon: Palette },
  { name: "Integrations", href: "/settings/integrations", icon: Plug },
  { name: "Data", href: "/settings/data", icon: Database },
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex h-full">
      {/* Settings Sidebar */}
      <aside className="w-64 border-r bg-muted/30 p-4">
        <div className="mb-6">
          <Button variant="ghost" size="sm" asChild className="-ml-2">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to app
            </Link>
          </Button>
        </div>
        
        <div className="space-y-1">
          <h2 className="mb-2 px-2 text-lg font-semibold">Settings</h2>
          {settingsNav.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                pathname === item.href
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          ))}
        </div>
      </aside>

      {/* Settings Content */}
      <main className="flex-1 overflow-auto p-8">
        {children}
      </main>
    </div>
  );
}
