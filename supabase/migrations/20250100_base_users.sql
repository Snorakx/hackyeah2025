-- Base users table for Supabase local stack (if not already present)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'users'
  ) THEN
    CREATE TABLE public.users (
      id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
      email TEXT NOT NULL DEFAULT '',
      display_name TEXT,
      weight DECIMAL(5,2),
      height INTEGER,
      age INTEGER,
      gender TEXT CHECK (gender IN ('male', 'female', 'other')),
      target_weekly_loss DECIMAL(3,2) DEFAULT 0.5,
      activity_level TEXT DEFAULT 'moderate',
      weekend_mode TEXT DEFAULT 'inactive',
      weekend_start_day INTEGER DEFAULT 5,
      weekend_end_day INTEGER DEFAULT 0,
      sleep_hours INTEGER DEFAULT 8,
      notification_preferences JSONB DEFAULT '{"daily_reminder": true, "weight_reminder": true, "meal_suggestions": true}',
      onboarding_completed BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "Users can view own profile" ON public.users
      FOR SELECT USING (auth.uid() = id);

    CREATE POLICY "Users can update own profile" ON public.users
      FOR UPDATE USING (auth.uid() = id);

    CREATE POLICY "Users can insert own profile" ON public.users
      FOR INSERT WITH CHECK (auth.uid() = id);
  END IF;
END $$;
