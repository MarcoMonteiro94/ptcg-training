-- Add new columns to training_plans
ALTER TABLE "training_plans" ADD COLUMN IF NOT EXISTS "completion_summary" jsonb;
ALTER TABLE "training_plans" ADD COLUMN IF NOT EXISTS "focus_areas" jsonb;
ALTER TABLE "training_plans" ADD COLUMN IF NOT EXISTS "difficulty" text;

-- Training Streaks table
CREATE TABLE IF NOT EXISTS "training_streaks" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL UNIQUE,
  "current_streak" integer DEFAULT 0 NOT NULL,
  "longest_streak" integer DEFAULT 0 NOT NULL,
  "last_completed_date" date,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Foreign key
ALTER TABLE "training_streaks" ADD CONSTRAINT "training_streaks_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;

-- Index
CREATE INDEX IF NOT EXISTS "training_streaks_user_idx" ON "training_streaks" USING btree ("user_id");

-- Enable RLS
ALTER TABLE "training_streaks" ENABLE ROW LEVEL SECURITY;

-- RLS Policy
CREATE POLICY "Users can manage own training streaks" ON "training_streaks"
  FOR ALL USING (auth.uid() = user_id);
