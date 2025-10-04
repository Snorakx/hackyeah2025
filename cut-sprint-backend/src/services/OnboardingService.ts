import { supabase } from '../lib/supabase';
import { OnboardingData, OnboardingCompleteResult } from '../types';

export class OnboardingService {
  /**
   * Ensure user exists in public.users table
   */
  private async ensureUserExists(userId: string, email: string): Promise<void> {
    try {
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('id', userId)
        .single();

      if (!existingUser) {
        // Create user record
        await supabase
          .from('users')
          .insert({
            id: userId,
            email: email,
            weight: 70, // default values
            height: 170,
            age: 25,
            gender: 'other',
            target_weekly_loss: 0.5,
            activity_level: 'moderate',
            weekend_mode: 'inactive',
            weekend_start_day: 5,
            weekend_end_day: 0,
            sleep_hours: 8,
            notification_preferences: {
              daily_reminder: true,
              weight_reminder: true,
              meal_suggestions: true
            },
            onboarding_completed: false
          });
      }
    } catch (error) {
      console.error('Error ensuring user exists:', error);
      throw error;
    }
  }

  /**
   * Map frontend region codes to database region codes
   */
  private mapRegionCode(frontendRegion: string): string {
    const regionMapping: { [key: string]: string } = {
      'EN': 'GB',  // English -> Great Britain
      'PL': 'PL',  // Polish -> Poland
      'DE': 'DE',  // German -> Germany
      'FR': 'FR',  // French -> France
      'IT': 'IT',  // Italian -> Italy
      'ES': 'ES',  // Spanish -> Spain
      'SV': 'SV',  // Swedish -> Sweden
      'NO': 'NO',  // Norwegian -> Norway
      'DA': 'DA',  // Danish -> Denmark
      'FI': 'FI'   // Finnish -> Finland
    };
    
    return regionMapping[frontendRegion] || 'PL'; // Default to Poland if not found
  }

  /**
   * Save onboarding data for user
   */
  async saveOnboardingData(data: Partial<OnboardingData>): Promise<OnboardingData> {
    // Ensure user exists first
    await this.ensureUserExists(data.user_id!, data.email || '');
    
    // Map the region code to the database format
    const mappedRegion = data.region ? this.mapRegionCode(data.region) : 'PL';
    
    const { data: result, error } = await supabase
      .from('user_onboarding')
      .upsert({
        user_id: data.user_id,
        units: data.units,
        weighing_frequency: data.weighing_frequency,
        weighing_day_of_week: data.weighing_day_of_week,
        meals_per_day: data.meals_per_day,
        diet_preferences: data.diet_preferences,
        allergies: data.allergies,
        goal: data.goal,
        goal_intensity: data.goal_intensity,
        region: mappedRegion,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Onboarding upsert failed: ${error.message}`);
    }

    return result as OnboardingData;
  }

  /**
   * Get onboarding data for user
   */
  async getOnboardingData(userId: string): Promise<OnboardingData | null> {
    try {
      const { data, error } = await supabase
        .from('user_onboarding')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      return data as OnboardingData;
    } catch (error) {
      console.error('Error getting onboarding data:', error);
      return null;
    }
  }

  /**
   * Complete onboarding and create initial sprint
   */
  async completeOnboarding(userId: string): Promise<OnboardingCompleteResult | null> {
    try {
      console.log('=== Starting onboarding completion for user:', userId);
      
      // Get user data
      console.log('1. Getting user data from users table...');
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (userError) {
        console.error('❌ Error getting user data:', userError);
        throw userError;
      }
      
      console.log('✅ User data retrieved:', user);

      // Get onboarding data
      console.log('2. Getting onboarding data...');
      const onboardingData = await this.getOnboardingData(userId);
      if (!onboardingData) {
        console.error('❌ Onboarding data not found for user:', userId);
        throw new Error('Onboarding data not found');
      }
      
      console.log('✅ Onboarding data retrieved:', onboardingData);

      // Calculate initial nutrition targets
      console.log('3. Calculating nutrition targets...');
      const nutritionTargets = this.calculateInitialTargets(user, onboardingData);
      console.log('✅ Nutrition targets calculated:', nutritionTargets);

      // Create initial weekly budget/sprint
      console.log('4. Creating weekly budget...');
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 7);

      const budgetData = {
        user_id: userId,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        target_calories: nutritionTargets.calories,
        target_protein: nutritionTargets.protein,
        target_fat: nutritionTargets.fat,
        target_carbs: nutritionTargets.carbs,
        weekend_bonus_calories: 0,
        status: 'active'
      };
      
      console.log('📊 Budget data to insert:', budgetData);

      const { data: weeklyBudget, error: budgetError } = await supabase
        .from('weekly_budgets')
        .insert(budgetData)
        .select()
        .single();

      if (budgetError) {
        console.error('❌ Error creating weekly budget:', budgetError);
        throw budgetError;
      }
      
      console.log('✅ Weekly budget created:', weeklyBudget);

      // Mark onboarding as completed and update region
      console.log('5. Marking onboarding as completed and updating region...');
      const mappedRegion = onboardingData.region ? this.mapRegionCode(onboardingData.region) : 'PL';
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          onboarding_completed: true,
          region: mappedRegion
        })
        .eq('id', userId);

      if (updateError) {
        console.error('❌ Error updating user onboarding status:', updateError);
        throw updateError;
      }
      
      console.log('✅ User onboarding status updated to completed');

      const result = {
        weekly_budget: weeklyBudget,
        nutrition_targets: nutritionTargets,
        onboarding_data: onboardingData
      };
      
      console.log('🎉 Onboarding completion successful! Result:', result);
      return result;
    } catch (error) {
      console.error('💥 Error completing onboarding:', error);
      throw error; // Re-throw to get detailed error in route
    }
  }

  /**
   * Calculate initial nutrition targets based on user data and onboarding preferences
   */
  private calculateInitialTargets(user: any, onboarding: OnboardingData) {
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
    } as any;

    const tdee = bmr * activityMultipliers[user.activity_level || 'moderate'];

    // Apply goal adjustment
    let targetCalories = tdee;
    if (onboarding.goal === 'weight_loss') {
      const deficit = onboarding.goal_intensity === 'aggressive' ? 500 : 
                     onboarding.goal_intensity === 'moderate' ? 300 : 200;
      targetCalories = Math.max(tdee - deficit, 1200); // Minimum safe calories
    } else if (onboarding.goal === 'muscle_gain') {
      const surplus = onboarding.goal_intensity === 'aggressive' ? 300 : 
                     onboarding.goal_intensity === 'moderate' ? 200 : 100;
      targetCalories = tdee + surplus;
    }

    // Calculate macros
    const protein = user.weight * 2.0; // 2g per kg
    const fat = Math.max(user.weight * 0.8, 50); // 0.8g per kg, min 50g
    const carbs = (targetCalories - protein * 4 - fat * 9) / 4;

    return {
      calories: Math.round(targetCalories),
      protein: Math.round(protein),
      fat: Math.round(fat),
      carbs: Math.round(carbs)
    };
  }
}
