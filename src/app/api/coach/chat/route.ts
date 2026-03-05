import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { coachRateLimit } from "@/lib/rate-limiter";
import { buildCoachContext } from "@/server/services/coach/context-builder";
import { db } from "@/server/db";
import { coachMessages, coachConversations } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

const anthropic = new Anthropic();

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  // Rate limiting
  const { success } = await coachRateLimit.limit(user.id);
  if (!success) {
    return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again later." }), {
      status: 429,
    });
  }

  const body = await request.json();
  const { message, conversationId, mode, matchupArchetypeId } = body as {
    message: string;
    conversationId?: string;
    mode?: "general" | "study";
    matchupArchetypeId?: string;
  };

  if (!message || typeof message !== "string" || message.length > 2000) {
    return new Response(JSON.stringify({ error: "Invalid message" }), { status: 400 });
  }

  // Get or create conversation
  let convId = conversationId;
  if (!convId) {
    convId = randomUUID();
    await db.insert(coachConversations).values({
      id: convId,
      userId: user.id,
      title: message.slice(0, 100),
    });
  }

  // Save user message
  await db.insert(coachMessages).values({
    id: randomUUID(),
    conversationId: convId,
    role: "user",
    content: message,
  });

  // Build context
  let context: Awaited<ReturnType<typeof buildCoachContext>>;
  try {
    context = await buildCoachContext(user.id, { mode, matchupArchetypeId });
  } catch {
    context = {
      systemPrompt: "You are an expert Pokemon TCG competitive coach. Help the player improve.",
      recentMatches: [],
    };
  }

  // Get conversation history
  const history = await db
    .select()
    .from(coachMessages)
    .where(eq(coachMessages.conversationId, convId))
    .orderBy(coachMessages.createdAt)
    .limit(20);

  const messages: Array<{ role: "user" | "assistant"; content: string }> = history.map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  // Stream response
  const stream = anthropic.messages.stream({
    model: "claude-sonnet-4-20250514",

    max_tokens: 1024,
    system: context.systemPrompt,
    messages,
  });

  const encoder = new TextEncoder();
  let fullResponse = "";

  const readableStream = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            const text = event.delta.text;
            fullResponse += text;
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
          }
        }

        // Save assistant message
        await db.insert(coachMessages).values({
          id: randomUUID(),
          conversationId: convId!,
          role: "assistant",
          content: fullResponse,
        });

        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ done: true, conversationId: convId })}\n\n`
          )
        );
        controller.close();
      } catch {
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ error: "Stream error" })}\n\n`
          )
        );
        controller.close();
      }
    },
  });

  return new Response(readableStream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
