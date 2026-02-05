import { GoogleGenerativeAI } from "@google/generative-ai";

// AI Provider types
export type AIProvider = "gemini" | "groq" | "ollama" | "mock";

interface AIConfig {
  provider: AIProvider;
  apiKey?: string;
  baseUrl?: string;
  model?: string;
}

// Get AI configuration from environment
function getAIConfig(): AIConfig {
  const provider = (process.env.AI_PROVIDER || "mock") as AIProvider;
  
  return {
    provider,
    apiKey: process.env.GOOGLE_AI_API_KEY || process.env.GROQ_API_KEY,
    baseUrl: process.env.OLLAMA_BASE_URL || "http://localhost:11434",
    model: process.env.OLLAMA_MODEL || "llama3.2",
  };
}

// Generate subtasks from a task description
export async function generateSubtasks(
  taskTitle: string,
  taskDescription?: string
): Promise<string[]> {
  const config = getAIConfig();
  
  const prompt = `Given this task, generate 3-5 actionable subtasks. Return ONLY a JSON array of strings, no explanation.

Task: ${taskTitle}
${taskDescription ? `Description: ${taskDescription}` : ""}

Example output: ["Subtask 1", "Subtask 2", "Subtask 3"]`;

  try {
    if (config.provider === "gemini" && config.apiKey) {
      console.log("🤖 [AI] Calling Gemini API for subtasks...");
      const result = await generateWithGemini(config.apiKey, prompt);
      console.log("✅ [AI] Gemini responded successfully:", result.length, "subtasks");
      return result;
    } else if (config.provider === "groq" && config.apiKey) {
      console.log("🤖 [AI] Calling Groq API for subtasks...");
      const result = await generateWithGroq(config.apiKey, prompt);
      console.log("✅ [AI] Groq responded successfully:", result.length, "subtasks");
      return result;
    } else {
      console.log("⚠️ [AI] No API configured, using RULE-BASED fallback");
      return generateRuleBasedSubtasks(taskTitle, taskDescription);
    }
  } catch (error) {
    console.error("❌ [AI] API call FAILED, using RULE-BASED fallback:", error);
    return generateRuleBasedSubtasks(taskTitle, taskDescription);
  }
}

// Summarize a task
export async function summarizeTask(
  taskTitle: string,
  taskDescription?: string,
  subtasks?: string[]
): Promise<string> {
  const config = getAIConfig();
  
  const prompt = `Summarize this task in one concise sentence (max 100 chars):

Task: ${taskTitle}
${taskDescription ? `Description: ${taskDescription}` : ""}
${subtasks?.length ? `Subtasks: ${subtasks.join(", ")}` : ""}

Return ONLY the summary text, nothing else.`;

  try {
    if (config.provider === "gemini" && config.apiKey) {
      console.log("🤖 [AI] Calling Gemini API for summary...");
      const result = await generateWithGemini(config.apiKey, prompt);
      const summary = Array.isArray(result) ? result[0] : String(result);
      console.log("✅ [AI] Gemini summary received:", summary.slice(0, 50) + "...");
      return summary;
    } else if (config.provider === "groq" && config.apiKey) {
      console.log("🤖 [AI] Calling Groq API for summary...");
      const result = await generateWithGroq(config.apiKey, prompt);
      const summary = Array.isArray(result) ? result[0] : String(result);
      console.log("✅ [AI] Groq summary received:", summary.slice(0, 50) + "...");
      return summary;
    } else {
      console.log("⚠️ [AI] No API configured, using RULE-BASED summary fallback");
      return generateRuleBasedSummary(taskTitle, taskDescription);
    }
  } catch (error) {
    console.error("❌ [AI] Summary API call FAILED, using RULE-BASED fallback:", error);
    return generateRuleBasedSummary(taskTitle, taskDescription);
  }
}

// Gemini provider
async function generateWithGemini(apiKey: string, prompt: string): Promise<string[]> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  
  const result = await model.generateContent(prompt);
  const response = result.response.text();
  
  // Parse JSON array from response
  const match = response.match(/\[[\s\S]*\]/);
  if (match) {
    return JSON.parse(match[0]);
  }
  
  // If not JSON, split by newlines
  return response.split("\n").filter(line => line.trim()).slice(0, 5);
}

// Groq provider
async function generateWithGroq(apiKey: string, prompt: string): Promise<string[]> {
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 500,
    }),
  });
  
  const data = await response.json();
  const content = data.choices[0]?.message?.content || "[]";
  
  const match = content.match(/\[[\s\S]*\]/);
  if (match) {
    return JSON.parse(match[0]);
  }
  
  return content.split("\n").filter((line: string) => line.trim()).slice(0, 5);
}

// Rule-based fallback for subtasks
function generateRuleBasedSubtasks(title: string, description?: string): string[] {
  const text = `${title} ${description || ""}`.toLowerCase();
  const subtasks: string[] = [];
  
  // Common development patterns
  if (text.includes("implement") || text.includes("build") || text.includes("create")) {
    subtasks.push("Research existing solutions and best practices");
    subtasks.push("Design the implementation approach");
    subtasks.push("Write the core implementation");
    subtasks.push("Add tests");
    subtasks.push("Update documentation");
  } else if (text.includes("fix") || text.includes("bug") || text.includes("debug")) {
    subtasks.push("Reproduce the issue");
    subtasks.push("Identify root cause");
    subtasks.push("Implement the fix");
    subtasks.push("Test the fix");
  } else if (text.includes("design") || text.includes("ui") || text.includes("ux")) {
    subtasks.push("Gather requirements");
    subtasks.push("Create wireframes");
    subtasks.push("Design mockups");
    subtasks.push("Get feedback and iterate");
  } else if (text.includes("test") || text.includes("testing")) {
    subtasks.push("Write unit tests");
    subtasks.push("Write integration tests");
    subtasks.push("Run test suite");
    subtasks.push("Fix failing tests");
  } else {
    // Generic subtasks
    subtasks.push("Research and gather information");
    subtasks.push("Plan the approach");
    subtasks.push("Execute the main task");
    subtasks.push("Review and verify");
  }
  
  return subtasks;
}

// Rule-based fallback for summary
function generateRuleBasedSummary(title: string, description?: string): string {
  if (description && description.length > 10) {
    // Truncate description to make a summary
    return description.slice(0, 80) + (description.length > 80 ? "..." : "");
  }
  return `Task: ${title.slice(0, 80)}`;
}

// Generic text generation (for standup reports, etc.)
export async function generateText(prompt: string): Promise<string | null> {
  const config = getAIConfig();
  console.log(`🤖 [AI] generateText called | Provider: ${config.provider} | API Key: ${config.apiKey ? "✓ SET" : "✗ MISSING"}`);
  
  try {
    if (config.provider === "gemini" && config.apiKey) {
      console.log("🤖 [AI] Calling Gemini API for text generation...");
      const genAI = new GoogleGenerativeAI(config.apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      console.log("✅ [AI] Gemini text generated successfully:", text.length, "chars");
      return text;
    } else if (config.provider === "groq" && config.apiKey) {
      console.log("🤖 [AI] Calling Groq API for text generation...");
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${config.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 1000,
        }),
      });
      const data = await response.json();
      const text = data.choices[0]?.message?.content || null;
      console.log("✅ [AI] Groq text generated successfully:", text?.length || 0, "chars");
      return text;
    }
    console.log("⚠️ [AI] No API configured for text generation, returning null");
    return null;
  } catch (error) {
    console.error("❌ [AI] Text generation FAILED:", error);
    return null;
  }
}
