-- Drop existing functions first
DROP FUNCTION IF EXISTS send_friend_request(TEXT);
DROP FUNCTION IF EXISTS accept_friend_request(UUID);
DROP FUNCTION IF EXISTS get_friends(UUID);
DROP FUNCTION IF EXISTS get_pending_friend_requests(UUID);
DROP FUNCTION IF EXISTS get_friends_progress(UUID, DATE);
DROP FUNCTION IF EXISTS get_leaderboard(UUID, INTEGER);
DROP FUNCTION IF EXISTS update_daily_goal(UUID, INTEGER, NUMERIC, INTEGER, NUMERIC, DATE);

-- Fix send_friend_request function to accept user_id parameter
CREATE OR REPLACE FUNCTION send_friend_request(
    p_user_id UUID,
    p_friend_email TEXT
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    friend_user_id UUID;
    new_friend_id UUID;
BEGIN
    IF p_user_id IS NULL THEN
        RAISE EXCEPTION 'User ID is required';
    END IF;
    
    -- Ensure current user exists in users table
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = p_user_id) THEN
        RAISE EXCEPTION 'Current user not found in users table';
    END IF;
    
    -- Find friend by email
    SELECT id INTO friend_user_id FROM public.users WHERE email = p_friend_email;
    
    IF friend_user_id IS NULL THEN
        RAISE EXCEPTION 'User with this email not found';
    END IF;
    
    IF friend_user_id = p_user_id THEN
        RAISE EXCEPTION 'Cannot send friend request to yourself';
    END IF;
    
    -- Check if friendship already exists
    IF EXISTS (
        SELECT 1 FROM public.friends 
        WHERE (user_id = p_user_id AND friend_id = friend_user_id)
           OR (user_id = friend_user_id AND friend_id = p_user_id)
    ) THEN
        RAISE EXCEPTION 'Friendship already exists or request already sent';
    END IF;
    
    -- Create friend request
    INSERT INTO public.friends (user_id, friend_id, status)
    VALUES (p_user_id, friend_user_id, 'pending')
    RETURNING id INTO new_friend_id;
    
    RETURN new_friend_id;
END;
$$;

-- Fix accept_friend_request function to accept user_id parameter
CREATE OR REPLACE FUNCTION accept_friend_request(
    p_user_id UUID,
    p_friend_id UUID
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    IF p_user_id IS NULL THEN
        RAISE EXCEPTION 'User ID is required';
    END IF;
    
    -- Ensure current user exists in users table
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = p_user_id) THEN
        RAISE EXCEPTION 'Current user not found in users table';
    END IF;
    
    -- Update friend request to accepted
    UPDATE public.friends 
    SET status = 'accepted', updated_at = NOW()
    WHERE friend_id = p_user_id 
      AND user_id = p_friend_id 
      AND status = 'pending';
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'No pending friend request found';
    END IF;
END;
$$;

-- Fix get_friends function to accept user_id parameter
CREATE OR REPLACE FUNCTION get_friends(
    p_user_id UUID
) RETURNS TABLE(
    friend_id UUID,
    friend_email TEXT,
    friend_display_name TEXT,
    status VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    IF p_user_id IS NULL THEN
        RAISE EXCEPTION 'User ID is required';
    END IF;
    
    -- Ensure current user exists in users table
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = p_user_id) THEN
        RAISE EXCEPTION 'Current user not found in users table';
    END IF;
    
    RETURN QUERY
    SELECT 
        CASE 
            WHEN f.user_id = p_user_id THEN f.friend_id
            ELSE f.user_id
        END as friend_id,
        u.email as friend_email,
        COALESCE(u.display_name, u.email) as friend_display_name,
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

-- Fix get_pending_friend_requests function to accept user_id parameter
CREATE OR REPLACE FUNCTION get_pending_friend_requests(
    p_user_id UUID
) RETURNS TABLE(
    request_id UUID,
    sender_id UUID,
    sender_email TEXT,
    sender_display_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    IF p_user_id IS NULL THEN
        RAISE EXCEPTION 'User ID is required';
    END IF;
    
    -- Ensure current user exists in users table
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = p_user_id) THEN
        RAISE EXCEPTION 'Current user not found in users table';
    END IF;
    
    RETURN QUERY
    SELECT 
        f.id as request_id,
        f.user_id as sender_id,
        u.email as sender_email,
        COALESCE(u.display_name, u.email) as sender_display_name,
        f.created_at
    FROM public.friends f
    JOIN public.users u ON f.user_id = u.id
    WHERE f.friend_id = p_user_id 
      AND f.status = 'pending'
    ORDER BY f.created_at DESC;
END;
$$;

-- Fix get_friends_progress function to accept user_id parameter
CREATE OR REPLACE FUNCTION get_friends_progress(
    p_user_id UUID,
    p_date DATE DEFAULT CURRENT_DATE
) RETURNS TABLE(
    friend_id UUID,
    friend_email TEXT,
    friend_display_name TEXT,
    calories_goal INTEGER,
    calories_actual INTEGER,
    protein_goal NUMERIC,
    protein_actual NUMERIC,
    goal_met BOOLEAN,
    streak_count INTEGER
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    IF p_user_id IS NULL THEN
        RAISE EXCEPTION 'User ID is required';
    END IF;
    
    -- Ensure current user exists in users table
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = p_user_id) THEN
        RAISE EXCEPTION 'Current user not found in users table';
    END IF;
    
    RETURN QUERY
    SELECT 
        u.id as friend_id,
        u.email as friend_email,
        COALESCE(u.display_name, u.email) as friend_display_name,
        dg.calories_goal,
        dg.calories_actual,
        dg.protein_goal,
        dg.protein_actual,
        dg.goal_met,
        dg.streak_count
    FROM public.friends f
    JOIN public.users u ON (
        CASE 
            WHEN f.user_id = p_user_id THEN f.friend_id
            ELSE f.user_id
        END = u.id
    )
    LEFT JOIN public.daily_goals dg ON u.id = dg.user_id AND dg.date = p_date
    WHERE (f.user_id = p_user_id OR f.friend_id = p_user_id)
      AND f.status = 'accepted'
    ORDER BY dg.streak_count DESC NULLS LAST, u.email;
END;
$$;

-- Fix get_leaderboard function to accept user_id parameter
CREATE OR REPLACE FUNCTION get_leaderboard(
    p_user_id UUID,
    p_days INTEGER DEFAULT 7
) RETURNS TABLE(
    user_id UUID,
    email TEXT,
    display_name TEXT,
    total_goals_met INTEGER,
    current_streak INTEGER,
    avg_calories_met NUMERIC,
    avg_protein_met NUMERIC
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    IF p_user_id IS NULL THEN
        RAISE EXCEPTION 'User ID is required';
    END IF;
    
    -- Ensure current user exists in users table
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = p_user_id) THEN
        RAISE EXCEPTION 'Current user not found in users table';
    END IF;
    
    RETURN QUERY
    SELECT 
        u.id as user_id,
        u.email,
        COALESCE(u.display_name, u.email) as display_name,
        COUNT(CASE WHEN dg.goal_met THEN 1 END) as total_goals_met,
        MAX(dg.streak_count) as current_streak,
        AVG(CASE WHEN dg.calories_goal > 0 THEN (dg.calories_actual::NUMERIC / dg.calories_goal) * 100 ELSE NULL END) as avg_calories_met,
        AVG(CASE WHEN dg.protein_goal > 0 THEN (dg.protein_actual / dg.protein_goal) * 100 ELSE NULL END) as avg_protein_met
    FROM public.users u
    LEFT JOIN public.daily_goals dg ON u.id = dg.user_id 
        AND dg.date >= CURRENT_DATE - INTERVAL '1 day' * p_days
    WHERE u.id IN (
        SELECT 
            CASE 
                WHEN f.user_id = p_user_id THEN f.friend_id
                ELSE f.user_id
            END
        FROM public.friends f
        WHERE (f.user_id = p_user_id OR f.friend_id = p_user_id)
          AND f.status = 'accepted'
    )
    GROUP BY u.id, u.email, u.display_name
    ORDER BY total_goals_met DESC, current_streak DESC, avg_calories_met DESC;
END;
$$;

-- Fix update_daily_goal function to accept user_id parameter
CREATE OR REPLACE FUNCTION update_daily_goal(
    p_user_id UUID,
    p_calories_goal INTEGER,
    p_protein_goal NUMERIC,
    p_calories_actual INTEGER,
    p_protein_actual NUMERIC,
    p_date DATE DEFAULT CURRENT_DATE
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    goal_met BOOLEAN;
    current_streak INTEGER;
    result JSONB;
BEGIN
    IF p_user_id IS NULL THEN
        RAISE EXCEPTION 'User ID is required';
    END IF;
    
    -- Ensure current user exists in users table
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = p_user_id) THEN
        RAISE EXCEPTION 'Current user not found in users table';
    END IF;
    
    -- Determine if goal was met
    goal_met := (p_calories_actual >= p_calories_goal * 0.9) AND (p_protein_actual >= p_protein_goal * 0.9);
    
    -- Get current streak
    SELECT COALESCE(streak_count, 0) INTO current_streak
    FROM public.daily_goals
    WHERE user_id = p_user_id
    ORDER BY date DESC
    LIMIT 1;
    
    -- Update streak count
    IF goal_met THEN
        current_streak := current_streak + 1;
    ELSE
        current_streak := 0;
    END IF;
    
    -- Upsert daily goal
    INSERT INTO public.daily_goals (
        user_id, 
        date, 
        calories_goal, 
        protein_goal, 
        calories_actual, 
        protein_actual, 
        goal_met, 
        streak_count
    ) VALUES (
        p_user_id,
        p_date,
        p_calories_goal,
        p_protein_goal,
        p_calories_actual,
        p_protein_actual,
        goal_met,
        current_streak
    )
    ON CONFLICT (user_id, date) DO UPDATE SET
        calories_goal = EXCLUDED.calories_goal,
        protein_goal = EXCLUDED.protein_goal,
        calories_actual = EXCLUDED.calories_actual,
        protein_actual = EXCLUDED.protein_actual,
        goal_met = EXCLUDED.goal_met,
        streak_count = EXCLUDED.streak_count,
        updated_at = NOW();
    
    -- Return result
    result := jsonb_build_object(
        'goal_met', goal_met,
        'streak_count', current_streak,
        'calories_percentage', CASE WHEN p_calories_goal > 0 THEN (p_calories_actual::NUMERIC / p_calories_goal) * 100 ELSE 0 END,
        'protein_percentage', CASE WHEN p_protein_goal > 0 THEN (p_protein_actual / p_protein_goal) * 100 ELSE 0 END
    );
    
    RETURN result;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION send_friend_request(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION accept_friend_request(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_friends(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_pending_friend_requests(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_friends_progress(UUID, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION get_leaderboard(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION update_daily_goal(UUID, INTEGER, NUMERIC, INTEGER, NUMERIC, DATE) TO authenticated;
