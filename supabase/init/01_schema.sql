-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types
CREATE TYPE activity_level AS ENUM ('sedentary', 'light', 'moderate', 'active', 'very_active');
CREATE TYPE meal_type AS ENUM ('breakfast', 'lunch', 'dinner', 'snack');
CREATE TYPE workout_type AS ENUM ('running', 'cycling', 'swimming', 'strength', 'flexibility', 'mixed');
CREATE TYPE weekend_mode_status AS ENUM ('active', 'inactive');
CREATE TYPE weight_source AS ENUM ('manual', 'apple_health', 'google_fit');

-- Create users table (extends auth.users)
CREATE TABLE public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    display_name VARCHAR(255),
    weight DECIMAL(5,2) NOT NULL,
    height INTEGER NOT NULL, -- cm
    age INTEGER NOT NULL,
    gender VARCHAR(10) NOT NULL CHECK (gender IN ('male', 'female', 'other')),
    target_weekly_loss DECIMAL(3,2) NOT NULL DEFAULT 0.5,
    activity_level activity_level NOT NULL DEFAULT 'moderate',
    weekend_mode weekend_mode_status NOT NULL DEFAULT 'inactive',
    weekend_start_day INTEGER DEFAULT 5, -- Friday (0=Sunday, 5=Friday)
    weekend_end_day INTEGER DEFAULT 0, -- Sunday (0=Sunday, 6=Saturday)
    sleep_hours INTEGER DEFAULT 8,
    notification_preferences JSONB DEFAULT '{"daily_reminder": true, "weight_reminder": true, "meal_suggestions": true}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create products table (food database)
CREATE TABLE public.products (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    brand VARCHAR(255),
    barcode VARCHAR(50) UNIQUE,
    unit VARCHAR(20) NOT NULL DEFAULT 'g', -- g, ml, piece, etc.
    calories_per_100g DECIMAL(6,2) NOT NULL,
    protein_per_100g DECIMAL(5,2) NOT NULL,
    fat_per_100g DECIMAL(5,2) NOT NULL,
    carbs_per_100g DECIMAL(5,2) NOT NULL,
    fiber_per_100g DECIMAL(5,2) DEFAULT 0,
    sodium_per_100g DECIMAL(5,2) DEFAULT 0,
    source VARCHAR(20) DEFAULT 'local', -- 'local', 'usda', 'openfoodfacts'
    is_global BOOLEAN NOT NULL DEFAULT true,
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_favorites table (user's favorite products and meals)
CREATE TABLE public.user_favorites (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('product', 'meal', 'template')),
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    meal_data JSONB, -- For custom meals and templates
    calories INTEGER NOT NULL,
    protein DECIMAL(5,2) NOT NULL,
    fat DECIMAL(5,2) NOT NULL,
    carbs DECIMAL(5,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create weekly_budgets table
CREATE TABLE public.weekly_budgets (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    target_calories INTEGER NOT NULL,
    target_protein DECIMAL(5,2) NOT NULL,
    target_fat DECIMAL(5,2) NOT NULL,
    target_carbs DECIMAL(5,2) NOT NULL,
    weekend_bonus_calories INTEGER DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, start_date)
);

-- Create meals table
CREATE TABLE public.meals (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    type meal_type NOT NULL,
    total_calories INTEGER DEFAULT 0,
    total_protein DECIMAL(5,2) DEFAULT 0,
    total_fat DECIMAL(5,2) DEFAULT 0,
    total_carbs DECIMAL(5,2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create meal_items table
CREATE TABLE public.meal_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    meal_id UUID REFERENCES public.meals(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    quantity_grams DECIMAL(8,2) NOT NULL,
    quantity_portions DECIMAL(3,2) DEFAULT 1.0,
    calories INTEGER NOT NULL,
    protein DECIMAL(5,2) NOT NULL,
    fat DECIMAL(5,2) NOT NULL,
    carbs DECIMAL(5,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create activities table
CREATE TABLE public.activities (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    type workout_type NOT NULL,
    duration_minutes INTEGER NOT NULL,
    estimated_calories INTEGER NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create weights table
CREATE TABLE public.weights (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    value_kg DECIMAL(5,2) NOT NULL,
    note TEXT,
    flags TEXT[], -- ['melanż', 'dużo soli', 'trening']
    source weight_source NOT NULL DEFAULT 'manual',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, date)
);

-- Create daily_summaries table (calculated daily totals)
CREATE TABLE public.daily_summaries (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    total_calories_consumed INTEGER DEFAULT 0,
    total_protein_consumed DECIMAL(5,2) DEFAULT 0,
    total_fat_consumed DECIMAL(5,2) DEFAULT 0,
    total_carbs_consumed DECIMAL(5,2) DEFAULT 0,
    total_calories_burned INTEGER DEFAULT 0,
    net_calories INTEGER DEFAULT 0,
    weight DECIMAL(5,2),
    is_weekend BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, date)
);

-- Create indexes for better performance
CREATE INDEX idx_products_barcode ON public.products(barcode);
CREATE INDEX idx_products_name ON public.products(name);
CREATE INDEX idx_user_favorites_user_id ON public.user_favorites(user_id);
CREATE INDEX idx_weekly_budgets_user_date ON public.weekly_budgets(user_id, start_date);
CREATE INDEX idx_meals_user_date ON public.meals(user_id, date);
CREATE INDEX idx_meal_items_meal_id ON public.meal_items(meal_id);
CREATE INDEX idx_activities_user_date ON public.activities(user_id, date);
CREATE INDEX idx_weights_user_date ON public.weights(user_id, date);
CREATE INDEX idx_daily_summaries_user_date ON public.daily_summaries(user_id, date);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_summaries ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only access their own data
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Products policies (global products are readable by all, user products only by owner)
CREATE POLICY "Users can view products" ON public.products
    FOR SELECT USING (is_global = true OR auth.uid() = created_by);

CREATE POLICY "Users can insert own products" ON public.products
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own products" ON public.products
    FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete own products" ON public.products
    FOR DELETE USING (auth.uid() = created_by);

-- User favorites policies
CREATE POLICY "Users can view own favorites" ON public.user_favorites
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own favorites" ON public.user_favorites
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own favorites" ON public.user_favorites
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own favorites" ON public.user_favorites
    FOR DELETE USING (auth.uid() = user_id);

-- Weekly budgets policies
CREATE POLICY "Users can view own weekly budgets" ON public.weekly_budgets
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own weekly budgets" ON public.weekly_budgets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own weekly budgets" ON public.weekly_budgets
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own weekly budgets" ON public.weekly_budgets
    FOR DELETE USING (auth.uid() = user_id);

-- Meals policies
CREATE POLICY "Users can view own meals" ON public.meals
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own meals" ON public.meals
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meals" ON public.meals
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own meals" ON public.meals
    FOR DELETE USING (auth.uid() = user_id);

-- Meal items policies
CREATE POLICY "Users can view own meal items" ON public.meal_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.meals 
            WHERE id = meal_items.meal_id 
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own meal items" ON public.meal_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.meals 
            WHERE id = meal_items.meal_id 
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own meal items" ON public.meal_items
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.meals 
            WHERE id = meal_items.meal_id 
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own meal items" ON public.meal_items
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.meals 
            WHERE id = meal_items.meal_id 
            AND user_id = auth.uid()
        )
    );

-- Activities policies
CREATE POLICY "Users can view own activities" ON public.activities
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own activities" ON public.activities
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own activities" ON public.activities
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own activities" ON public.activities
    FOR DELETE USING (auth.uid() = user_id);

-- Weights policies
CREATE POLICY "Users can view own weights" ON public.weights
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own weights" ON public.weights
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own weights" ON public.weights
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own weights" ON public.weights
    FOR DELETE USING (auth.uid() = user_id);

-- Daily summaries policies
CREATE POLICY "Users can view own daily summaries" ON public.daily_summaries
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own daily summaries" ON public.daily_summaries
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own daily summaries" ON public.daily_summaries
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own daily summaries" ON public.daily_summaries
    FOR DELETE USING (auth.uid() = user_id);

-- Create functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_weekly_budgets_updated_at BEFORE UPDATE ON public.weekly_budgets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_meals_updated_at BEFORE UPDATE ON public.meals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_summaries_updated_at BEFORE UPDATE ON public.daily_summaries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate daily summary
CREATE OR REPLACE FUNCTION calculate_daily_summary(user_uuid UUID, target_date DATE)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.daily_summaries (
        user_id, 
        date, 
        total_calories_consumed,
        total_protein_consumed,
        total_fat_consumed,
        total_carbs_consumed,
        total_calories_burned,
        net_calories,
        weight,
        is_weekend
    )
    SELECT 
        user_uuid,
        target_date,
        COALESCE(SUM(mi.calories), 0) as total_calories_consumed,
        COALESCE(SUM(mi.protein), 0) as total_protein_consumed,
        COALESCE(SUM(mi.fat), 0) as total_fat_consumed,
        COALESCE(SUM(mi.carbs), 0) as total_carbs_consumed,
        COALESCE(SUM(a.estimated_calories), 0) as total_calories_burned,
        COALESCE(SUM(mi.calories), 0) - COALESCE(SUM(a.estimated_calories), 0) as net_calories,
        w.value_kg as weight,
        EXTRACT(DOW FROM target_date) IN (0, 6) as is_weekend
    FROM public.meals m
    LEFT JOIN public.meal_items mi ON m.id = mi.meal_id
    LEFT JOIN public.activities a ON a.user_id = user_uuid AND a.date = target_date
    LEFT JOIN public.weights w ON w.user_id = user_uuid AND w.date = target_date
    WHERE m.user_id = user_uuid AND m.date = target_date
    GROUP BY w.value_kg
    ON CONFLICT (user_id, date) DO UPDATE SET
        total_calories_consumed = EXCLUDED.total_calories_consumed,
        total_protein_consumed = EXCLUDED.total_protein_consumed,
        total_fat_consumed = EXCLUDED.total_fat_consumed,
        total_carbs_consumed = EXCLUDED.total_carbs_consumed,
        total_calories_burned = EXCLUDED.total_calories_burned,
        net_calories = EXCLUDED.net_calories,
        weight = EXCLUDED.weight,
        is_weekend = EXCLUDED.is_weekend,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;
