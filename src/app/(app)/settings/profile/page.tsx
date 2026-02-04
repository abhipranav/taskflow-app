import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getUserSettings } from "@/app/actions/settings";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export default async function ProfilePage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/login");
  }

  const user = await getUserSettings();

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Profile</h1>
        <p className="text-muted-foreground">
          Manage your account information
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Account Details</CardTitle>
          <CardDescription>
            Your account information from GitHub
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            {session.user.image ? (
              <img
                src={session.user.image}
                alt={session.user.name || "User"}
                className="h-20 w-20 rounded-full"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-primary-foreground text-2xl font-bold">
                {session.user.name?.charAt(0).toUpperCase() || "U"}
              </div>
            )}
            <div>
              <p className="font-medium">{session.user.name}</p>
              <p className="text-sm text-muted-foreground">
                Profile picture synced from GitHub
              </p>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={session.user.name || ""}
              disabled
              className="max-w-md"
            />
            <p className="text-xs text-muted-foreground">
              Name is synced from your GitHub account
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              value={session.user.email || ""}
              disabled
              className="max-w-md"
            />
            <p className="text-xs text-muted-foreground">
              Email is synced from your GitHub account
            </p>
          </div>

          <div className="grid gap-2">
            <Label>Account Created</Label>
            <p className="text-sm">
              {user?.createdAt
                ? new Date(user.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : "Unknown"}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
