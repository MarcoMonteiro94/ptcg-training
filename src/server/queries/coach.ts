import { db } from "@/server/db";
import { coachConversations, coachMessages } from "@/server/db/schema";
import { eq, desc, and } from "drizzle-orm";

export async function getUserConversations(userId: string, limit = 20) {
  return db
    .select({
      id: coachConversations.id,
      title: coachConversations.title,
      createdAt: coachConversations.createdAt,
      updatedAt: coachConversations.updatedAt,
    })
    .from(coachConversations)
    .where(eq(coachConversations.userId, userId))
    .orderBy(desc(coachConversations.updatedAt))
    .limit(limit);
}

export async function getConversationMessages(conversationId: string, userId: string) {
  // Verify ownership
  const [conv] = await db
    .select({ id: coachConversations.id })
    .from(coachConversations)
    .where(
      and(
        eq(coachConversations.id, conversationId),
        eq(coachConversations.userId, userId)
      )
    )
    .limit(1);

  if (!conv) return null;

  return db
    .select({
      id: coachMessages.id,
      role: coachMessages.role,
      content: coachMessages.content,
      createdAt: coachMessages.createdAt,
    })
    .from(coachMessages)
    .where(eq(coachMessages.conversationId, conversationId))
    .orderBy(coachMessages.createdAt);
}
