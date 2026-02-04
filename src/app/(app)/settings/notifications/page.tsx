"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Bell,
  Mail,
  Smartphone,
  Clock,
  Save,
  Loader2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import {
  getNotificationPreferences,
  updateNotificationPreferences,
  savePushSubscription,
  removePushSubscription,
} from "@/app/actions/notifications";

interface NotificationPrefs {
  inAppEnabled: boolean;
  inAppDueSoon: boolean;
  inAppOverdue: boolean;
  inAppAssigned: boolean;
  emailEnabled: boolean;
  emailAddress: string | null;
  emailDueSoon: boolean;
  emailOverdue: boolean;
  emailDailyDigest: boolean;
  emailDigestTime: string;
  pushEnabled: boolean;
  pushSubscription: string | null;
  pushDueSoon: boolean;
  pushOverdue: boolean;
  pushAssigned: boolean;
  reminderLeadTime: number;
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
}

export default function NotificationsSettingsPage() {
  const [prefs, setPrefs] = useState<NotificationPrefs | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [pushSupported, setPushSupported] = useState(false);
  const [pushPermission, setPushPermission] = useState<NotificationPermission>("default");

  useEffect(() => {
    loadPreferences();
    checkPushSupport();
  }, []);

  async function loadPreferences() {
    try {
      const data = await getNotificationPreferences();
      setPrefs(data as NotificationPrefs);
    } catch (error) {
      console.error("Failed to load preferences:", error);
    } finally {
      setLoading(false);
    }
  }

  function checkPushSupport() {
    if ("Notification" in window && "serviceWorker" in navigator) {
      setPushSupported(true);
      setPushPermission(Notification.permission);
    }
  }

  async function handleSave() {
    if (!prefs) return;
    setSaving(true);
    try {
      await updateNotificationPreferences(prefs);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error("Failed to save preferences:", error);
    } finally {
      setSaving(false);
    }
  }

  async function handleEnablePush() {
    try {
      const permission = await Notification.requestPermission();
      setPushPermission(permission);

      if (permission === "granted") {
        // Get the service worker registration
        const registration = await navigator.serviceWorker.ready;
        
        // Subscribe to push notifications
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
        });

        // Save subscription to server
        await savePushSubscription(JSON.stringify(subscription));
        setPrefs(prev => prev ? { ...prev, pushEnabled: true } : null);
      }
    } catch (error) {
      console.error("Failed to enable push notifications:", error);
    }
  }

  async function handleDisablePush() {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
      }
      await removePushSubscription();
      setPrefs(prev => prev ? { ...prev, pushEnabled: false } : null);
    } catch (error) {
      console.error("Failed to disable push notifications:", error);
    }
  }

  function updatePref<K extends keyof NotificationPrefs>(key: K, value: NotificationPrefs[K]) {
    setPrefs(prev => prev ? { ...prev, [key]: value } : null);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!prefs) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Failed to load notification preferences
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Notifications</h1>
        <p className="text-muted-foreground">
          Configure how and when you want to be reminded about your tasks
        </p>
      </div>

      {/* In-App Notifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            <CardTitle>In-App Notifications</CardTitle>
          </div>
          <CardDescription>
            Notifications that appear within the app
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable in-app notifications</Label>
              <p className="text-sm text-muted-foreground">
                Show notifications in the app header
              </p>
            </div>
            <Switch
              checked={prefs.inAppEnabled}
              onCheckedChange={(v) => updatePref("inAppEnabled", v)}
            />
          </div>
          
          {prefs.inAppEnabled && (
            <>
              <Separator />
              <div className="space-y-3 pl-4">
                <div className="flex items-center justify-between">
                  <Label className="font-normal">Tasks due soon (24h before)</Label>
                  <Switch
                    checked={prefs.inAppDueSoon}
                    onCheckedChange={(v) => updatePref("inAppDueSoon", v)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="font-normal">Overdue tasks</Label>
                  <Switch
                    checked={prefs.inAppOverdue}
                    onCheckedChange={(v) => updatePref("inAppOverdue", v)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="font-normal">When assigned to a task</Label>
                  <Switch
                    checked={prefs.inAppAssigned}
                    onCheckedChange={(v) => updatePref("inAppAssigned", v)}
                  />
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Email Notifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            <CardTitle>Email Notifications</CardTitle>
          </div>
          <CardDescription>
            Get reminded via email about important tasks
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable email notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive emails for task reminders
              </p>
            </div>
            <Switch
              checked={prefs.emailEnabled}
              onCheckedChange={(v) => updatePref("emailEnabled", v)}
            />
          </div>

          {prefs.emailEnabled && (
            <>
              <Separator />
              <div className="space-y-4 pl-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={prefs.emailAddress || ""}
                    onChange={(e) => updatePref("emailAddress", e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Leave empty to use your account email
                  </p>
                </div>
                
                <div className="flex items-center justify-between">
                  <Label className="font-normal">Tasks due soon</Label>
                  <Switch
                    checked={prefs.emailDueSoon}
                    onCheckedChange={(v) => updatePref("emailDueSoon", v)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="font-normal">Overdue tasks</Label>
                  <Switch
                    checked={prefs.emailOverdue}
                    onCheckedChange={(v) => updatePref("emailOverdue", v)}
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="font-normal">Daily digest email</Label>
                    <p className="text-xs text-muted-foreground">
                      Get a summary of your tasks for the day
                    </p>
                  </div>
                  <Switch
                    checked={prefs.emailDailyDigest}
                    onCheckedChange={(v) => updatePref("emailDailyDigest", v)}
                  />
                </div>

                {prefs.emailDailyDigest && (
                  <div className="space-y-2">
                    <Label htmlFor="digestTime">Digest time</Label>
                    <Input
                      id="digestTime"
                      type="time"
                      value={prefs.emailDigestTime}
                      onChange={(e) => updatePref("emailDigestTime", e.target.value)}
                      className="w-32"
                    />
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Push Notifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            <CardTitle>Push Notifications</CardTitle>
            {pushSupported ? (
              <Badge variant="outline" className="ml-2">
                {pushPermission === "granted" ? (
                  <><CheckCircle className="h-3 w-3 mr-1" /> Enabled</>
                ) : pushPermission === "denied" ? (
                  <><AlertCircle className="h-3 w-3 mr-1" /> Blocked</>
                ) : (
                  "Not enabled"
                )}
              </Badge>
            ) : (
              <Badge variant="secondary" className="ml-2">Not supported</Badge>
            )}
          </div>
          <CardDescription>
            Browser and system notifications even when the app is closed
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!pushSupported ? (
            <p className="text-sm text-muted-foreground">
              Push notifications are not supported in your browser.
            </p>
          ) : pushPermission === "denied" ? (
            <div className="text-sm text-muted-foreground">
              <p>Push notifications are blocked by your browser.</p>
              <p className="mt-1">To enable, click the lock icon in your browser&apos;s address bar and allow notifications.</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable push notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified even when the app is closed
                  </p>
                </div>
                {prefs.pushEnabled ? (
                  <Button variant="outline" size="sm" onClick={handleDisablePush}>
                    Disable
                  </Button>
                ) : (
                  <Button size="sm" onClick={handleEnablePush}>
                    Enable
                  </Button>
                )}
              </div>

              {prefs.pushEnabled && (
                <>
                  <Separator />
                  <div className="space-y-3 pl-4">
                    <div className="flex items-center justify-between">
                      <Label className="font-normal">Tasks due soon</Label>
                      <Switch
                        checked={prefs.pushDueSoon}
                        onCheckedChange={(v) => updatePref("pushDueSoon", v)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="font-normal">Overdue tasks</Label>
                      <Switch
                        checked={prefs.pushOverdue}
                        onCheckedChange={(v) => updatePref("pushOverdue", v)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="font-normal">When assigned to a task</Label>
                      <Switch
                        checked={prefs.pushAssigned}
                        onCheckedChange={(v) => updatePref("pushAssigned", v)}
                      />
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Reminder Timing */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            <CardTitle>Reminder Timing</CardTitle>
          </div>
          <CardDescription>
            Configure when reminders are sent
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Remind me before due date</Label>
            <Select
              value={prefs.reminderLeadTime.toString()}
              onValueChange={(v) => updatePref("reminderLeadTime", parseInt(v))}
            >
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 hour before</SelectItem>
                <SelectItem value="2">2 hours before</SelectItem>
                <SelectItem value="6">6 hours before</SelectItem>
                <SelectItem value="12">12 hours before</SelectItem>
                <SelectItem value="24">24 hours before</SelectItem>
                <SelectItem value="48">2 days before</SelectItem>
                <SelectItem value="168">1 week before</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="space-y-0.5">
              <Label>Quiet hours</Label>
              <p className="text-sm text-muted-foreground">
                Don&apos;t send notifications during these hours
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="space-y-1">
                <Label htmlFor="quietStart" className="text-xs text-muted-foreground">From</Label>
                <Input
                  id="quietStart"
                  type="time"
                  value={prefs.quietHoursStart || ""}
                  onChange={(e) => updatePref("quietHoursStart", e.target.value || null)}
                  className="w-28"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="quietEnd" className="text-xs text-muted-foreground">To</Label>
                <Input
                  id="quietEnd"
                  type="time"
                  value={prefs.quietHoursEnd || ""}
                  onChange={(e) => updatePref("quietHoursEnd", e.target.value || null)}
                  className="w-28"
                />
              </div>
              {(prefs.quietHoursStart || prefs.quietHoursEnd) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    updatePref("quietHoursStart", null);
                    updatePref("quietHoursEnd", null);
                  }}
                >
                  Clear
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : saved ? (
            <>
              <CheckCircle className="mr-2 h-4 w-4" />
              Saved!
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save preferences
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
