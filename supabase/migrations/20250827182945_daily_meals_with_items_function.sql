-- Function to get daily meals with their items and products
CREATE OR REPLACE FUNCTION get_daily_meals_with_items(
  user_uuid UUID,
  target_date DATE
) RETURNS TABLE(
  meal_id UUID,
  meal_name VARCHAR(100),
  meal_type VARCHAR(20),
  meal_calories NUMERIC,
  meal_protein NUMERIC,
  meal_carbs NUMERIC,
  meal_fat NUMERIC,
  meal_input_text TEXT,
  meal_order INTEGER,
  meal_created_at TIMESTAMP WITH TIME ZONE,
  items JSONB
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT 
    dm.id as meal_id,
    dm.name as meal_name,
    dm.meal_type,
    dm.calories as meal_calories,
    dm.protein as meal_protein,
    dm.carbs as meal_carbs,
    dm.fat as meal_fat,
    dm.input_text as meal_input_text,
    dm.meal_order,
    dm.created_at as meal_created_at,
    COALESCE(
      json_agg(
        json_build_object(
          'id', dmi.id,
          'product_id', dmi.product_id,
          'product_name', p.name,
          'quantity_grams', dmi.quantity_grams,
          'quantity_portions', dmi.quantity_portions,
          'calories', dmi.calories,
          'protein', dmi.protein,
          'fat', dmi.fat,
          'carbs', dmi.carbs,
          'created_at', dmi.created_at
        ) ORDER BY dmi.created_at
      ) FILTER (WHERE dmi.id IS NOT NULL),
      '[]'::jsonb
    ) as items
  FROM daily_meals dm
  LEFT JOIN daily_meal_items dmi ON dm.id = dmi.daily_meal_id
  LEFT JOIN products p ON dmi.product_id = p.id
  WHERE dm.user_id = user_uuid AND dm.meal_date = target_date
  GROUP BY dm.id, dm.name, dm.meal_type, dm.calories, dm.protein, dm.carbs, dm.fat, dm.input_text, dm.meal_order, dm.created_at
  ORDER BY dm.meal_order, dm.created_at;
END;
$$;

-- Function to add item to a meal
CREATE OR REPLACE FUNCTION add_meal_item(
  p_meal_id UUID,
  p_product_id UUID,
  p_quantity_grams DECIMAL(8,2),
  p_quantity_portions DECIMAL(3,2) DEFAULT 1.0
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  product_record RECORD;
  calculated_calories INTEGER;
  calculated_protein DECIMAL(5,2);
  calculated_fat DECIMAL(5,2);
  calculated_carbs DECIMAL(5,2);
  new_item_id UUID;
BEGIN
  -- Get product information
  SELECT * INTO product_record FROM products WHERE id = p_product_id;
  
  IF product_record IS NULL THEN
    RAISE EXCEPTION 'Product not found';
  END IF;
  
  -- Calculate nutritional values based on quantity
  calculated_calories := (product_record.calories_per_100g * p_quantity_grams / 100)::INTEGER;
  calculated_protein := (product_record.protein_per_100g * p_quantity_grams / 100);
  calculated_fat := (product_record.fat_per_100g * p_quantity_grams / 100);
  calculated_carbs := (product_record.carbs_per_100g * p_quantity_grams / 100);
  
  -- Insert meal item
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
    p_meal_id,
    p_product_id,
    p_quantity_grams,
    p_quantity_portions,
    calculated_calories,
    calculated_protein,
    calculated_fat,
    calculated_carbs
  ) RETURNING id INTO new_item_id;
  
  -- Update meal totals
  UPDATE daily_meals 
  SET 
    calories = (
      SELECT COALESCE(SUM(calories), 0) 
      FROM daily_meal_items 
      WHERE daily_meal_id = p_meal_id
    ),
    protein = (
      SELECT COALESCE(SUM(protein), 0) 
      FROM daily_meal_items 
      WHERE daily_meal_id = p_meal_id
    ),
    fat = (
      SELECT COALESCE(SUM(fat), 0) 
      FROM daily_meal_items 
      WHERE daily_meal_id = p_meal_id
    ),
    carbs = (
      SELECT COALESCE(SUM(carbs), 0) 
      FROM daily_meal_items 
      WHERE daily_meal_id = p_meal_id
    ),
    updated_at = NOW()
  WHERE id = p_meal_id;
  
  RETURN new_item_id;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_daily_meals_with_items(UUID, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION add_meal_item(UUID, UUID, DECIMAL, DECIMAL) TO authenticated;
