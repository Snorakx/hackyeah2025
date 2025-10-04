-- Tabela do przechowywania analiz posiłków przez LLM
CREATE TABLE IF NOT EXISTS meal_analyses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  input_text TEXT NOT NULL,
  analysis_result JSONB NOT NULL,
  meal_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indeksy dla lepszej wydajności
CREATE INDEX IF NOT EXISTS idx_meal_analyses_user_id ON meal_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_meal_analyses_date ON meal_analyses(meal_date);
CREATE INDEX IF NOT EXISTS idx_meal_analyses_created_at ON meal_analyses(created_at);

-- RLS (Row Level Security)
ALTER TABLE meal_analyses ENABLE ROW LEVEL SECURITY;

-- Polityka RLS - użytkownik może widzieć tylko swoje analizy
CREATE POLICY "Users can view own meal analyses" ON meal_analyses
  FOR SELECT USING (auth.uid() = user_id);

-- Polityka RLS - użytkownik może dodawać tylko swoje analizy
CREATE POLICY "Users can insert own meal analyses" ON meal_analyses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Polityka RLS - użytkownik może aktualizować tylko swoje analizy
CREATE POLICY "Users can update own meal analyses" ON meal_analyses
  FOR UPDATE USING (auth.uid() = user_id);

-- Polityka RLS - użytkownik może usuwać tylko swoje analizy
CREATE POLICY "Users can delete own meal analyses" ON meal_analyses
  FOR DELETE USING (auth.uid() = user_id);

-- Funkcja do automatycznego aktualizowania updated_at
CREATE OR REPLACE FUNCTION update_meal_analyses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger do automatycznego aktualizowania updated_at
CREATE TRIGGER trigger_update_meal_analyses_updated_at
  BEFORE UPDATE ON meal_analyses
  FOR EACH ROW
  EXECUTE FUNCTION update_meal_analyses_updated_at();

-- Funkcja do pobierania statystyk analiz użytkownika
CREATE OR REPLACE FUNCTION get_user_meal_analysis_stats(
  user_uuid UUID,
  start_date DATE DEFAULT NULL,
  end_date DATE DEFAULT NULL
) RETURNS TABLE(
  total_analyses INTEGER,
  avg_calories DECIMAL,
  avg_protein DECIMAL,
  avg_carbs DECIMAL,
  avg_fat DECIMAL,
  most_common_meal_type TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::INTEGER as total_analyses,
    AVG((analysis_result->>'totalCalories')::DECIMAL) as avg_calories,
    AVG((analysis_result->>'totalProtein')::DECIMAL) as avg_protein,
    AVG((analysis_result->>'totalCarbs')::DECIMAL) as avg_carbs,
    AVG((analysis_result->>'totalFat')::DECIMAL) as avg_fat,
    (SELECT meal_type FROM (
      SELECT 
        (meal->>'mealType') as meal_type,
        COUNT(*) as count
      FROM meal_analyses,
      LATERAL jsonb_array_elements(analysis_result->'meals') as meal
      WHERE user_id = user_uuid
        AND (start_date IS NULL OR meal_date >= start_date)
        AND (end_date IS NULL OR meal_date <= end_date)
      GROUP BY meal_type
      ORDER BY count DESC
      LIMIT 1
    ) subq) as most_common_meal_type
  FROM meal_analyses
  WHERE user_id = user_uuid
    AND (start_date IS NULL OR meal_date >= start_date)
    AND (end_date IS NULL OR meal_date <= end_date);
END;
$$ LANGUAGE plpgsql;
