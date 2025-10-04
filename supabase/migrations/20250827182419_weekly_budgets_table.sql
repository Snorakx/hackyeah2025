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

-- Create index for better performance
CREATE INDEX idx_weekly_budgets_user_date ON public.weekly_budgets(user_id, start_date);

-- Enable RLS
ALTER TABLE public.weekly_budgets ENABLE ROW LEVEL SECURITY;

-- Weekly budgets policies
CREATE POLICY "Users can view own weekly budgets" ON public.weekly_budgets
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own weekly budgets" ON public.weekly_budgets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own weekly budgets" ON public.weekly_budgets
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own weekly budgets" ON public.weekly_budgets
    FOR DELETE USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_weekly_budgets_updated_at BEFORE UPDATE ON public.weekly_budgets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
