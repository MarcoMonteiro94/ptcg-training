CREATE TABLE IF NOT EXISTS user_tournaments (
  id text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  "name" text NOT NULL,
  "date" date NOT NULL,
  format text NOT NULL DEFAULT 'standard',
  user_archetype_id text REFERENCES archetypes(id),
  total_rounds integer,
  "placing" integer,
  player_count integer,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS user_tournaments_user_idx ON user_tournaments(user_id);
CREATE INDEX IF NOT EXISTS user_tournaments_date_idx ON user_tournaments("date");

ALTER TABLE match_logs ADD COLUMN IF NOT EXISTS user_tournament_id text REFERENCES user_tournaments(id) ON DELETE SET NULL;
ALTER TABLE match_logs ADD COLUMN IF NOT EXISTS round_number integer;

CREATE INDEX IF NOT EXISTS match_logs_tournament_idx ON match_logs(user_tournament_id);

ALTER TABLE user_tournaments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tournaments"
  ON user_tournaments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tournaments"
  ON user_tournaments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tournaments"
  ON user_tournaments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tournaments"
  ON user_tournaments FOR DELETE
  USING (auth.uid() = user_id);
