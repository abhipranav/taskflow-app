"use server";

import { db } from "@/db";
import { attachments, cards } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { logActivity } from "./activity";

export async function addAttachment(
  cardId: string, 
  url: string, 
  name: string, 
  size: number, 
  type: string
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const id = crypto.randomUUID();
  await db.insert(attachments).values({
    id,
    cardId,
    url,
    name,
    size,
    type,
    createdAt: new Date(),
  });

  await logAttachmentActivity(cardId, session.user.id, "attached", name);

  revalidatePath("/");
  return id;
}

async function logAttachmentActivity(cardId: string, userId: string, action: string, filename: string) {
  try {
    const card = await db.query.cards.findFirst({
      where: eq(cards.id, cardId),
      with: { column: true }
    });

    if (card && card.column) {
      await logActivity(
        card.column.boardId,
        userId,
        "updated",
        "card",
        card.title,
        `${action} file ${filename}`,
        cardId
      );
    }
  } catch (error) {
    console.error("Failed to log attachment activity", error);
  }
}

export async function removeAttachment(attachmentId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const attachment = await db.query.attachments.findFirst({
    where: eq(attachments.id, attachmentId),
  });

  if (!attachment) return;

  await db.delete(attachments).where(eq(attachments.id, attachmentId));
  
  await logAttachmentActivity(attachment.cardId, session.user.id, "removed", attachment.name);

  revalidatePath("/");
}

export async function getAttachments(cardId: string) {
  return await db.query.attachments.findMany({
    where: eq(attachments.cardId, cardId),
    orderBy: [desc(attachments.createdAt)],
  });
}
