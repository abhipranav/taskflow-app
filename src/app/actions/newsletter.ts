"use server";

import { db } from "@/db";
import { subscribers } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function subscribeToNewsletter(email: string, source: string = "website") {
  if (!email || !email.includes("@")) {
    return { success: false, error: "Please enter a valid email address" };
  }

  try {
    // Check if already subscribed
    const existing = await db.query.subscribers.findFirst({
      where: eq(subscribers.email, email.toLowerCase()),
    });

    if (existing) {
      if (existing.status === "unsubscribed") {
        // Resubscribe
        await db.update(subscribers)
          .set({ status: "active", unsubscribedAt: null, source })
          .where(eq(subscribers.id, existing.id));
        return { success: true, message: "Welcome back! You've been resubscribed." };
      }
      return { success: false, error: "This email is already subscribed" };
    }

    // Create new subscriber
    await db.insert(subscribers).values({
      id: crypto.randomUUID(),
      email: email.toLowerCase(),
      source,
    });

    return { success: true, message: "Thanks for subscribing! 🎉" };
  } catch (error) {
    console.error("Newsletter subscription error:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

export async function unsubscribeFromNewsletter(email: string) {
  try {
    const subscriber = await db.query.subscribers.findFirst({
      where: eq(subscribers.email, email.toLowerCase()),
    });

    if (!subscriber) {
      return { success: false, error: "Email not found" };
    }

    await db.update(subscribers)
      .set({ status: "unsubscribed", unsubscribedAt: new Date() })
      .where(eq(subscribers.id, subscriber.id));

    return { success: true, message: "You've been unsubscribed successfully" };
  } catch (error) {
    console.error("Newsletter unsubscribe error:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

export async function getSubscriberCount() {
  const allSubscribers = await db.query.subscribers.findMany({
    where: eq(subscribers.status, "active"),
  });
  return allSubscribers.length;
}
