-- Create user_limits table to track daily usage
CREATE TABLE IF NOT EXISTS user_limits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  limit_type VARCHAR(50) NOT NULL, -- 'ai_analysis', 'api_calls', etc.
  usage_count INTEGER DEFAULT 0,
  reset_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, limit_type, reset_date)
);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_user_limits_user_type_date 
ON user_limits(user_id, limit_type, reset_date);

-- Enable RLS
ALTER TABLE user_limits ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own limits" ON user_limits
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own limits" ON user_limits
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can insert limits" ON user_limits
  FOR INSERT WITH CHECK (true);

-- Function to check and increment AI analysis limit
CREATE OR REPLACE FUNCTION check_ai_analysis_limit(
  p_user_id UUID,
  p_daily_limit INTEGER DEFAULT 10
) RETURNS BOOLEAN AS $$
DECLARE
  current_usage INTEGER;
  current_date DATE := CURRENT_DATE;
BEGIN
  -- Get current usage for today
  SELECT COALESCE(usage_count, 0) INTO current_usage
  FROM user_limits
  WHERE user_id = p_user_id 
    AND limit_type = 'ai_analysis' 
    AND reset_date = current_date;
  
  -- If no record exists, create one
  IF current_usage IS NULL THEN
    INSERT INTO user_limits (user_id, limit_type, usage_count, reset_date)
    VALUES (p_user_id, 'ai_analysis', 1, current_date);
    RETURN TRUE;
  END IF;
  
  -- Check if limit exceeded
  IF current_usage >= p_daily_limit THEN
    RETURN FALSE;
  END IF;
  
  -- Increment usage
  UPDATE user_limits 
  SET usage_count = usage_count + 1, updated_at = NOW()
  WHERE user_id = p_user_id 
    AND limit_type = 'ai_analysis' 
    AND reset_date = current_date;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get current usage
CREATE OR REPLACE FUNCTION get_ai_analysis_usage(p_user_id UUID)
RETURNS TABLE(usage_count INTEGER, daily_limit INTEGER) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(ul.usage_count, 0) as usage_count,
    10 as daily_limit
  FROM user_limits ul
  WHERE ul.user_id = p_user_id 
    AND ul.limit_type = 'ai_analysis' 
    AND ul.reset_date = CURRENT_DATE;
  
  -- If no record exists, return 0 usage
  IF NOT FOUND THEN
    RETURN QUERY SELECT 0 as usage_count, 10 as daily_limit;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
