import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Database types
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          weight: number;
          target_weekly_loss: number;
          activity_level: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
          weekend_mode: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          weight: number;
          target_weekly_loss?: number;
          activity_level?: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
          weekend_mode?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          weight?: number;
          target_weekly_loss?: number;
          activity_level?: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
          weekend_mode?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      weight_entries: {
        Row: {
          id: string;
          user_id: string;
          weight: number;
          date: string;
          source: 'manual' | 'apple_health' | 'google_fit';
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          weight: number;
          date: string;
          source?: 'manual' | 'apple_health' | 'google_fit';
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          weight?: number;
          date?: string;
          source?: 'manual' | 'apple_health' | 'google_fit';
          created_at?: string;
        };
      };
      meal_presets: {
        Row: {
          id: string;
          name: string;
          calories: number;
          protein: number;
          carbs: number;
          fat: number;
          category: 'breakfast' | 'lunch' | 'dinner' | 'snack';
          ingredients: string[];
          is_global: boolean;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          calories: number;
          protein: number;
          carbs: number;
          fat: number;
          category: 'breakfast' | 'lunch' | 'dinner' | 'snack';
          ingredients?: string[];
          is_global?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          calories?: number;
          protein?: number;
          carbs?: number;
          fat?: number;
          category?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
          ingredients?: string[];
          is_global?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      workout_presets: {
        Row: {
          id: string;
          name: string;
          duration: number;
          estimated_calories: number;
          category: 'cardio' | 'strength' | 'flexibility' | 'mixed';
          description: string | null;
          is_global: boolean;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          duration: number;
          estimated_calories: number;
          category: 'cardio' | 'strength' | 'flexibility' | 'mixed';
          description?: string | null;
          is_global?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          duration?: number;
          estimated_calories?: number;
          category?: 'cardio' | 'strength' | 'flexibility' | 'mixed';
          description?: string | null;
          is_global?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      week_sprints: {
        Row: {
          id: string;
          user_id: string;
          start_date: string;
          end_date: string;
          target_weight_loss: number;
          actual_weight_loss: number;
          status: 'active' | 'completed' | 'extended' | 'cancelled';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          start_date: string;
          end_date: string;
          target_weight_loss: number;
          actual_weight_loss?: number;
          status?: 'active' | 'completed' | 'extended' | 'cancelled';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          start_date?: string;
          end_date?: string;
          target_weight_loss?: number;
          actual_weight_loss?: number;
          status?: 'active' | 'completed' | 'extended' | 'cancelled';
          created_at?: string;
          updated_at?: string;
        };
      };
      day_entries: {
        Row: {
          id: string;
          user_id: string;
          sprint_id: string | null;
          date: string;
          weight: number | null;
          calories_target: number;
          calories_consumed: number;
          calories_burned: number;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          sprint_id?: string | null;
          date: string;
          weight?: number | null;
          calories_target: number;
          calories_consumed?: number;
          calories_burned?: number;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          sprint_id?: string | null;
          date?: string;
          weight?: number | null;
          calories_target?: number;
          calories_consumed?: number;
          calories_burned?: number;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      consumed_meals: {
        Row: {
          id: string;
          day_entry_id: string;
          preset_id: string;
          consumed_at: string;
          multiplier: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          day_entry_id: string;
          preset_id: string;
          consumed_at?: string;
          multiplier?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          day_entry_id?: string;
          preset_id?: string;
          consumed_at?: string;
          multiplier?: number;
          created_at?: string;
        };
      };
      completed_workouts: {
        Row: {
          id: string;
          day_entry_id: string;
          preset_id: string;
          completed_at: string;
          duration: number;
          calories_burned: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          day_entry_id: string;
          preset_id: string;
          completed_at?: string;
          duration: number;
          calories_burned: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          day_entry_id?: string;
          preset_id?: string;
          completed_at?: string;
          duration?: number;
          calories_burned?: number;
          created_at?: string;
        };
      };
      ai_plans: {
        Row: {
          id: string;
          sprint_id: string;
          daily_calorie_targets: number[];
          recommended_meals: any;
          recommended_workouts: any;
          tips: string[];
          prompt: string;
          generated_at: string;
        };
        Insert: {
          id?: string;
          sprint_id: string;
          daily_calorie_targets: number[];
          recommended_meals: any;
          recommended_workouts: any;
          tips: string[];
          prompt: string;
          generated_at?: string;
        };
        Update: {
          id?: string;
          sprint_id?: string;
          daily_calorie_targets?: number[];
          recommended_meals?: any;
          recommended_workouts?: any;
          tips?: string[];
          prompt?: string;
          generated_at?: string;
        };
      };
      health_data: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          steps: number;
          calories_burned: number;
          workouts: any;
          weight: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          date: string;
          steps?: number;
          calories_burned?: number;
          workouts?: any;
          weight?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          date?: string;
          steps?: number;
          calories_burned?: number;
          workouts?: any;
          weight?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}
