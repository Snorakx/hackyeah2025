-- Push Notifications System Migration
-- Created: 2025-01-28

-- Device tokens table for storing user device information
CREATE TABLE IF NOT EXISTS device_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    platform TEXT NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
    device_id TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    web_subscription JSONB, -- For web push subscriptions
    registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_used TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure one active token per device per user
    UNIQUE(user_id, device_id, platform)
);

-- Notification preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    meal_reminders BOOLEAN DEFAULT true,
    calorie_progress BOOLEAN DEFAULT true,
    motivational BOOLEAN DEFAULT true,
    quiet_hours_enabled BOOLEAN DEFAULT true,
    quiet_hours_start TIME DEFAULT '22:00',
    quiet_hours_end TIME DEFAULT '07:00',
    timezone TEXT DEFAULT 'Europe/Warsaw',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notification templates table
CREATE TABLE IF NOT EXISTS notification_templates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('meal_reminder', 'calorie_progress', 'daily_summary', 'motivation', 'goal_reminder', 'achievement')),
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    category TEXT,
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high')),
    variables TEXT[] DEFAULT '{}',
    conditions JSONB,
    schedule JSONB,
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Scheduled notifications table
CREATE TABLE IF NOT EXISTS scheduled_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    template_id TEXT NOT NULL REFERENCES notification_templates(id),
    scheduled_for TIMESTAMPTZ NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    data JSONB,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    sent_at TIMESTAMPTZ,
    error TEXT
);

-- Notification logs table for tracking sent notifications
CREATE TABLE IF NOT EXISTS notification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    device_token_id UUID REFERENCES device_tokens(id) ON DELETE SET NULL,
    template_id TEXT REFERENCES notification_templates(id),
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('sent', 'delivered', 'clicked', 'failed')),
    platform TEXT NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
    sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    delivered_at TIMESTAMPTZ,
    clicked_at TIMESTAMPTZ,
    error TEXT,
    data JSONB
);

-- User context table for notification personalization
CREATE TABLE IF NOT EXISTS user_notification_context (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    daily_calories_target INTEGER,
    daily_calories_consumed INTEGER DEFAULT 0,
    last_meal_time TIMESTAMPTZ,
    timezone TEXT DEFAULT 'Europe/Warsaw',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_device_tokens_user_active ON device_tokens(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_device_tokens_platform ON device_tokens(platform);
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_user_status ON scheduled_notifications(user_id, status);
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_scheduled_for ON scheduled_notifications(scheduled_for) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_notification_logs_user_sent_at ON notification_logs(user_id, sent_at);
CREATE INDEX IF NOT EXISTS idx_notification_logs_template_status ON notification_logs(template_id, status);

-- Insert default notification templates
INSERT INTO notification_templates (id, name, type, title, body, category, priority, variables, enabled) VALUES
('meal_reminder_breakfast', 'Breakfast Reminder', 'meal_reminder', 'Czas na śniadanie! 🌅', 'Dzień dobry {{user.displayName}}! Pamiętaj o zdrowym śniadaniu, żeby dobrze zacząć dzień.', 'meal', 'normal', ARRAY['user.displayName', 'user.name'], true),

('meal_reminder_lunch', 'Lunch Reminder', 'meal_reminder', 'Pora na lunch! 🍽️', '{{user.displayName}}, nie zapomnij o obiedzie! Masz jeszcze {{calories.remaining}} kcal do wykorzystania dzisiaj.', 'meal', 'normal', ARRAY['user.displayName', 'calories.remaining'], true),

('meal_reminder_dinner', 'Dinner Reminder', 'meal_reminder', 'Kolacja czeka! 🌙', 'Wieczór, {{user.displayName}}! Czas na kolację. Pozostało {{calories.remaining}} kcal na dzisiaj.', 'meal', 'normal', ARRAY['user.displayName', 'calories.remaining'], true),

('calorie_progress_midday', 'Midday Progress', 'calorie_progress', 'Podsumowanie połowy dnia 📊', '{{user.displayName}}, mija połowa dnia! Spożył{{gender.suffix}} {{calories.consumed}} z {{calories.target}} kcal ({{calories.percentage}}%). Zostało {{calories.remaining}} kcal.', 'progress', 'normal', ARRAY['user.displayName', 'gender.suffix', 'calories.consumed', 'calories.target', 'calories.percentage', 'calories.remaining'], true),

('calorie_progress_evening', 'Evening Progress', 'calorie_progress', 'Podsumowanie wieczorne 🌆', '{{user.displayName}}, jak minął dzień? Spożył{{gender.suffix}} {{calories.consumed}} z {{calories.target}} kcal. {{encouragement}}', 'progress', 'normal', ARRAY['user.displayName', 'gender.suffix', 'calories.consumed', 'calories.target', 'encouragement'], true),

('meal_forgotten_gentle', 'Gentle Meal Reminder', 'meal_reminder', 'Może czas na posiłek? 🤔', '{{user.displayName}}, zauważył{{gender.suffix_past}}, że od dłuższego czasu nie dodał{{gender.suffix}} posiłku. Wszystko w porządku?', 'reminder', 'low', ARRAY['user.displayName', 'gender.suffix', 'gender.suffix_past'], true),

('motivation_morning', 'Morning Motivation', 'motivation', 'Motywacja na dzień! 💪', 'Dzień dobry {{user.displayName}}! Nowy dzień, nowe możliwości. Ty potrafisz!', 'motivation', 'low', ARRAY['user.displayName'], true),

('goal_achievement_daily', 'Daily Goal Achievement', 'achievement', 'Brawo! Cel osiągnięty! 🎉', '{{user.displayName}}, gratulacje! Osiągnął{{gender.suffix}} dzisiejszy cel kaloryczny!', 'motivation', 'high', ARRAY['user.displayName', 'gender.suffix'], true),

('app_return_welcome', 'Welcome Back', 'motivation', 'Witaj z powrotem! 👋', 'Miło Cię widzieć, {{user.displayName}}! Jak się masz?', 'motivation', 'low', ARRAY['user.displayName'], true),

('weekend_motivation', 'Weekend Motivation', 'motivation', 'Weekendowa motywacja! 🎯', '{{user.displayName}}, weekend to nie powód, żeby zapomnieć o celach! Ty dasz radę!', 'motivation', 'low', ARRAY['user.displayName'], true),

('hydration_reminder', 'Hydration Reminder', 'goal_reminder', 'Pamiętaj o wodzie! 💧', '{{user.displayName}}, pamiętaj o regularnym piciu wody. To ważne dla Twojego zdrowia!', 'reminder', 'low', ARRAY['user.displayName'], true),

('weekly_summary', 'Weekly Summary', 'daily_summary', 'Podsumowanie tygodnia 📈', '{{user.displayName}}, jak minął tydzień? Sprawdź swoje postępy i zaplanuj kolejny tydzień!', 'summary', 'normal', ARRAY['user.displayName'], true)

ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    title = EXCLUDED.title,
    body = EXCLUDED.body,
    variables = EXCLUDED.variables,
    updated_at = NOW();

-- RLS (Row Level Security) policies
ALTER TABLE device_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notification_context ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_notifications ENABLE ROW LEVEL SECURITY;

-- Policies for device_tokens
CREATE POLICY "Users can manage their own device tokens" 
ON device_tokens FOR ALL USING (auth.uid() = user_id);

-- Policies for notification_preferences
CREATE POLICY "Users can manage their own notification preferences" 
ON notification_preferences FOR ALL USING (auth.uid() = user_id);

-- Policies for notification_logs
CREATE POLICY "Users can view their own notification logs" 
ON notification_logs FOR SELECT USING (auth.uid() = user_id);

-- Policies for user_notification_context
CREATE POLICY "Users can manage their own notification context" 
ON user_notification_context FOR ALL USING (auth.uid() = user_id);

-- Policies for scheduled_notifications
CREATE POLICY "Users can view their own scheduled notifications" 
ON scheduled_notifications FOR SELECT USING (auth.uid() = user_id);

-- Functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at columns
CREATE TRIGGER update_device_tokens_updated_at 
    BEFORE UPDATE ON device_tokens 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_preferences_updated_at 
    BEFORE UPDATE ON notification_preferences 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_templates_updated_at 
    BEFORE UPDATE ON notification_templates 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_notification_context_updated_at 
    BEFORE UPDATE ON user_notification_context 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to clean up old notification logs (keep last 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_notification_logs()
RETURNS void AS $$
BEGIN
    DELETE FROM notification_logs 
    WHERE sent_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Function to clean up old scheduled notifications (keep last 7 days)
CREATE OR REPLACE FUNCTION cleanup_old_scheduled_notifications()
RETURNS void AS $$
BEGIN
    DELETE FROM scheduled_notifications 
    WHERE created_at < NOW() - INTERVAL '7 days' 
    AND status IN ('sent', 'failed', 'cancelled');
END;
$$ LANGUAGE plpgsql;