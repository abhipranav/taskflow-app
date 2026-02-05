"use server";

import { db } from "@/db";
import { users, userPreferences } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

// Get current user profile and preferences
export async function getUserSettings() {
  const session = await auth();
  if (!session?.user?.id) return null;
  
  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
    with: {
      preferences: true,
    },
  });
  
  return user;
}

// Get or create user preferences
export async function getUserPreferences() {
  const session = await auth();
  if (!session?.user?.id) return null;
  
  let prefs = await db.query.userPreferences.findFirst({
    where: eq(userPreferences.userId, session.user.id),
  });
  
  // Create default preferences if they don't exist
  if (!prefs) {
    await db.insert(userPreferences).values({
      userId: session.user.id,
      theme: "system",
      compactMode: false,
      aiProvider: "gemini",
    });
    
    prefs = await db.query.userPreferences.findFirst({
      where: eq(userPreferences.userId, session.user.id),
    });
  }
  
  return prefs;
}

// Update user preferences
export async function updateUserPreferences(data: {
  theme?: string;
  compactMode?: boolean;
  aiProvider?: string;
}) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  
  // Ensure preferences exist
  const existing = await db.query.userPreferences.findFirst({
    where: eq(userPreferences.userId, session.user.id),
  });
  
  if (!existing) {
    await db.insert(userPreferences).values({
      userId: session.user.id,
      theme: data.theme ?? "system",
      compactMode: data.compactMode ?? false,
      aiProvider: data.aiProvider ?? "gemini",
    });
  } else {
    await db
      .update(userPreferences)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(userPreferences.userId, session.user.id));
  }
  
  revalidatePath("/settings");
  return { success: true };
}

// Get AI provider status
export async function getAIProviderStatus() {
  const provider = process.env.AI_PROVIDER || "gemini";
  const hasGeminiKey = !!process.env.GOOGLE_AI_API_KEY;
  const hasGroqKey = !!process.env.GROQ_API_KEY;
  const ollamaUrl = process.env.OLLAMA_BASE_URL;
  
  return {
    currentProvider: provider,
    providers: {
      gemini: { configured: hasGeminiKey },
      groq: { configured: hasGroqKey },
      ollama: { configured: !!ollamaUrl, url: ollamaUrl },
    },
  };
}
