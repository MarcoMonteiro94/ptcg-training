import { createClient } from "@/lib/supabase/server";
import { getUserConversations, getConversationMessages } from "@/server/queries/coach";

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const conversationId = searchParams.get("id");

  if (conversationId) {
    const messages = await getConversationMessages(conversationId, user.id);
    if (!messages) {
      return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
    }
    return Response.json({ messages });
  }

  const conversations = await getUserConversations(user.id);
  return Response.json({ conversations });
}
