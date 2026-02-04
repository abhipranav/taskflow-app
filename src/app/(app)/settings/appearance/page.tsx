"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Moon, Sun, Monitor, Check } from "lucide-react";
import { getUserPreferences, updateUserPreferences } from "@/app/actions/settings";

const themes = [
  { id: "light", label: "Light", icon: Sun },
  { id: "dark", label: "Dark", icon: Moon },
  { id: "system", label: "System", icon: Monitor },
] as const;

export default function AppearancePage() {
  const { theme, setTheme } = useTheme();
  const [compactMode, setCompactMode] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Load preferences
    getUserPreferences().then((prefs) => {
      if (prefs) {
        setCompactMode(prefs.compactMode ?? false);
      }
    });
  }, []);

  const handleThemeChange = async (newTheme: string) => {
    setTheme(newTheme);
    setSaving(true);
    await updateUserPreferences({ theme: newTheme });
    setSaving(false);
  };

  const handleCompactModeChange = async (enabled: boolean) => {
    setCompactMode(enabled);
    setSaving(true);
    await updateUserPreferences({ compactMode: enabled });
    setSaving(false);
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Appearance</h1>
        <p className="text-muted-foreground">
          Customize how TaskFlow looks and feels
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Theme</CardTitle>
          <CardDescription>
            Select your preferred color scheme
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {themes.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => handleThemeChange(id)}
                className={`relative flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-colors ${
                  theme === id
                    ? "border-primary bg-primary/5"
                    : "border-muted hover:border-muted-foreground/50"
                }`}
              >
                <Icon className="h-6 w-6" />
                <span className="text-sm font-medium">{label}</span>
                {theme === id && (
                  <div className="absolute right-2 top-2">
                    <Check className="h-4 w-4 text-primary" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Display</CardTitle>
          <CardDescription>
            Adjust how content is displayed
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="compact-mode">Compact Mode</Label>
              <p className="text-sm text-muted-foreground">
                Use smaller spacing and font sizes
              </p>
            </div>
            <Switch
              id="compact-mode"
              checked={compactMode}
              onCheckedChange={handleCompactModeChange}
            />
          </div>
        </CardContent>
      </Card>

      {saving && (
        <p className="text-sm text-muted-foreground">Saving...</p>
      )}
    </div>
  );
}
