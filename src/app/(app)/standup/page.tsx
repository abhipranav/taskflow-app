"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Copy,
  Check,
  Sparkles,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { generateStandupReport } from "@/app/actions/standup";
import { format } from "date-fns";

export default function StandupPage() {
  const [report, setReport] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleGenerate() {
    setLoading(true);
    try {
      const result = await generateStandupReport();
      setReport(result.report);
    } catch (error) {
      console.error("Failed to generate standup:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!report) return;
    await navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg">
            <FileText className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Daily Standup</h1>
            <p className="text-muted-foreground">
              {format(new Date(), "EEEE, MMMM d, yyyy")}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          {report && (
            <Button variant="outline" onClick={handleCopy}>
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </>
              )}
            </Button>
          )}
          <Button onClick={handleGenerate} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : report ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Regenerate
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Report
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Report Display */}
      {!report && !loading && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Sparkles className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Generate Your Standup Report</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                AI will analyze your recent activity and generate a professional
                standup report you can share with your team.
              </p>
              <Button onClick={handleGenerate} size="lg">
                <Sparkles className="h-5 w-5 mr-2" />
                Generate Report
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {loading && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Loader2 className="h-16 w-16 mx-auto text-primary animate-spin mb-4" />
              <h3 className="text-xl font-semibold mb-2">Generating Report...</h3>
              <p className="text-muted-foreground">
                Analyzing your activity and creating your standup report
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {report && !loading && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Your Standup Report
              </CardTitle>
              <Badge variant="outline">
                <Sparkles className="h-3 w-3 mr-1" />
                AI Generated
              </Badge>
            </div>
            <CardDescription>
              Copy this report to share with your team
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <div className="whitespace-pre-wrap font-mono text-sm bg-muted p-4 rounded-lg overflow-auto">
                {report}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">💡 Pro Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Keep your task titles descriptive for better AI-generated summaries</li>
            <li>• Mark tasks as complete to track your progress accurately</li>
            <li>• Set due dates to help identify potential blockers</li>
            <li>• Use the Today view to stay focused on what matters</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
