import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getAIProviderStatus, getUserPreferences } from "@/app/actions/settings";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, X, Github, Bot, Zap, Server } from "lucide-react";

export default async function IntegrationsPage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/login");
  }

  const aiStatus = await getAIProviderStatus();
  const prefs = await getUserPreferences();

  const aiProviders = [
    {
      id: "gemini",
      name: "Google Gemini",
      description: "Fast, free tier with 1M tokens/month",
      icon: Bot,
      configured: aiStatus.providers.gemini.configured,
    },
    {
      id: "groq",
      name: "Groq",
      description: "Very fast inference, 14,400 req/day free",
      icon: Zap,
      configured: aiStatus.providers.groq.configured,
    },
    {
      id: "ollama",
      name: "Ollama (Local)",
      description: "Private, no data leakage, unlimited",
      icon: Server,
      configured: aiStatus.providers.ollama.configured,
    },
  ];

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Integrations</h1>
        <p className="text-muted-foreground">
          Connect TaskFlow with external services
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Github className="h-5 w-5" />
            GitHub
          </CardTitle>
          <CardDescription>
            Authentication and code repository integration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {session.user.image && (
                <img
                  src={session.user.image}
                  alt=""
                  className="h-10 w-10 rounded-full"
                />
              )}
              <div>
                <p className="font-medium">{session.user.name}</p>
                <p className="text-sm text-muted-foreground">{session.user.email}</p>
              </div>
            </div>
            <Badge variant="default" className="bg-green-600">
              <Check className="mr-1 h-3 w-3" />
              Connected
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>AI Providers</CardTitle>
          <CardDescription>
            Configure AI providers for task summarization and subtask generation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Current provider:</span>
            <Badge variant="outline">{aiStatus.currentProvider}</Badge>
          </div>

          <div className="space-y-3">
            {aiProviders.map((provider) => (
              <div
                key={provider.id}
                className={`flex items-center justify-between rounded-lg border p-4 ${
                  aiStatus.currentProvider === provider.id
                    ? "border-primary bg-primary/5"
                    : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                    <provider.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium">{provider.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {provider.description}
                    </p>
                  </div>
                </div>
                <Badge
                  variant={provider.configured ? "default" : "secondary"}
                  className={provider.configured ? "bg-green-600" : ""}
                >
                  {provider.configured ? (
                    <>
                      <Check className="mr-1 h-3 w-3" />
                      Configured
                    </>
                  ) : (
                    <>
                      <X className="mr-1 h-3 w-3" />
                      Not configured
                    </>
                  )}
                </Badge>
              </div>
            ))}
          </div>

          <p className="text-xs text-muted-foreground">
            Configure AI providers in your <code className="bg-muted px-1 py-0.5 rounded">.env.local</code> file. 
            See the <a href="/docs/ai-providers" className="text-primary hover:underline">AI Provider documentation</a> for details.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
