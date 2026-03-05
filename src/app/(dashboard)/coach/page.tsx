import { ChatInterface } from "@/components/coach/chat-interface";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getActiveArchetypes } from "@/server/queries/archetypes";

export default async function CoachPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  let archetypes: Array<{ id: string; name: string }> = [];
  try {
    const all = await getActiveArchetypes();
    archetypes = all.map((a) => ({ id: a.id, name: a.name }));
  } catch {
    // DB not connected
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-4">
        <h1 className="text-2xl font-bold">AI Coach</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Get personalized coaching based on your matches and the current meta
        </p>
      </div>
      <ChatInterface archetypes={archetypes} />
    </div>
  );
}
