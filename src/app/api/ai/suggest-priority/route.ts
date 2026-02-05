import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { generateText } from "@/lib/ai";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { title } = await request.json();

  if (!title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  try {
    // Try AI-based priority suggestion
    const prompt = `Analyze this task title and suggest a priority level.
Task: "${title}"

Priority levels:
- p1: Urgent - Critical deadlines, blocking issues, emergencies
- p2: High - Important tasks that should be done soon
- p3: Medium - Regular tasks with moderate importance
- p4: Low - Nice to have, can be done when time permits
- none: No specific priority

Consider keywords like:
- Urgent, ASAP, critical, emergency, blocking → p1
- Important, deadline, review, fix bug → p2
- Update, improve, research, plan → p3
- Refactor, nice to have, eventually, someday → p4

Respond with ONLY the priority code (p1, p2, p3, p4, or none).`;

    const result = await generateText(prompt);
    const priority = result?.trim().toLowerCase();
    
    // Validate response
    if (["p1", "p2", "p3", "p4", "none"].includes(priority || "")) {
      return NextResponse.json({ priority });
    }
    
    // Fallback to rule-based suggestion
    return NextResponse.json({ priority: suggestPriorityFromRules(title) });
  } catch (error) {
    console.error("AI priority suggestion failed:", error);
    // Fallback to rule-based
    return NextResponse.json({ priority: suggestPriorityFromRules(title) });
  }
}

function suggestPriorityFromRules(title: string): string {
  const lowerTitle = title.toLowerCase();
  
  // P1 - Urgent keywords
  const p1Keywords = ["urgent", "asap", "critical", "emergency", "blocking", "crash", "down", "broken"];
  if (p1Keywords.some(k => lowerTitle.includes(k))) return "p1";
  
  // P2 - High priority keywords
  const p2Keywords = ["important", "deadline", "bug", "fix", "security", "review", "release"];
  if (p2Keywords.some(k => lowerTitle.includes(k))) return "p2";
  
  // P3 - Medium priority keywords  
  const p3Keywords = ["update", "improve", "add", "implement", "create", "build"];
  if (p3Keywords.some(k => lowerTitle.includes(k))) return "p3";
  
  // P4 - Low priority keywords
  const p4Keywords = ["refactor", "cleanup", "nice to have", "eventually", "someday", "consider"];
  if (p4Keywords.some(k => lowerTitle.includes(k))) return "p4";
  
  return "none";
}
