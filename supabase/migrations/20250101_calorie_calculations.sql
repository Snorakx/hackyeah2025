-- Funkcja do obliczania BMR (Basal Metabolic Rate)
CREATE OR REPLACE FUNCTION calculate_bmr(
  weight_kg DECIMAL,
  height_cm DECIMAL,
  age_years INTEGER,
  gender TEXT
) RETURNS DECIMAL AS $$
BEGIN
  -- Formuła Mifflin-St Jeor
  IF gender = 'male' THEN
    RETURN (10 * weight_kg) + (6.25 * height_cm) - (5 * age_years) + 5;
  ELSE
    RETURN (10 * weight_kg) + (6.25 * height_cm) - (5 * age_years) - 161;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Funkcja do obliczania TDEE (Total Daily Energy Expenditure)
CREATE OR REPLACE FUNCTION calculate_tdee(
  bmr DECIMAL,
  activity_level TEXT
) RETURNS DECIMAL AS $$
BEGIN
  CASE activity_level
    WHEN 'sedentary' THEN RETURN bmr * 1.2;
    WHEN 'light' THEN RETURN bmr * 1.375;
    WHEN 'moderate' THEN RETURN bmr * 1.55;
    WHEN 'active' THEN RETURN bmr * 1.725;
    WHEN 'very_active' THEN RETURN bmr * 1.9;
    ELSE RETURN bmr * 1.2; -- domyślnie sedentary
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- Funkcja do obliczania dziennego celu kalorycznego
CREATE OR REPLACE FUNCTION calculate_daily_calorie_target(
  user_id UUID
) RETURNS TABLE(
  bmr DECIMAL,
  tdee DECIMAL,
  target_calories DECIMAL,
  target_protein DECIMAL,
  target_fat DECIMAL,
  target_carbs DECIMAL
) AS $$
DECLARE
  user_record RECORD;
  calculated_bmr DECIMAL;
  calculated_tdee DECIMAL;
  target_calories DECIMAL;
BEGIN
  -- Pobierz dane użytkownika
  SELECT * INTO user_record FROM users WHERE id = user_id;
  
  IF user_record IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;
  
  -- Oblicz BMR
  calculated_bmr := calculate_bmr(
    user_record.weight,
    user_record.height,
    user_record.age,
    user_record.gender
  );
  
  -- Oblicz TDEE
  calculated_tdee := calculate_tdee(calculated_bmr, user_record.activity_level);
  
  -- Oblicz cel kaloryczny (z uwzględnieniem deficytu)
  target_calories := calculated_tdee - (user_record.target_weekly_loss * 7700 / 7); -- 7700 kcal = 1kg tłuszczu
  
  -- Oblicz makroskładniki (proporcje: 30% protein, 25% fat, 45% carbs)
  RETURN QUERY SELECT
    calculated_bmr,
    calculated_tdee,
    target_calories,
    (target_calories * 0.3) / 4, -- protein: 4 kcal/g
    (target_calories * 0.25) / 9, -- fat: 9 kcal/g
    (target_calories * 0.45) / 4; -- carbs: 4 kcal/g
END;
$$ LANGUAGE plpgsql;

-- Funkcja do obliczania tygodniowego budżetu z weekend mode
CREATE OR REPLACE FUNCTION calculate_weekly_budget(
  user_id UUID,
  week_start_date DATE
) RETURNS TABLE(
  start_date DATE,
  end_date DATE,
  target_calories DECIMAL,
  target_protein DECIMAL,
  target_fat DECIMAL,
  target_carbs DECIMAL,
  weekend_bonus_calories DECIMAL
) AS $$
DECLARE
  user_record RECORD;
  daily_target RECORD;
  weekend_bonus DECIMAL;
BEGIN
  -- Pobierz dane użytkownika
  SELECT * INTO user_record FROM users WHERE id = user_id;
  
  IF user_record IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;
  
  -- Oblicz dzienny cel
  SELECT * INTO daily_target FROM calculate_daily_calorie_target(user_id);
  
  -- Oblicz bonus weekendowy (jeśli weekend mode jest aktywny)
  IF user_record.weekend_mode = 'active' THEN
    weekend_bonus := daily_target.target_calories * 0.2; -- 20% bonus
  ELSE
    weekend_bonus := 0;
  END IF;
  
  RETURN QUERY SELECT
    week_start_date,
    week_start_date + INTERVAL '6 days',
    daily_target.target_calories * 7,
    daily_target.target_protein * 7,
    daily_target.target_fat * 7,
    daily_target.target_carbs * 7,
    weekend_bonus;
END;
$$ LANGUAGE plpgsql;
