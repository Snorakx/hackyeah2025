-- Create favorite_meals table for saved/quick meals
CREATE TABLE public.favorite_meals (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(100) NOT NULL,
    meal_type VARCHAR(20) NOT NULL,
    total_calories INTEGER DEFAULT 0,
    total_protein DECIMAL(5,2) DEFAULT 0,
    total_fat DECIMAL(5,2) DEFAULT 0,
    total_carbs DECIMAL(5,2) DEFAULT 0,
    is_favorite BOOLEAN DEFAULT false,
    usage_count INTEGER DEFAULT 0,
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT favorite_meals_meal_type_check CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack'))
);

-- Create favorite_meal_items table
CREATE TABLE public.favorite_meal_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    favorite_meal_id UUID REFERENCES public.favorite_meals(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    quantity_grams DECIMAL(8,2) NOT NULL,
    quantity_portions DECIMAL(3,2) DEFAULT 1.0,
    calories INTEGER NOT NULL,
    protein DECIMAL(5,2) NOT NULL,
    fat DECIMAL(5,2) NOT NULL,
    carbs DECIMAL(5,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_favorite_meals_user_id ON public.favorite_meals(user_id);
CREATE INDEX idx_favorite_meals_meal_type ON public.favorite_meals(meal_type);
CREATE INDEX idx_favorite_meals_last_used ON public.favorite_meals(last_used_at);
CREATE INDEX idx_favorite_meal_items_meal_id ON public.favorite_meal_items(favorite_meal_id);

-- Enable RLS
ALTER TABLE public.favorite_meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorite_meal_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for favorite_meals
CREATE POLICY "Users can view own favorite meals" ON public.favorite_meals
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own favorite meals" ON public.favorite_meals
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own favorite meals" ON public.favorite_meals
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own favorite meals" ON public.favorite_meals
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for favorite_meal_items
CREATE POLICY "Users can view own favorite meal items" ON public.favorite_meal_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.favorite_meals 
            WHERE id = favorite_meal_items.favorite_meal_id 
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own favorite meal items" ON public.favorite_meal_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.favorite_meals 
            WHERE id = favorite_meal_items.favorite_meal_id 
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own favorite meal items" ON public.favorite_meal_items
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.favorite_meals 
            WHERE id = favorite_meal_items.favorite_meal_id 
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own favorite meal items" ON public.favorite_meal_items
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.favorite_meals 
            WHERE id = favorite_meal_items.favorite_meal_id 
            AND user_id = auth.uid()
        )
    );

-- Create trigger for updated_at
CREATE OR REPLACE TRIGGER update_favorite_meals_updated_at BEFORE UPDATE ON public.favorite_meals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to save a meal as favorite
CREATE OR REPLACE FUNCTION save_meal_as_favorite(
    p_user_id UUID,
    p_meal_id UUID,
    p_name VARCHAR(100)
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    meal_record RECORD;
    item_record RECORD;
    new_favorite_id UUID;
BEGIN
    -- Get meal data
    SELECT * INTO meal_record FROM daily_meals WHERE id = p_meal_id AND user_id = p_user_id;
    
    IF meal_record IS NULL THEN
        RAISE EXCEPTION 'Meal not found or access denied';
    END IF;
    
    -- Create favorite meal
    INSERT INTO favorite_meals (
        user_id,
        name,
        meal_type,
        total_calories,
        total_protein,
        total_fat,
        total_carbs
    ) VALUES (
        p_user_id,
        p_name,
        meal_record.meal_type,
        meal_record.calories,
        meal_record.protein,
        meal_record.fat,
        meal_record.carbs
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

-- Function to get user's favorite meals
CREATE OR REPLACE FUNCTION get_favorite_meals(
    p_user_id UUID,
    p_meal_type VARCHAR(20) DEFAULT NULL
) RETURNS TABLE(
    id UUID,
    name VARCHAR(100),
    meal_type VARCHAR(20),
    total_calories INTEGER,
    total_protein DECIMAL(5,2),
    total_fat DECIMAL(5,2),
    total_carbs DECIMAL(5,2),
    is_favorite BOOLEAN,
    usage_count INTEGER,
    last_used_at TIMESTAMP WITH TIME ZONE,
    items JSONB
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    SELECT 
        fm.id,
        fm.name,
        fm.meal_type,
        fm.total_calories,
        fm.total_protein,
        fm.total_fat,
        fm.total_carbs,
        fm.is_favorite,
        fm.usage_count,
        fm.last_used_at,
        COALESCE(
            (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'id', fmi.id,
                        'product_id', fmi.product_id,
                        'product_name', p.name,
                        'quantity_grams', fmi.quantity_grams,
                        'quantity_portions', fmi.quantity_portions,
                        'calories', fmi.calories,
                        'protein', fmi.protein,
                        'fat', fmi.fat,
                        'carbs', fmi.carbs
                    ) ORDER BY fmi.created_at
                )
                FROM favorite_meal_items fmi
                LEFT JOIN products p ON fmi.product_id = p.id
                WHERE fmi.favorite_meal_id = fm.id
            ),
            '[]'::jsonb
        ) as items
    FROM favorite_meals fm
    WHERE fm.user_id = p_user_id 
        AND (p_meal_type IS NULL OR fm.meal_type = p_meal_type)
    ORDER BY fm.is_favorite DESC, fm.last_used_at DESC NULLS LAST, fm.usage_count DESC;
END;
$$;

-- Function to get recent meals (from daily_meals)
CREATE OR REPLACE FUNCTION get_recent_meals(
    p_user_id UUID,
    p_meal_type VARCHAR(20) DEFAULT NULL,
    p_limit INTEGER DEFAULT 10
) RETURNS TABLE(
    id UUID,
    name VARCHAR(100),
    meal_type VARCHAR(20),
    total_calories DECIMAL(8,2),
    total_protein DECIMAL(8,2),
    total_fat DECIMAL(8,2),
    total_carbs DECIMAL(8,2),
    meal_date DATE,
    items JSONB
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    SELECT 
        dm.id,
        dm.name,
        dm.meal_type,
        dm.calories as total_calories,
        dm.protein as total_protein,
        dm.fat as total_fat,
        dm.carbs as total_carbs,
        dm.meal_date,
        COALESCE(
            (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'id', dmi.id,
                        'product_id', dmi.product_id,
                        'product_name', p.name,
                        'quantity_grams', dmi.quantity_grams,
                        'quantity_portions', dmi.quantity_portions,
                        'calories', dmi.calories,
                        'protein', dmi.protein,
                        'fat', dmi.fat,
                        'carbs', dmi.carbs
                    ) ORDER BY dmi.created_at
                )
                FROM daily_meal_items dmi
                LEFT JOIN products p ON dmi.product_id = p.id
                WHERE dmi.daily_meal_id = dm.id
            ),
            '[]'::jsonb
        ) as items
    FROM daily_meals dm
    WHERE dm.user_id = p_user_id 
        AND (p_meal_type IS NULL OR dm.meal_type = p_meal_type)
    ORDER BY dm.created_at DESC
    LIMIT p_limit;
END;
$$;

-- Function to use a favorite meal (increment usage count)
CREATE OR REPLACE FUNCTION use_favorite_meal(p_favorite_meal_id UUID) 
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    UPDATE favorite_meals 
    SET 
        usage_count = usage_count + 1,
        last_used_at = NOW(),
        updated_at = NOW()
    WHERE id = p_favorite_meal_id;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION save_meal_as_favorite(UUID, UUID, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION get_favorite_meals(UUID, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION get_recent_meals(UUID, VARCHAR, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION use_favorite_meal(UUID) TO authenticated;
