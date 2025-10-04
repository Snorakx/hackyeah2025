import { supabase } from '../lib/supabase';
import { User, CreateUserRequest, UpdateUserRequest, DailyNutritionTarget, WeeklyNutritionTarget } from '../types';

export class UserService {
  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<User | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  }

  /**
   * Create new user
   */
  async createUser(userData: CreateUserRequest, userId: string): Promise<User | null> {
    try {
      const user: Partial<User> = {
        id: userId,
        email: userData.email,
        display_name: userData.display_name,
        weight: userData.weight,
        height: userData.height,
        age: userData.age,
        gender: userData.gender,
        target_weekly_loss: userData.target_weekly_loss || 0.5,
        activity_level: userData.activity_level || 'moderate',
        weekend_mode: userData.weekend_mode || 'inactive',
        weekend_start_day: userData.weekend_start_day || 5, // Friday
        weekend_end_day: userData.weekend_end_day || 0, // Sunday
        sleep_hours: userData.sleep_hours || 8,
        notification_preferences: userData.notification_preferences || {
          daily_reminder: true,
          weight_reminder: true,
          meal_suggestions: true
        }
      };

      const { data, error } = await supabase
        .from('users')
        .insert(user)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating user:', error);
      return null;
    }
  }

  /**
   * Update user
   */
  async updateUser(userId: string, userData: UpdateUserRequest): Promise<User | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .update(userData)
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating user:', error);
      return null;
    }
  }

  /**
   * Calculate daily nutrition targets based on user profile
   */
  async calculateDailyNutritionTarget(userId: string): Promise<DailyNutritionTarget | null> {
    try {
      const user = await this.getUserById(userId);
      if (!user) return null;

      // Calculate BMR using Mifflin-St Jeor Equation
      let bmr: number;
      if (user.gender === 'male') {
        bmr = 10 * user.weight + 6.25 * user.height - 5 * user.age + 5;
      } else {
        bmr = 10 * user.weight + 6.25 * user.height - 5 * user.age - 161;
      }

      // Apply activity multiplier
      const activityMultipliers = {
        sedentary: 1.2,
        light: 1.375,
        moderate: 1.55,
        active: 1.725,
        very_active: 1.9
      };

      const tdee = bmr * activityMultipliers[user.activity_level];

      // Calculate target calories for weight loss
      const weeklyDeficit = user.target_weekly_loss * 7700; // 7700 kcal = 1kg
      const dailyDeficit = weeklyDeficit / 7;
      const targetCalories = Math.round(tdee - dailyDeficit);

      // Calculate macronutrient targets
      const targetProtein = Math.round(user.weight * 2.2); // 2.2g per kg body weight
      const targetFat = Math.round((targetCalories * 0.25) / 9); // 25% of calories from fat
      const targetCarbs = Math.round((targetCalories - (targetProtein * 4) - (targetFat * 9)) / 4);

      return {
        calories: targetCalories,
        protein: targetProtein,
        fat: targetFat,
        carbs: targetCarbs
      };
    } catch (error) {
      console.error('Error calculating nutrition target:', error);
      return null;
    }
  }

  /**
   * Calculate weekly nutrition targets
   */
  async calculateWeeklyNutritionTarget(userId: string, startDate: string): Promise<WeeklyNutritionTarget | null> {
    try {
      const dailyTarget = await this.calculateDailyNutritionTarget(userId);
      if (!dailyTarget) return null;

      const user = await this.getUserById(userId);
      if (!user) return null;

      const totalCalories = dailyTarget.calories * 7;
      const dailyAverageCalories = dailyTarget.calories;
      const weekendBonusCalories = user.weekend_mode === 'active' ? 800 : 0; // 800 kcal bonus for weekend

      return {
        total_calories: totalCalories + (weekendBonusCalories * 2), // 2 weekend days
        daily_average_calories: dailyAverageCalories,
        target_protein: dailyTarget.protein * 7,
        target_fat: dailyTarget.fat * 7,
        target_carbs: dailyTarget.carbs * 7,
        weekend_bonus_calories: weekendBonusCalories
      };
    } catch (error) {
      console.error('Error calculating weekly nutrition target:', error);
      return null;
    }
  }

  /**
   * Get user's weekend mode configuration
   */
  async getWeekendModeConfig(userId: string): Promise<{
    is_active: boolean;
    start_day: number;
    end_day: number;
    bonus_calories: number;
  } | null> {
    try {
      const user = await this.getUserById(userId);
      if (!user) return null;

      return {
        is_active: user.weekend_mode === 'active',
        start_day: user.weekend_start_day,
        end_day: user.weekend_end_day,
        bonus_calories: user.weekend_mode === 'active' ? 800 : 0
      };
    } catch (error) {
      console.error('Error getting weekend mode config:', error);
      return null;
    }
  }

  /**
   * Check if a given date is a weekend for the user
   */
  async isWeekend(userId: string, date: string): Promise<boolean> {
    try {
      const config = await this.getWeekendModeConfig(userId);
      if (!config || !config.is_active) return false;

      const dayOfWeek = new Date(date).getDay(); // 0 = Sunday, 6 = Saturday
      
      if (config.start_day <= config.end_day) {
        return dayOfWeek >= config.start_day && dayOfWeek <= config.end_day;
      } else {
        // Weekend spans across week boundary (e.g., Friday to Sunday)
        return dayOfWeek >= config.start_day || dayOfWeek <= config.end_day;
      }
    } catch (error) {
      console.error('Error checking if date is weekend:', error);
      return false;
    }
  }

  /**
   * Get user's notification preferences
   */
  async getNotificationPreferences(userId: string): Promise<{
    daily_reminder: boolean;
    weight_reminder: boolean;
    meal_suggestions: boolean;
  } | null> {
    try {
      const user = await this.getUserById(userId);
      if (!user) return null;

      return user.notification_preferences;
    } catch (error) {
      console.error('Error getting notification preferences:', error);
      return null;
    }
  }

  /**
   * Update user's notification preferences
   */
  async updateNotificationPreferences(
    userId: string, 
    preferences: {
      daily_reminder: boolean;
      weight_reminder: boolean;
      meal_suggestions: boolean;
    }
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('users')
        .update({ notification_preferences: preferences })
        .eq('id', userId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      return false;
    }
  }

  /**
   * Get user's current weight
   */
  async getCurrentWeight(userId: string): Promise<number | null> {
    try {
      const user = await this.getUserById(userId);
      return user?.weight || null;
    } catch (error) {
      console.error('Error getting current weight:', error);
      return null;
    }
  }

  /**
   * Update user's current weight
   */
  async updateCurrentWeight(userId: string, weight: number): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('users')
        .update({ weight })
        .eq('id', userId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating current weight:', error);
      return false;
    }
  }
}
