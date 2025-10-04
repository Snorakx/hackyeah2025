-- Create daily_meals table
CREATE TABLE IF NOT EXISTS daily_meals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  meal_type VARCHAR(20) NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  calories DECIMAL(8,2) NOT NULL DEFAULT 0,
  protein DECIMAL(8,2) NOT NULL DEFAULT 0,
  carbs DECIMAL(8,2) NOT NULL DEFAULT 0,
  fat DECIMAL(8,2) NOT NULL DEFAULT 0,
  input_text TEXT NOT NULL,
  meal_date DATE NOT NULL,
  meal_order INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_daily_meals_user_date ON daily_meals(user_id, meal_date);
CREATE INDEX IF NOT EXISTS idx_daily_meals_user_date_order ON daily_meals(user_id, meal_date, meal_order);
CREATE INDEX IF NOT EXISTS idx_daily_meals_meal_type ON daily_meals(meal_type);

-- Enable RLS
ALTER TABLE daily_meals ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own daily meals" ON daily_meals
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own daily meals" ON daily_meals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own daily meals" ON daily_meals
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own daily meals" ON daily_meals
  FOR DELETE USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_daily_meals_updated_at 
  BEFORE UPDATE ON daily_meals 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to get daily meals with totals
CREATE OR REPLACE FUNCTION get_daily_meals_with_totals(
  user_uuid UUID,
  target_date DATE
)
RETURNS TABLE (
  date DATE,
  meals JSON,
  total_calories DECIMAL(10,2),
  total_protein DECIMAL(10,2),
  total_carbs DECIMAL(10,2),
  total_fat DECIMAL(10,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    dm.meal_date as date,
    COALESCE(
      json_agg(
        json_build_object(
          'id', dm.id,
          'name', dm.name,
          'mealType', dm.meal_type,
          'calories', dm.calories,
          'protein', dm.protein,
          'carbs', dm.carbs,
          'fat', dm.fat,
          'input_text', dm.input_text,
          'order', dm.meal_order,
          'created_at', dm.created_at
        ) ORDER BY dm.meal_order
      ) FILTER (WHERE dm.id IS NOT NULL),
      '[]'::json
    ) as meals,
    COALESCE(SUM(dm.calories), 0) as total_calories,
    COALESCE(SUM(dm.protein), 0) as total_protein,
    COALESCE(SUM(dm.carbs), 0) as total_carbs,
    COALESCE(SUM(dm.fat), 0) as total_fat
  FROM daily_meals dm
  WHERE dm.user_id = user_uuid AND dm.meal_date = target_date
  GROUP BY dm.meal_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
