-- Training Plans table
CREATE TABLE IF NOT EXISTS "training_plans" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" uuid NOT NULL,
  "archetype_id" text,
  "week_start" date NOT NULL,
  "week_end" date NOT NULL,
  "plan" jsonb NOT NULL,
  "status" text DEFAULT 'active' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Daily Goals table
CREATE TABLE IF NOT EXISTS "daily_goals" (
  "id" text PRIMARY KEY NOT NULL,
  "training_plan_id" text NOT NULL,
  "user_id" uuid NOT NULL,
  "date" date NOT NULL,
  "goals" jsonb NOT NULL,
  "completed_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Foreign keys
ALTER TABLE "training_plans" ADD CONSTRAINT "training_plans_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "training_plans" ADD CONSTRAINT "training_plans_archetype_id_archetypes_id_fk" FOREIGN KEY ("archetype_id") REFERENCES "public"."archetypes"("id") ON DELETE no action ON UPDATE no action;

ALTER TABLE "daily_goals" ADD CONSTRAINT "daily_goals_training_plan_id_training_plans_id_fk" FOREIGN KEY ("training_plan_id") REFERENCES "public"."training_plans"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "daily_goals" ADD CONSTRAINT "daily_goals_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;

-- Indexes
CREATE INDEX IF NOT EXISTS "training_plans_user_idx" ON "training_plans" USING btree ("user_id");
CREATE INDEX IF NOT EXISTS "training_plans_status_idx" ON "training_plans" USING btree ("status");

CREATE INDEX IF NOT EXISTS "daily_goals_user_idx" ON "daily_goals" USING btree ("user_id");
CREATE INDEX IF NOT EXISTS "daily_goals_plan_idx" ON "daily_goals" USING btree ("training_plan_id");
CREATE INDEX IF NOT EXISTS "daily_goals_date_idx" ON "daily_goals" USING btree ("date");

-- Enable RLS
ALTER TABLE "training_plans" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "daily_goals" ENABLE ROW LEVEL SECURITY;

-- RLS Policies: users can only access their own data
CREATE POLICY "Users can manage own training plans" ON "training_plans"
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own daily goals" ON "daily_goals"
  FOR ALL USING (auth.uid() = user_id);
