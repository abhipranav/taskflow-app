import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Trash2, AlertTriangle } from "lucide-react";

export default async function DataPage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Data</h1>
        <p className="text-muted-foreground">
          Manage your data and account
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Data
          </CardTitle>
          <CardDescription>
            Download a copy of all your boards, tasks, and settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" disabled>
            <Download className="mr-2 h-4 w-4" />
            Export All Data (Coming Soon)
          </Button>
          <p className="mt-2 text-xs text-muted-foreground">
            Export will include all boards, columns, cards, labels, and account settings as JSON.
          </p>
        </CardContent>
      </Card>

      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>
            Irreversible actions that affect your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
              <div className="flex-1">
                <p className="font-medium">Delete Account</p>
                <p className="text-sm text-muted-foreground">
                  Permanently delete your account and all associated data. This action cannot be undone.
                </p>
                <Button variant="destructive" size="sm" className="mt-3" disabled>
                  Delete Account (Coming Soon)
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
