-- Add smart detection fields to favorite_meals
ALTER TABLE public.favorite_meals 
ADD COLUMN IF NOT EXISTS ai_suggested BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS similarity_score DECIMAL(3,2) DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS detection_count INTEGER DEFAULT 0;

-- Create function to detect similar meals (3x rule)
CREATE OR REPLACE FUNCTION detect_similar_meals(
    p_user_id UUID,
    p_meal_id UUID,
    p_similarity_threshold DECIMAL(3,2) DEFAULT 0.8
) RETURNS TABLE(
    similar_meal_id UUID,
    similarity_score DECIMAL(3,2),
    meal_name VARCHAR(100),
    meal_type VARCHAR(20)
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    current_meal RECORD;
    similar_meal RECORD;
    similarity DECIMAL(3,2);
BEGIN
    -- Get current meal data
    SELECT * INTO current_meal FROM daily_meals WHERE id = p_meal_id AND user_id = p_user_id;
    
    IF current_meal IS NULL THEN
        RETURN;
    END IF;
    
    -- Find similar meals from last 30 days
    FOR similar_meal IN 
        SELECT dm.*, 
               COUNT(*) as common_products,
               AVG(ABS(dm.calories - current_meal.calories) / GREATEST(dm.calories, current_meal.calories, 1)) as calorie_diff
        FROM daily_meals dm
        JOIN daily_meal_items dmi ON dm.id = dmi.daily_meal_id
        WHERE dm.user_id = p_user_id 
            AND dm.id != p_meal_id
            AND dm.meal_date >= CURRENT_DATE - INTERVAL '30 days'
            AND dm.meal_type = current_meal.meal_type
            AND EXISTS (
                SELECT 1 FROM daily_meal_items dmi2 
                WHERE dmi2.daily_meal_id = p_meal_id 
                AND dmi2.product_id = dmi.product_id
            )
        GROUP BY dm.id, dm.name, dm.meal_type, dm.calories, dm.protein, dm.fat, dm.carbs
        HAVING COUNT(*) >= 2 AND AVG(ABS(dm.calories - current_meal.calories) / GREATEST(dm.calories, current_meal.calories, 1)) < 0.3
        ORDER BY common_products DESC, calorie_diff ASC
    LOOP
        -- Calculate similarity score
        similarity := (similar_meal.common_products::DECIMAL / 3.0) * (1.0 - similar_meal.calorie_diff);
        
        IF similarity >= p_similarity_threshold THEN
            similar_meal_id := similar_meal.id;
            similarity_score := similarity;
            meal_name := similar_meal.name;
            meal_type := similar_meal.meal_type;
            RETURN NEXT;
        END IF;
    END LOOP;
END;
$$;

-- Create function to auto-add favorite meal (AI suggested)
CREATE OR REPLACE FUNCTION auto_add_favorite_meal(
    p_user_id UUID,
    p_meal_id UUID,
    p_name VARCHAR(100) DEFAULT NULL
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    meal_record RECORD;
    item_record RECORD;
    new_favorite_id UUID;
    meal_name VARCHAR(100);
BEGIN
    -- Get meal data
    SELECT * INTO meal_record FROM daily_meals WHERE id = p_meal_id AND user_id = p_user_id;
    
    IF meal_record IS NULL THEN
        RAISE EXCEPTION 'Meal not found or access denied';
    END IF;
    
    -- Use provided name or generate from meal
    meal_name := COALESCE(p_name, meal_record.name || ' (AI)');
    
    -- Create favorite meal with AI suggested flag
    INSERT INTO favorite_meals (
        user_id,
        name,
        meal_type,
        total_calories,
        total_protein,
        total_fat,
        total_carbs,
        ai_suggested,
        detection_count
    ) VALUES (
        p_user_id,
        meal_name,
        meal_record.meal_type,
        meal_record.calories,
        meal_record.protein,
        meal_record.fat,
        meal_record.carbs,
        true,
        1
    ) RETURNING id INTO new_favorite_id;
    
    -- Copy meal items
    FOR item_record IN 
        SELECT * FROM daily_meal_items WHERE daily_meal_id = p_meal_id
    LOOP
        INSERT INTO favorite_meal_items (
            favorite_meal_id,
            product_id,
            quantity_grams,
            quantity_portions,
            calories,
            protein,
            fat,
            carbs
        ) VALUES (
            new_favorite_id,
            item_record.product_id,
            item_record.quantity_grams,
            item_record.quantity_portions,
            item_record.calories,
            item_record.protein,
            item_record.fat,
            item_record.carbs
        );
    END LOOP;
    
    RETURN new_favorite_id;
END;
$$;

-- Create function to add favorite meal from daily meal
CREATE OR REPLACE FUNCTION add_favorite_from_daily_meal(
    p_user_id UUID,
    p_meal_id UUID,
    p_name VARCHAR(100),
    p_meal_type VARCHAR(20) DEFAULT NULL
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    meal_record RECORD;
    item_record RECORD;
    new_favorite_id UUID;
    target_meal_type VARCHAR(20);
BEGIN
    -- Get meal data
    SELECT * INTO meal_record FROM daily_meals WHERE id = p_meal_id AND user_id = p_user_id;
    
    IF meal_record IS NULL THEN
        RAISE EXCEPTION 'Meal not found or access denied';
    END IF;
    
    -- Use provided meal type or original
    target_meal_type := COALESCE(p_meal_type, meal_record.meal_type);
    
    -- Create favorite meal
    INSERT INTO favorite_meals (
        user_id,
        name,
        meal_type,
        total_calories,
        total_protein,
        total_fat,
        total_carbs,
        is_favorite
    ) VALUES (
        p_user_id,
        p_name,
        target_meal_type,
        meal_record.calories,
        meal_record.protein,
        meal_record.fat,
        meal_record.carbs,
        true
    ) RETURNING id INTO new_favorite_id;
    
    -- Copy meal items
    FOR item_record IN 
        SELECT * FROM daily_meal_items WHERE daily_meal_id = p_meal_id
    LOOP
        INSERT INTO favorite_meal_items (
            favorite_meal_id,
            product_id,
            quantity_grams,
            quantity_portions,
            calories,
            protein,
            fat,
            carbs
        ) VALUES (
            new_favorite_id,
            item_record.product_id,
            item_record.quantity_grams,
            item_record.quantity_portions,
            item_record.calories,
            item_record.protein,
            item_record.fat,
            item_record.carbs
        );
    END LOOP;
    
    RETURN new_favorite_id;
END;
$$;

-- Create function to add favorite meal to daily meals
CREATE OR REPLACE FUNCTION add_favorite_to_daily_meal(
    p_user_id UUID,
    p_favorite_meal_id UUID,
    p_meal_date DATE DEFAULT CURRENT_DATE,
    p_meal_type VARCHAR(20) DEFAULT NULL
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    favorite_record RECORD;
    item_record RECORD;
    new_meal_id UUID;
    target_meal_type VARCHAR(20);
    meal_order INTEGER;
BEGIN
    -- Get favorite meal data
    SELECT * INTO favorite_record FROM favorite_meals WHERE id = p_favorite_meal_id AND user_id = p_user_id;
    
    IF favorite_record IS NULL THEN
        RAISE EXCEPTION 'Favorite meal not found or access denied';
    END IF;
    
    -- Use provided meal type or original
    target_meal_type := COALESCE(p_meal_type, favorite_record.meal_type);
    
    -- Get next meal order for the day
    SELECT COALESCE(MAX(meal_order), 0) + 1 INTO meal_order 
    FROM daily_meals 
    WHERE user_id = p_user_id AND meal_date = p_meal_date AND meal_type = target_meal_type;
    
    -- Create daily meal
    INSERT INTO daily_meals (
        user_id,
        name,
        meal_type,
        calories,
        protein,
        fat,
        carbs,
        input_text,
        meal_date,
        meal_order
    ) VALUES (
        p_user_id,
        favorite_record.name,
        target_meal_type,
        favorite_record.total_calories,
        favorite_record.total_protein,
        favorite_record.total_fat,
        favorite_record.total_carbs,
        'Added from favorites',
        p_meal_date,
        meal_order
    ) RETURNING id INTO new_meal_id;
    
    -- Copy favorite meal items
    FOR item_record IN 
        SELECT * FROM favorite_meal_items WHERE favorite_meal_id = p_favorite_meal_id
    LOOP
        INSERT INTO daily_meal_items (
            daily_meal_id,
            product_id,
            quantity_grams,
            quantity_portions,
            calories,
            protein,
            fat,
            carbs
        ) VALUES (
            new_meal_id,
            item_record.product_id,
            item_record.quantity_grams,
            item_record.quantity_portions,
            item_record.calories,
            item_record.protein,
            item_record.fat,
            item_record.carbs
        );
    END LOOP;
    
    -- Update usage count
    UPDATE favorite_meals 
    SET 
        usage_count = usage_count + 1,
        last_used_at = NOW(),
        updated_at = NOW()
    WHERE id = p_favorite_meal_id;
    
    RETURN new_meal_id;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION detect_similar_meals(UUID, UUID, DECIMAL) TO authenticated;
GRANT EXECUTE ON FUNCTION auto_add_favorite_meal(UUID, UUID, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION add_favorite_from_daily_meal(UUID, UUID, VARCHAR, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION add_favorite_to_daily_meal(UUID, UUID, DATE, VARCHAR) TO authenticated;
