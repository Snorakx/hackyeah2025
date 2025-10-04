export interface User {
  id: string;
  email: string;
  display_name?: string;
  avatar?: string;
  weight: number;
  height: number;
  age: number;
  gender: 'male' | 'female' | 'other';
  target_weekly_loss: number;
  activity_level: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  weekend_mode: 'active' | 'inactive';
  weekend_start_day: number;
  weekend_end_day: number;
  sleep_hours: number;
  region?: string; // e.g., 'PL', 'IE', 'US', 'DE'
  notification_preferences: {
    daily_reminder: boolean;
    weight_reminder: boolean;
    meal_suggestions: boolean;
  };
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  name: string;
  brand?: string;
  barcode?: string;
  unit: string;
  calories_per_100g: number;
  protein_per_100g: number;
  fat_per_100g: number;
  carbs_per_100g: number;
  fiber_per_100g: number;
  sodium_per_100g: number;
  is_global: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface UserFavorite {
  id: string;
  user_id: string;
  name: string;
  type: 'product' | 'meal' | 'template';
  product_id?: string;
  meal_data?: any;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  created_at: string;
}

export interface WeeklyBudget {
  id: string;
  user_id: string;
  start_date: string;
  end_date: string;
  target_calories: number;
  target_protein: number;
  target_fat: number;
  target_carbs: number;
  weekend_bonus_calories: number;
  status: 'active' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface Meal {
  id: string;
  user_id: string;
  date: string;
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  total_calories: number;
  total_protein: number;
  total_fat: number;
  total_carbs: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface MealItem {
  id: string;
  meal_id: string;
  product_id: string;
  quantity_grams: number;
  quantity_portions: number;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  created_at: string;
}

export interface Activity {
  id: string;
  user_id: string;
  date: string;
  type: 'running' | 'cycling' | 'swimming' | 'strength' | 'flexibility' | 'mixed';
  duration_minutes: number;
  estimated_calories: number;
  notes?: string;
  created_at: string;
}

export interface Weight {
  id: string;
  user_id: string;
  date: string;
  value_kg: number;
  note?: string;
  flags: string[];
  source: 'manual' | 'apple_health' | 'google_fit';
  created_at: string;
}

export interface DailySummary {
  id: string;
  user_id: string;
  date: string;
  total_calories: number;
  total_protein: number;
  total_fat: number;
  total_carbs: number;
  calories_burned: number;
  steps?: number;
  weight?: number;
  is_weekend: boolean;
  created_at: string;
  updated_at: string;
}

// Request/Response types
export interface CreateUserRequest {
  email: string;
  display_name?: string;
  weight: number;
  height: number;
  age: number;
  gender: 'male' | 'female' | 'other';
  target_weekly_loss?: number;
  activity_level?: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  weekend_mode?: 'active' | 'inactive';
  weekend_start_day?: number;
  weekend_end_day?: number;
  sleep_hours?: number;
  notification_preferences?: {
    daily_reminder: boolean;
    weight_reminder: boolean;
    meal_suggestions: boolean;
  };
}

export interface UpdateUserRequest {
  display_name?: string;
  avatar?: string;
  region?: string;
  weight?: number;
  height?: number;
  age?: number;
  gender?: 'male' | 'female' | 'other';
  target_weekly_loss?: number;
  activity_level?: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  weekend_mode?: 'active' | 'inactive';
  weekend_start_day?: number;
  weekend_end_day?: number;
  sleep_hours?: number;
  notification_preferences?: {
    daily_reminder: boolean;
    weight_reminder: boolean;
    meal_suggestions: boolean;
  };
}

export interface CreateProductRequest {
  name: string;
  brand?: string;
  barcode?: string;
  unit?: string;
  calories_per_100g: number;
  protein_per_100g: number;
  fat_per_100g: number;
  carbs_per_100g: number;
  fiber_per_100g?: number;
  sodium_per_100g?: number;
  is_global?: boolean;
}

export interface CreateMealRequest {
  date: string;
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  items: {
    product_id: string;
    quantity_grams: number;
    quantity_portions?: number;
  }[];
  notes?: string;
}

export interface CreateActivityRequest {
  date: string;
  type: 'running' | 'cycling' | 'swimming' | 'strength' | 'flexibility' | 'mixed';
  duration_minutes: number;
  estimated_calories: number;
  notes?: string;
}

export interface CreateWeightRequest {
  date: string;
  value_kg: number;
  note?: string;
  flags?: string[];
  source?: 'manual' | 'apple_health' | 'google_fit';
}

export interface CreateWeeklyBudgetRequest {
  start_date: string;
  end_date: string;
  target_calories: number;
  target_protein: number;
  target_fat: number;
  target_carbs: number;
  weekend_bonus_calories?: number;
}

export interface CreateUserFavoriteRequest {
  name: string;
  type: 'product' | 'meal' | 'template';
  product_id?: string;
  meal_data?: any;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Nutrition calculation types
export interface NutritionInfo {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  fiber?: number;
  sodium?: number;
}

export interface DailyNutritionTarget {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
}

export interface WeeklyNutritionTarget {
  total_calories: number;
  daily_average_calories: number;
  target_protein: number;
  target_fat: number;
  target_carbs: number;
  weekend_bonus_calories: number;
}

// Weekend mode types
export interface WeekendModeConfig {
  is_active: boolean;
  start_day: number; // 0=Sunday, 5=Friday
  end_day: number;   // 0=Sunday, 6=Saturday
  bonus_calories: number;
}

// Search and filter types
export interface ProductSearchParams {
  query?: string;
  category?: string;
  limit?: number;
  offset?: number;
}

export interface MealSearchParams {
  date?: string;
  type?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  limit?: number;
  offset?: number;
}

// Analytics types
export interface WeightTrend {
  date: string;
  weight: number;
  change: number;
  trend: 'up' | 'down' | 'stable';
}

export interface WeeklyProgress {
  week_start: string;
  week_end: string;
  target_calories: number;
  actual_calories: number;
  deficit: number;
  weight_start: number;
  weight_end: number;
  weight_loss: number;
  target_loss: number;
  progress_percentage: number;
}

export interface NutritionSuggestion {
  type: 'protein' | 'carbs' | 'fat' | 'fiber' | 'sodium';
  message: string;
  suggested_products: Product[];
  priority: 'high' | 'medium' | 'low';
}

export interface OnboardingData {
  id?: string;
  user_id: string;
  email?: string; // Add email for user creation
  units: 'metric' | 'imperial';
  weighing_frequency: 'weekly' | 'daily' | '2-3x';
  weighing_day_of_week?: number; // 0-6, 0=Monday
  meals_per_day?: number;
  diet_preferences?: string[];
  allergies?: string[];
  goal?: 'weight_loss' | 'maintenance' | 'muscle_gain';
  goal_intensity?: 'conservative' | 'moderate' | 'aggressive';
  region?: string;
  created_at?: string;
  updated_at?: string;
}

export interface OnboardingCompleteResult {
  weekly_budget: WeeklyBudget;
  nutrition_targets: {
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
  };
  onboarding_data: OnboardingData;
}
