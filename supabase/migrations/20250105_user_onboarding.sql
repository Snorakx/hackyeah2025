-- Create user_onboarding table
CREATE TABLE IF NOT EXISTS user_onboarding (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  units TEXT NOT NULL CHECK (units IN ('metric', 'imperial')),
  weighing_frequency TEXT NOT NULL CHECK (weighing_frequency IN ('weekly', 'daily', '2-3x')),
  weighing_day_of_week INTEGER CHECK (weighing_day_of_week >= 0 AND weighing_day_of_week <= 6),
  meals_per_day INTEGER CHECK (meals_per_day >= 2 AND meals_per_day <= 5),
  diet_preferences TEXT[],
  allergies TEXT[],
  goal TEXT CHECK (goal IN ('weight_loss', 'maintenance', 'muscle_gain')),
  goal_intensity TEXT CHECK (goal_intensity IN ('conservative', 'moderate', 'aggressive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Add RLS policies
ALTER TABLE user_onboarding ENABLE ROW LEVEL SECURITY;

-- Permissive policies for dev environment (replace with auth.uid() in Supabase)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_onboarding' AND policyname = 'Allow select for owner (dev)'
  ) THEN
    CREATE POLICY "Allow select for owner (dev)" ON user_onboarding
      FOR SELECT USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_onboarding' AND policyname = 'Allow insert for owner (dev)'
  ) THEN
    CREATE POLICY "Allow insert for owner (dev)" ON user_onboarding
      FOR INSERT WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_onboarding' AND policyname = 'Allow update for owner (dev)'
  ) THEN
    CREATE POLICY "Allow update for owner (dev)" ON user_onboarding
      FOR UPDATE USING (true);
  END IF;
END $$;

-- Add onboarding_completed column to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_onboarding_user_id ON user_onboarding(user_id);
