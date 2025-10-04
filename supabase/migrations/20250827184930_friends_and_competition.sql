-- Create friends table for user connections
CREATE TABLE public.friends (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    friend_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, friend_id)
);

-- Create daily_goals table to track daily goal completion
CREATE TABLE public.daily_goals (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    calories_goal INTEGER NOT NULL,
    calories_actual INTEGER DEFAULT 0,
    protein_goal DECIMAL(5,2) NOT NULL,
    protein_actual DECIMAL(5,2) DEFAULT 0,
    goal_met BOOLEAN DEFAULT false,
    streak_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, date)
);

-- Create indexes
CREATE INDEX idx_friends_user_id ON public.friends(user_id);
CREATE INDEX idx_friends_friend_id ON public.friends(friend_id);
CREATE INDEX idx_friends_status ON public.friends(status);
CREATE INDEX idx_daily_goals_user_date ON public.daily_goals(user_id, date);
CREATE INDEX idx_daily_goals_goal_met ON public.daily_goals(goal_met);

-- Enable RLS
ALTER TABLE public.friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_goals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for friends
CREATE POLICY "Users can view own friends" ON public.friends
    FOR SELECT USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can insert own friend requests" ON public.friends
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own friend requests" ON public.friends
    FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can delete own friend connections" ON public.friends
    FOR DELETE USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- RLS Policies for daily_goals
CREATE POLICY "Users can view own daily goals" ON public.daily_goals
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own daily goals" ON public.daily_goals
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own daily goals" ON public.daily_goals
    FOR UPDATE USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE OR REPLACE TRIGGER update_friends_updated_at BEFORE UPDATE ON public.friends
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_daily_goals_updated_at BEFORE UPDATE ON public.daily_goals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to send friend request
CREATE OR REPLACE FUNCTION send_friend_request(
    p_friend_email TEXT
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    current_user_id UUID;
    friend_user_id UUID;
    new_friend_id UUID;
BEGIN
    -- Get current user ID
    current_user_id := auth.uid();
    
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'User not authenticated';
    END IF;
    
    -- Ensure current user exists in users table
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = current_user_id) THEN
        RAISE EXCEPTION 'Current user not found in users table';
    END IF;
    
    -- Find friend by email
    SELECT id INTO friend_user_id FROM public.users WHERE email = p_friend_email;
    
    IF friend_user_id IS NULL THEN
        RAISE EXCEPTION 'User with this email not found';
    END IF;
    
    IF friend_user_id = current_user_id THEN
        RAISE EXCEPTION 'Cannot send friend request to yourself';
    END IF;
    
    -- Check if friendship already exists
    IF EXISTS (
        SELECT 1 FROM public.friends 
        WHERE (user_id = current_user_id AND friend_id = friend_user_id)
           OR (user_id = friend_user_id AND friend_id = current_user_id)
    ) THEN
        RAISE EXCEPTION 'Friendship already exists or request already sent';
    END IF;
    
    -- Create friend request
    INSERT INTO public.friends (user_id, friend_id, status)
    VALUES (current_user_id, friend_user_id, 'pending')
    RETURNING id INTO new_friend_id;
    
    RETURN new_friend_id;
END;
$$;

-- Function to accept friend request
CREATE OR REPLACE FUNCTION accept_friend_request(
    p_friend_id UUID
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    current_user_id UUID;
BEGIN
    current_user_id := auth.uid();
    
    -- Update friend request to accepted
    UPDATE public.friends 
    SET status = 'accepted', updated_at = NOW()
    WHERE friend_id = current_user_id 
      AND user_id = p_friend_id 
      AND status = 'pending';
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'No pending friend request found';
    END IF;
END;
$$;

-- Function to get user's friends
CREATE OR REPLACE FUNCTION get_friends(
    p_user_id UUID DEFAULT NULL
) RETURNS TABLE(
    friend_id UUID,
    friend_email TEXT,
    friend_display_name TEXT,
    status VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    IF p_user_id IS NULL THEN
        p_user_id := auth.uid();
    END IF;
    
    RETURN QUERY
    SELECT 
        CASE 
            WHEN f.user_id = p_user_id THEN f.friend_id
            ELSE f.user_id
        END as friend_id,
        u.email as friend_email,
        u.display_name as friend_display_name,
        f.status,
        f.created_at
    FROM public.friends f
    JOIN public.users u ON (
        CASE 
            WHEN f.user_id = p_user_id THEN f.friend_id
            ELSE f.user_id
        END = u.id
    )
    WHERE (f.user_id = p_user_id OR f.friend_id = p_user_id)
      AND f.status = 'accepted'
    ORDER BY f.created_at DESC;
END;
$$;

-- Function to get pending friend requests
CREATE OR REPLACE FUNCTION get_pending_friend_requests() 
RETURNS TABLE(
    requester_id UUID,
    requester_email TEXT,
    requester_display_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    SELECT 
        f.user_id as requester_id,
        u.email as requester_email,
        u.display_name as requester_display_name,
        f.created_at
    FROM public.friends f
    JOIN public.users u ON f.user_id = u.id
    WHERE f.friend_id = auth.uid() 
      AND f.status = 'pending'
    ORDER BY f.created_at DESC;
END;
$$;

-- Function to update daily goal completion
CREATE OR REPLACE FUNCTION update_daily_goal(
    p_date DATE DEFAULT CURRENT_DATE
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    current_user_id UUID;
    user_record RECORD;
    daily_calories INTEGER;
    daily_protein DECIMAL(5,2);
    calories_goal INTEGER;
    protein_goal DECIMAL(5,2);
    goal_met BOOLEAN;
    previous_streak INTEGER;
BEGIN
    current_user_id := auth.uid();
    
    -- Get user's daily targets
    SELECT * INTO user_record FROM calculate_daily_calorie_target(current_user_id);
    
    -- Get daily totals from meals
    SELECT 
        COALESCE(SUM(calories), 0) INTO daily_calories
    FROM daily_meals 
    WHERE user_id = current_user_id AND meal_date = p_date;
    
    SELECT 
        COALESCE(SUM(protein), 0) INTO daily_protein
    FROM daily_meals 
    WHERE user_id = current_user_id AND meal_date = p_date;
    
    -- Set goals (within 10% of target)
    calories_goal := user_record.target_calories;
    protein_goal := user_record.target_protein;
    
    -- Check if goal met (within 10% tolerance)
    goal_met := (
        daily_calories >= calories_goal * 0.9 AND 
        daily_calories <= calories_goal * 1.1 AND
        daily_protein >= protein_goal * 0.8
    );
    
    -- Get previous streak
    SELECT COALESCE(streak_count, 0) INTO previous_streak
    FROM daily_goals 
    WHERE user_id = current_user_id 
      AND date = p_date - INTERVAL '1 day';
    
    -- Insert or update daily goal
    INSERT INTO daily_goals (
        user_id, date, calories_goal, calories_actual, 
        protein_goal, protein_actual, goal_met, streak_count
    ) VALUES (
        current_user_id, p_date, calories_goal, daily_calories,
        protein_goal, daily_protein, goal_met,
        CASE 
            WHEN goal_met THEN previous_streak + 1
            ELSE 0
        END
    )
    ON CONFLICT (user_id, date) DO UPDATE SET
        calories_actual = EXCLUDED.calories_actual,
        protein_actual = EXCLUDED.protein_actual,
        goal_met = EXCLUDED.goal_met,
        streak_count = EXCLUDED.streak_count,
        updated_at = NOW();
END;
$$;

-- Function to get friends' progress
CREATE OR REPLACE FUNCTION get_friends_progress(
    p_date DATE DEFAULT CURRENT_DATE
) RETURNS TABLE(
    friend_id UUID,
    friend_email TEXT,
    friend_display_name TEXT,
    goal_met BOOLEAN,
    streak_count INTEGER,
    calories_actual INTEGER,
    calories_goal INTEGER
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    SELECT 
        f.friend_id,
        u.email as friend_email,
        u.display_name as friend_display_name,
        COALESCE(dg.goal_met, false) as goal_met,
        COALESCE(dg.streak_count, 0) as streak_count,
        COALESCE(dg.calories_actual, 0) as calories_actual,
        COALESCE(dg.calories_goal, 0) as calories_goal
    FROM get_friends() f
    JOIN public.users u ON f.friend_id = u.id
    LEFT JOIN public.daily_goals dg ON f.friend_id = dg.user_id AND dg.date = p_date
    ORDER BY dg.streak_count DESC NULLS LAST, f.created_at DESC;
END;
$$;

-- Function to get leaderboard
CREATE OR REPLACE FUNCTION get_leaderboard(
    p_days INTEGER DEFAULT 7
) RETURNS TABLE(
    user_id UUID,
    user_email TEXT,
    user_display_name TEXT,
    total_goals_met INTEGER,
    current_streak INTEGER,
    avg_calories INTEGER
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id as user_id,
        u.email as user_email,
        u.display_name as user_display_name,
        COUNT(CASE WHEN dg.goal_met THEN 1 END) as total_goals_met,
        COALESCE(MAX(dg.streak_count), 0) as current_streak,
        COALESCE(AVG(dg.calories_actual), 0)::INTEGER as avg_calories
    FROM public.users u
    LEFT JOIN public.daily_goals dg ON u.id = dg.user_id 
        AND dg.date >= CURRENT_DATE - (p_days - 1) * INTERVAL '1 day'
    WHERE u.id IN (
        SELECT friend_id FROM get_friends()
        UNION
        SELECT auth.uid()
    )
    GROUP BY u.id, u.email, u.display_name
    ORDER BY total_goals_met DESC, current_streak DESC, avg_calories DESC;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION send_friend_request(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION accept_friend_request(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_friends(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_pending_friend_requests() TO authenticated;
GRANT EXECUTE ON FUNCTION update_daily_goal(DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION get_friends_progress(DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION get_leaderboard(INTEGER) TO authenticated;
