"use server";

import { auth } from "@/auth";
import { db } from "@/db";
import { 
  boards, 
  cards, 
  activities, 
  timeEntries,
  chatMessages
} from "@/db/schema";
import { eq, and, gte, desc, asc, sum, isNull } from "drizzle-orm";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getPersonaById, type PersonaId } from "@/lib/ai-personas";

// Types
export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  persona?: PersonaId;
  timestamp: Date;
  contextUsed?: string[];
}

export interface DashboardData {
  totalBoards: number;
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  dueSoonTasks: number;
  tasksByPriority: Record<string, number>;
  tasksByColumn: { columnName: string; count: number }[];
  recentActivity: { action: string; entityTitle: string; createdAt: Date }[];
  timeTracked: number; // in seconds
  upcomingDeadlines: { title: string; dueDate: Date; boardName: string }[];
}

// Fetch comprehensive dashboard data for AI context
export async function getDashboardDataForAI(): Promise<DashboardData | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  const userId = session.user.id;
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date(now);
  nextWeek.setDate(nextWeek.getDate() + 7);

  // Get user's boards
  const userBoards = await db.query.boards.findMany({
    where: eq(boards.userId, userId),
    with: {
      columns: {
        with: {
          cards: {
            where: isNull(cards.archivedAt),
          },
        },
      },
    },
  });

  const totalBoards = userBoards.length;
  
  // Aggregate task data
  let totalTasks = 0;
  let completedTasks = 0;
  let overdueTasks = 0;
  let dueSoonTasks = 0;
  const tasksByPriority: Record<string, number> = { none: 0, p1: 0, p2: 0, p3: 0, p4: 0 };
  const tasksByColumn: { columnName: string; count: number }[] = [];
  const upcomingDeadlines: { title: string; dueDate: Date; boardName: string }[] = [];

  for (const board of userBoards) {
    for (const column of board.columns) {
      let columnCount = 0;
      for (const card of column.cards) {
        totalTasks++;
        columnCount++;
        
        // Count by priority
        const priority = card.priority || "none";
        tasksByPriority[priority] = (tasksByPriority[priority] || 0) + 1;
        
        // Check done column (heuristic: column name contains "done" or "complete")
        if (column.name.toLowerCase().includes("done") || column.name.toLowerCase().includes("complete")) {
          completedTasks++;
        }
        
        // Check due dates
        if (card.dueDate) {
          const dueDate = new Date(card.dueDate);
          if (dueDate < now) {
            overdueTasks++;
          } else if (dueDate <= nextWeek) {
            dueSoonTasks++;
            upcomingDeadlines.push({
              title: card.title,
              dueDate: dueDate,
              boardName: board.name,
            });
          }
        }
      }
      tasksByColumn.push({ columnName: `${board.name} - ${column.name}`, count: columnCount });
    }
  }

  // Sort upcoming deadlines by date
  upcomingDeadlines.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());

  // Get recent activity
  const recentActivity = await db.query.activities.findMany({
    where: eq(activities.userId, userId),
    orderBy: [desc(activities.createdAt)],
    limit: 10,
  });

  // Get total time tracked (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const timeResult = await db
    .select({ total: sum(timeEntries.duration) })
    .from(timeEntries)
    .where(
      and(
        eq(timeEntries.userId, userId),
        gte(timeEntries.createdAt, thirtyDaysAgo)
      )
    );
  
  const timeTracked = Number(timeResult[0]?.total) || 0;

  return {
    totalBoards,
    totalTasks,
    completedTasks,
    overdueTasks,
    dueSoonTasks,
    tasksByPriority,
    tasksByColumn,
    recentActivity: recentActivity.map(a => ({
      action: a.action,
      entityTitle: a.entityTitle || "Unknown",
      createdAt: a.createdAt!,
    })),
    timeTracked,
    upcomingDeadlines: upcomingDeadlines.slice(0, 5),
  };
}

// Get specific task details by search
export async function searchTasksForAI(query: string) {
  const session = await auth();
  if (!session?.user?.id) return [];

  const userId = session.user.id;

  // Get all user boards first
  const userBoards = await db.query.boards.findMany({
    where: eq(boards.userId, userId),
    columns: { id: true, name: true },
  });

  const boardIds = userBoards.map(b => b.id);
  if (boardIds.length === 0) return [];

  // Search cards in user's boards
  const results = await db.query.boards.findMany({
    where: eq(boards.userId, userId),
    with: {
      columns: {
        with: {
          cards: {
            where: isNull(cards.archivedAt),
            with: {
              checklists: true,
              cardLabels: {
                with: {
                  label: true,
                },
              },
            },
          },
        },
      },
    },
  });

  interface MatchingTask {
    id: string;
    title: string;
    description: string | null;
    priority: string | null;
    dueDate: Date | null;
    column: string;
    board: string;
    labels: string[];
    checklistItems: number;
    checklistCompleted: number;
  }

  const matchingTasks: MatchingTask[] = [];
  
  for (const board of results) {
    for (const column of board.columns) {
      for (const card of column.cards) {
        if (
          card.title.toLowerCase().includes(query.toLowerCase()) ||
          card.description?.toLowerCase().includes(query.toLowerCase())
        ) {
          matchingTasks.push({
            id: card.id,
            title: card.title,
            description: card.description,
            priority: card.priority,
            dueDate: card.dueDate,
            column: column.name,
            board: board.name,
            labels: card.cardLabels.map((cl) => cl.label.name),
            checklistItems: card.checklists.length,
            checklistCompleted: card.checklists.filter((c) => c.completed).length,
          });
        }
      }
    }
  }

  return matchingTasks.slice(0, 10);
}

// Get productivity insights
export async function getProductivityInsights() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const userId = session.user.id;
  const now = new Date();
  
  // Last 7 days
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);
  
  // Last 30 days
  const monthAgo = new Date(now);
  monthAgo.setDate(monthAgo.getDate() - 30);

  // Get activities for completed tasks
  const weeklyActivities = await db.query.activities.findMany({
    where: and(
      eq(activities.userId, userId),
      gte(activities.createdAt, weekAgo)
    ),
  });

  const monthlyActivities = await db.query.activities.findMany({
    where: and(
      eq(activities.userId, userId),
      gte(activities.createdAt, monthAgo)
    ),
  });

  // Time tracking stats
  const weeklyTime = await db
    .select({ total: sum(timeEntries.duration) })
    .from(timeEntries)
    .where(
      and(
        eq(timeEntries.userId, userId),
        gte(timeEntries.createdAt, weekAgo)
      )
    );

  const monthlyTime = await db
    .select({ total: sum(timeEntries.duration) })
    .from(timeEntries)
    .where(
      and(
        eq(timeEntries.userId, userId),
        gte(timeEntries.createdAt, monthAgo)
      )
    );

  // Calculate task completion metrics
  const tasksCompletedThisWeek = weeklyActivities.filter(
    a => a.action === "moved" && a.details?.includes("Done")
  ).length;
  
  const tasksCreatedThisWeek = weeklyActivities.filter(
    a => a.action === "created" && a.entityType === "card"
  ).length;

  return {
    weekly: {
      tasksCompleted: tasksCompletedThisWeek,
      tasksCreated: tasksCreatedThisWeek,
      timeTracked: Number(weeklyTime[0]?.total) || 0,
      activityCount: weeklyActivities.length,
    },
    monthly: {
      activityCount: monthlyActivities.length,
      timeTracked: Number(monthlyTime[0]?.total) || 0,
    },
    mostActiveDay: getMostActiveDay(weeklyActivities),
    peakHours: getPeakHours(weeklyActivities),
  };
}

interface ActivityWithDate {
  createdAt: Date | null;
}

function getMostActiveDay(activities: ActivityWithDate[]): string {
  const dayCount: Record<string, number> = {};
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  
  activities.forEach(a => {
    if (a.createdAt) {
      const day = days[new Date(a.createdAt).getDay()];
      dayCount[day] = (dayCount[day] || 0) + 1;
    }
  });

  const maxDay = Object.entries(dayCount).sort((a, b) => b[1] - a[1])[0];
  return maxDay ? maxDay[0] : "Not enough data";
}

function getPeakHours(activities: ActivityWithDate[]): string {
  const hourCount: Record<number, number> = {};
  
  activities.forEach(a => {
    if (a.createdAt) {
      const hour = new Date(a.createdAt).getHours();
      hourCount[hour] = (hourCount[hour] || 0) + 1;
    }
  });

  const sorted = Object.entries(hourCount).sort((a, b) => Number(b[1]) - Number(a[1]));
  if (sorted.length < 2) return "Not enough data";
  
  const peakHours = sorted.slice(0, 2).map(([hour]) => {
    const h = Number(hour);
    const ampm = h >= 12 ? "PM" : "AM";
    const displayHour = h % 12 || 12;
    return `${displayHour}${ampm}`;
  });
  
  return peakHours.join(" - ");
}

interface ProductivityInsights {
  weekly: {
    tasksCompleted: number;
    tasksCreated: number;
    timeTracked: number;
    activityCount: number;
  };
  monthly: {
    activityCount: number;
    timeTracked: number;
  };
  mostActiveDay: string;
  peakHours: string;
}

interface SearchResult {
  id: string;
  title: string;
  description: string | null;
  priority: string | null;
  dueDate: Date | null;
  column: string;
  board: string;
  labels: string[];
  checklistItems: number;
  checklistCompleted: number;
}

// Build context string for AI
function buildContextString(data: DashboardData, insights: ProductivityInsights | null, searchResults: SearchResult[]): string {
  let context = `
## Current Dashboard Status
- Total Boards: ${data.totalBoards}
- Total Tasks: ${data.totalTasks}
- Completed Tasks: ${data.completedTasks}
- Completion Rate: ${data.totalTasks > 0 ? Math.round((data.completedTasks / data.totalTasks) * 100) : 0}%
- Overdue Tasks: ${data.overdueTasks}
- Due This Week: ${data.dueSoonTasks}

## Tasks by Priority
${Object.entries(data.tasksByPriority)
  .filter(([, count]) => count > 0)
  .map(([priority, count]) => `- ${priority.toUpperCase()}: ${count}`)
  .join("\n")}

## Upcoming Deadlines
${data.upcomingDeadlines.length > 0 
  ? data.upcomingDeadlines.map(d => `- "${d.title}" (${d.boardName}) - Due: ${d.dueDate.toLocaleDateString()}`).join("\n")
  : "No upcoming deadlines in the next week"}

## Recent Activity
${data.recentActivity.slice(0, 5).map(a => `- ${a.action}: "${a.entityTitle}"`).join("\n")}

## Time Tracking (Last 30 Days)
- Total Time Logged: ${Math.round(data.timeTracked / 3600)} hours
`;

  if (insights) {
    context += `
## Productivity Insights
- Tasks Completed This Week: ${insights.weekly.tasksCompleted}
- Tasks Created This Week: ${insights.weekly.tasksCreated}
- Weekly Time Tracked: ${Math.round(insights.weekly.timeTracked / 3600)} hours
- Most Active Day: ${insights.mostActiveDay}
- Peak Hours: ${insights.peakHours}
`;
  }

  if (searchResults && searchResults.length > 0) {
    context += `
## Relevant Tasks Found
${searchResults.map(t => `- "${t.title}" (${t.board} / ${t.column}) - Priority: ${t.priority || "None"}`).join("\n")}
`;
  }

  return context;
}

// Main chat function
export async function sendChatMessage(
  message: string,
  personaId: PersonaId,
  conversationHistory: ChatMessage[],
  fetchDashboardData: boolean = false
): Promise<{ response: string; contextUsed: string[] }> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }

  const persona = getPersonaById(personaId);
  if (!persona) {
    throw new Error("Invalid persona");
  }

  // Determine what context to fetch based on message content
  const contextUsed: string[] = [];
  let contextString = "";
  
  const lowerMessage = message.toLowerCase();
  
  // Auto-detect when to fetch data
  const needsDashboard = fetchDashboardData || 
    lowerMessage.includes("dashboard") ||
    lowerMessage.includes("overview") ||
    lowerMessage.includes("status") ||
    lowerMessage.includes("how many") ||
    lowerMessage.includes("statistics") ||
    lowerMessage.includes("stats") ||
    lowerMessage.includes("progress") ||
    lowerMessage.includes("summary") ||
    lowerMessage.includes("productivity") ||
    lowerMessage.includes("overdue") ||
    lowerMessage.includes("deadline") ||
    lowerMessage.includes("upcoming") ||
    lowerMessage.includes("due");

  const needsSearch = 
    lowerMessage.includes("find") ||
    lowerMessage.includes("search") ||
    lowerMessage.includes("task") ||
    lowerMessage.includes("card") ||
    lowerMessage.includes("project");

  // Fetch relevant data
  if (needsDashboard) {
    const dashboardData = await getDashboardDataForAI();
    const insights = await getProductivityInsights();
    if (dashboardData) {
      contextString += buildContextString(dashboardData, insights, []);
      contextUsed.push("dashboard", "productivity");
    }
  }

  // Search for specific tasks if needed
  if (needsSearch) {
    // Extract potential search terms
    const searchTerms = message
      .replace(/find|search|show|get|what|where|task|card|project/gi, "")
      .trim();
    
    if (searchTerms.length > 2) {
      const searchResults = await searchTasksForAI(searchTerms);
      if (searchResults.length > 0) {
        contextString += `\n## Search Results for "${searchTerms}"\n`;
        contextString += searchResults.map(t => 
          `- **${t.title}** (${t.board} / ${t.column})\n  Priority: ${t.priority || "None"}, Labels: ${t.labels.join(", ") || "None"}\n  Checklist: ${t.checklistCompleted}/${t.checklistItems} completed`
        ).join("\n");
        contextUsed.push("search");
      }
    }
  }

  // Build the full prompt
  const systemPrompt = `${persona.systemPrompt}

${contextString ? `\n## CURRENT USER DATA (TaskFlow App)\n${contextString}` : ""}

## Important Instructions
- Always be helpful and friendly
- Use the provided data context to answer questions accurately
- If you don't have specific data, say so honestly
- Keep responses concise but informative
- Use markdown formatting for better readability
- When discussing tasks or deadlines, be specific
- Suggest actionable next steps when appropriate
- Remember the user's name is ${session.user.name || "there"}
`;

  // Build conversation for API
  const messages = [
    { role: "system" as const, content: systemPrompt },
    ...conversationHistory.slice(-10).map(m => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user" as const, content: message },
  ];

  // Call AI
  const apiKey = process.env.GOOGLE_AI_API_KEY || process.env.GROQ_API_KEY;
  const provider = process.env.AI_PROVIDER || "mock";

  console.log(`🤖 [AI Chat] Provider: ${provider} | API Key: ${apiKey ? "✓ SET" : "✗ MISSING"} | Persona: ${personaId}`);
  console.log(`🤖 [AI Chat] Context used: ${contextUsed.join(", ") || "none"} | Message length: ${message.length} chars`);

  try {
    if (provider === "gemini" && apiKey) {
      console.log("🤖 [AI Chat] Calling Gemini API...");
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      
      // Build chat history format for Gemini
      const chatHistory = messages.slice(0, -1).map(m => ({
        role: m.role === "assistant" ? "model" : m.role === "system" ? "user" : "user",
        parts: [{ text: m.content }],
      }));

      const chat = model.startChat({
        history: chatHistory,
      });

      const result = await chat.sendMessage(message);
      const response = result.response.text();
      
      console.log(`✅ [AI Chat] Gemini responded successfully: ${response.length} chars`);
      return { response, contextUsed };
    } else if (provider === "groq" && apiKey) {
      console.log("🤖 [AI Chat] Calling Groq API...");
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: messages,
          max_tokens: 1500,
          temperature: persona.temperature || 0.7,
        }),
      });

      const data = await response.json();
      const aiResponse = data.choices[0]?.message?.content || "I apologize, I couldn't generate a response.";
      
      console.log(`✅ [AI Chat] Groq responded successfully: ${aiResponse.length} chars`);
      return { response: aiResponse, contextUsed };
    } else {
      // Mock response for development
      console.log("⚠️ [AI Chat] No API configured, using MOCK response");
      return {
        response: getMockResponse(message, persona.name, contextString),
        contextUsed,
      };
    }
  } catch (error) {
    console.error("❌ [AI Chat] API call FAILED:", error);
    return {
      response: `I apologize, I encountered an error processing your request. Please try again. ${error instanceof Error ? error.message : ""}`,
      contextUsed,
    };
  }
}

// Mock responses for development without API
function getMockResponse(message: string, personaName: string, context: string): string {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes("hello") || lowerMessage.includes("hi")) {
    return `Hello! I'm your ${personaName}. How can I help you with TaskFlow today?`;
  }
  
  if (lowerMessage.includes("status") || lowerMessage.includes("overview")) {
    if (context) {
      return `Based on your dashboard data:\n\n${context.split("##")[1] || "I can see your task data. What would you like to know specifically?"}`;
    }
    return "I'd be happy to give you an overview! Use the 'Fetch Dashboard Data' button to load your current stats, and I'll analyze them for you.";
  }
  
  if (lowerMessage.includes("help")) {
    return `I can help you with:\n\n- **Dashboard Overview**: Ask about your task status, deadlines, and progress\n- **Find Tasks**: Search for specific tasks or projects\n- **Productivity Insights**: Learn about your work patterns\n- **Task Management Tips**: Get suggestions for better organization\n\nJust ask naturally, and I'll do my best to help!`;
  }
  
  return `I understand you're asking about "${message}". To give you accurate information, make sure to fetch the dashboard data using the button above. Then I can provide specific insights about your tasks and projects!`;
}

// Save chat message to database
export async function saveChatMessage(
  conversationId: string,
  role: "user" | "assistant",
  content: string,
  personaId?: string
) {
  const session = await auth();
  if (!session?.user?.id) return;

  const id = crypto.randomUUID();
  
  await db.insert(chatMessages).values({
    id,
    conversationId,
    userId: session.user.id,
    role,
    content,
    personaId: personaId || null,
  });

  return id;
}

// Get chat history
export async function getChatHistory(conversationId: string): Promise<ChatMessage[]> {
  const session = await auth();
  if (!session?.user?.id) return [];

  const messages = await db.query.chatMessages.findMany({
    where: and(
      eq(chatMessages.conversationId, conversationId),
      eq(chatMessages.userId, session.user.id)
    ),
    orderBy: [asc(chatMessages.createdAt)],
  });

  return messages.map(m => ({
    id: m.id,
    role: m.role as "user" | "assistant",
    content: m.content,
    persona: m.personaId as PersonaId | undefined,
    timestamp: m.createdAt!,
  }));
}

// Clear chat history
export async function clearChatHistory(conversationId: string) {
  const session = await auth();
  if (!session?.user?.id) return;

  await db.delete(chatMessages).where(
    and(
      eq(chatMessages.conversationId, conversationId),
      eq(chatMessages.userId, session.user.id)
    )
  );
}
