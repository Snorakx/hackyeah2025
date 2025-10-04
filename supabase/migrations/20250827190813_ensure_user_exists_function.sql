-- Function to ensure user exists in users table
CREATE OR REPLACE FUNCTION ensure_user_exists(
    p_user_id UUID DEFAULT NULL
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    current_user_id UUID;
    user_email TEXT;
BEGIN
    IF p_user_id IS NULL THEN
        current_user_id := auth.uid();
    ELSE
        current_user_id := p_user_id;
    END IF;
    
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'User not authenticated';
    END IF;
    
    -- Get user email from auth.users
    SELECT email INTO user_email FROM auth.users WHERE id = current_user_id;
    
    IF user_email IS NULL THEN
        RAISE EXCEPTION 'User not found in auth.users';
    END IF;
    
    -- Insert user into public.users if not exists
    INSERT INTO public.users (
        id, 
        email, 
        weight, 
        height, 
        age, 
        gender, 
        target_weekly_loss, 
        activity_level, 
        weekend_mode, 
        weekend_start_day, 
        weekend_end_day, 
        sleep_hours, 
        notification_preferences, 
        onboarding_completed
    ) VALUES (
        current_user_id,
        user_email,
        70, -- default values
        170,
        25,
        'other',
        0.5,
        'moderate',
        'inactive',
        5,
        0,
        8,
        '{"daily_reminder": true, "weight_reminder": true, "meal_suggestions": true}'::jsonb,
        false
    )
    ON CONFLICT (id) DO NOTHING;
END;
$$;

-- Update send_friend_request to ensure user exists
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
    PERFORM ensure_user_exists(current_user_id);
    
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

-- Update accept_friend_request to ensure user exists
CREATE OR REPLACE FUNCTION accept_friend_request(
    p_friend_id UUID
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    current_user_id UUID;
BEGIN
    current_user_id := auth.uid();
    
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'User not authenticated';
    END IF;
    
    -- Ensure current user exists in users table
    PERFORM ensure_user_exists(current_user_id);
    
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

-- Update get_friends to ensure user exists
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
    
    IF p_user_id IS NULL THEN
        RAISE EXCEPTION 'User not authenticated';
    END IF;
    
    -- Ensure current user exists in users table
    PERFORM ensure_user_exists(p_user_id);
    
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

-- Update get_pending_friend_requests to ensure user exists
CREATE OR REPLACE FUNCTION get_pending_friend_requests() 
RETURNS TABLE(
    requester_id UUID,
    requester_email TEXT,
    requester_display_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    current_user_id UUID;
BEGIN
    current_user_id := auth.uid();
    
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'User not authenticated';
    END IF;
    
    -- Ensure current user exists in users table
    PERFORM ensure_user_exists(current_user_id);
    
    RETURN QUERY
    SELECT 
        f.user_id as requester_id,
        u.email as requester_email,
        u.display_name as requester_display_name,
        f.created_at
    FROM public.friends f
    JOIN public.users u ON f.user_id = u.id
    WHERE f.friend_id = current_user_id 
      AND f.status = 'pending'
    ORDER BY f.created_at DESC;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION ensure_user_exists(UUID) TO authenticated;
