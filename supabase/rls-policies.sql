-- ============================================================
-- Row Level Security Policies for Pokemon TCG Trainer
-- Run this in Supabase SQL Editor after creating tables
-- ============================================================

-- Enable RLS on user tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_decklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_messages ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Profiles
-- ============================================================
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================================
-- Match Logs
-- ============================================================
CREATE POLICY "Users can view own match logs"
  ON match_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own match logs"
  ON match_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own match logs"
  ON match_logs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own match logs"
  ON match_logs FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- User Decklists
-- ============================================================
CREATE POLICY "Users can view own decklists"
  ON user_decklists FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own decklists"
  ON user_decklists FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own decklists"
  ON user_decklists FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own decklists"
  ON user_decklists FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- Coach Conversations
-- ============================================================
CREATE POLICY "Users can view own conversations"
  ON coach_conversations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own conversations"
  ON coach_conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own conversations"
  ON coach_conversations FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- Coach Messages (via conversation ownership)
-- ============================================================
CREATE POLICY "Users can view own coach messages"
  ON coach_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM coach_conversations
      WHERE coach_conversations.id = coach_messages.conversation_id
        AND coach_conversations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own coach messages"
  ON coach_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM coach_conversations
      WHERE coach_conversations.id = coach_messages.conversation_id
        AND coach_conversations.user_id = auth.uid()
    )
  );

-- ============================================================
-- Public read access for game data (no RLS needed, but explicit)
-- ============================================================
-- archetypes, pokemon_sets, cards, tournaments, tournament_standings,
-- decklists, matchup_stats, meta_snapshots are PUBLIC READ.
-- Only the data pipeline (service_role) writes to these.

-- ============================================================
-- Auto-create profile on user signup
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop if exists to make this idempotent
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
