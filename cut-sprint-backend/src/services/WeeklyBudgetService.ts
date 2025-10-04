import { supabase } from '../lib/supabase';
import { WeeklyBudget, CreateWeeklyBudgetRequest, WeeklyProgress } from '../types';
import { UserService } from './UserService';
import { MealService } from './MealService';
import { ActivityService } from './ActivityService';

export class WeeklyBudgetService {
  private userService: UserService;
  private mealService: MealService;
  private activityService: ActivityService;

  constructor() {
    this.userService = new UserService();
    this.mealService = new MealService();
    this.activityService = new ActivityService();
  }

  /**
   * Get weekly budget by ID
   */
  async getWeeklyBudgetById(budgetId: string): Promise<WeeklyBudget | null> {
    try {
      const { data, error } = await supabase
        .from('weekly_budgets')
        .select('*')
        .eq('id', budgetId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting weekly budget:', error);
      return null;
    }
  }

  /**
   * Get current weekly budget for a user
   */
  async getCurrentWeeklyBudget(userId: string): Promise<WeeklyBudget | null> {
    try {
      const today = new Date();
      const startOfWeek = this.getStartOfWeek(today);

      const { data, error } = await supabase
        .from('weekly_budgets')
        .select('*')
        .eq('user_id', userId)
        .eq('start_date', startOfWeek.toISOString().split('T')[0])
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting current weekly budget:', error);
      return null;
    }
  }

  /**
   * Get weekly budgets for a user
   */
  async getWeeklyBudgets(userId: string, limit: number = 10): Promise<WeeklyBudget[]> {
    try {
      const { data, error } = await supabase
        .from('weekly_budgets')
        .select('*')
        .eq('user_id', userId)
        .order('start_date', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting weekly budgets:', error);
      return [];
    }
  }

  /**
   * Create new weekly budget
   */
  async createWeeklyBudget(userId: string, budgetData: CreateWeeklyBudgetRequest): Promise<WeeklyBudget | null> {
    try {
      const budget: Partial<WeeklyBudget> = {
        user_id: userId,
        start_date: budgetData.start_date,
        end_date: budgetData.end_date,
        target_calories: budgetData.target_calories,
        target_protein: budgetData.target_protein,
        target_fat: budgetData.target_fat,
        target_carbs: budgetData.target_carbs,
        weekend_bonus_calories: budgetData.weekend_bonus_calories || 0,
        status: 'active'
      };

      const { data, error } = await supabase
        .from('weekly_budgets')
        .insert(budget)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating weekly budget:', error);
      return null;
    }
  }

  /**
   * Auto-create weekly budget based on user profile
   */
  async autoCreateWeeklyBudget(userId: string, startDate?: string): Promise<WeeklyBudget | null> {
    try {
      const user = await this.userService.getUserById(userId);
      if (!user) return null;

      const startOfWeek = startDate ? new Date(startDate) : this.getStartOfWeek(new Date());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(endOfWeek.getDate() + 6);

      const dailyTarget = await this.userService.calculateDailyNutritionTarget(userId);
      if (!dailyTarget) return null;

      const weeklyTarget = await this.userService.calculateWeeklyNutritionTarget(userId, startOfWeek.toISOString().split('T')[0]);
      if (!weeklyTarget) return null;

      const budgetData: CreateWeeklyBudgetRequest = {
        start_date: startOfWeek.toISOString().split('T')[0],
        end_date: endOfWeek.toISOString().split('T')[0],
        target_calories: weeklyTarget.total_calories,
        target_protein: weeklyTarget.target_protein,
        target_fat: weeklyTarget.target_fat,
        target_carbs: weeklyTarget.target_carbs,
        weekend_bonus_calories: weeklyTarget.weekend_bonus_calories
      };

      return await this.createWeeklyBudget(userId, budgetData);
    } catch (error) {
      console.error('Error auto-creating weekly budget:', error);
      return null;
    }
  }

  /**
   * Update weekly budget
   */
  async updateWeeklyBudget(budgetId: string, budgetData: Partial<CreateWeeklyBudgetRequest>): Promise<WeeklyBudget | null> {
    try {
      const { data, error } = await supabase
        .from('weekly_budgets')
        .update(budgetData)
        .eq('id', budgetId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating weekly budget:', error);
      return null;
    }
  }

  /**
   * Get weekly progress
   */
  async getWeeklyProgress(userId: string, startDate?: string): Promise<WeeklyProgress | null> {
    try {
      const startOfWeek = startDate ? new Date(startDate) : this.getStartOfWeek(new Date());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(endOfWeek.getDate() + 6);

      const startDateStr = startOfWeek.toISOString().split('T')[0];
      const endDateStr = endOfWeek.toISOString().split('T')[0];

      // Get weekly budget
      const budget = await this.getCurrentWeeklyBudget(userId);
      if (!budget) {
        // Auto-create if doesn't exist
        const newBudget = await this.autoCreateWeeklyBudget(userId, startDateStr);
        if (!newBudget) return null;
        return await this.getWeeklyProgress(userId, startDateStr);
      }

      // Get actual consumption
      const weeklyNutrition = await this.mealService.getWeeklyNutritionSummary(userId, startDateStr, endDateStr);
      
      // Get weight data
      const weightService = new (await import('./WeightService')).WeightService();
      const weightChange = await weightService.getWeightChange(userId, startDateStr, endDateStr);

      const actualCalories = weeklyNutrition.calories;
      const deficit = budget.target_calories - actualCalories;
      const progressPercentage = Math.round((actualCalories / budget.target_calories) * 100);

      return {
        week_start: startDateStr,
        week_end: endDateStr,
        target_calories: budget.target_calories,
        actual_calories: actualCalories,
        deficit,
        weight_start: weightChange?.startWeight || 0,
        weight_end: weightChange?.endWeight || 0,
        weight_loss: weightChange?.change || 0,
        target_loss: 0.5, // Default value
        progress_percentage: progressPercentage
      };
    } catch (error) {
      console.error('Error getting weekly progress:', error);
      return null;
    }
  }

  /**
   * Get daily budget breakdown
   */
  async getDailyBudgetBreakdown(userId: string, date: string): Promise<{
    date: string;
    targetCalories: number;
    actualCalories: number;
    remainingCalories: number;
    isWeekend: boolean;
    weekendBonus: number;
  }> {
    try {
      const budget = await this.getCurrentWeeklyBudget(userId);
      if (!budget) {
        return {
          date,
          targetCalories: 0,
          actualCalories: 0,
          remainingCalories: 0,
          isWeekend: false,
          weekendBonus: 0
        };
      }

      const isWeekend = await this.userService.isWeekend(userId, date);
      const weekendBonus = isWeekend ? budget.weekend_bonus_calories : 0;
      
      // Calculate daily target (weekly target / 7 + weekend bonus if applicable)
      const baseDailyTarget = Math.round(budget.target_calories / 7);
      const targetCalories = baseDailyTarget + weekendBonus;

      // Get actual consumption for the day
      const dailyNutrition = await this.mealService.getDailyNutritionSummary(userId, date);
      const actualCalories = dailyNutrition.calories;

      const remainingCalories = targetCalories - actualCalories;

      return {
        date,
        targetCalories,
        actualCalories,
        remainingCalories,
        isWeekend,
        weekendBonus
      };
    } catch (error) {
      console.error('Error getting daily budget breakdown:', error);
      return {
        date,
        targetCalories: 0,
        actualCalories: 0,
        remainingCalories: 0,
        isWeekend: false,
        weekendBonus: 0
      };
    }
  }

  /**
   * Get weekend compensation plan
   */
  async getWeekendCompensationPlan(userId: string, weekendDate: string): Promise<{
    weekendBonus: number;
    compensationDays: { date: string; compensationCalories: number }[];
    totalCompensation: number;
  }> {
    try {
      const budget = await this.getCurrentWeeklyBudget(userId);
      if (!budget || budget.weekend_bonus_calories === 0) {
        return {
          weekendBonus: 0,
          compensationDays: [],
          totalCompensation: 0
        };
      }

      const weekendDay = new Date(weekendDate);
      const dayOfWeek = weekendDay.getDay();
      
      // Find the next 3 weekdays for compensation
      const compensationDays = [];
      let currentDate = new Date(weekendDay);
      let compensationPerDay = Math.round(budget.weekend_bonus_calories / 3);

      for (let i = 0; i < 3; i++) {
        do {
          currentDate.setDate(currentDate.getDate() + 1);
        } while (currentDate.getDay() === 0 || currentDate.getDay() === 6); // Skip weekends

        (compensationDays as any[]).push({
          date: currentDate.toISOString().split('T')[0],
          compensationCalories: compensationPerDay
        });
      }

      return {
        weekendBonus: budget.weekend_bonus_calories,
        compensationDays,
        totalCompensation: budget.weekend_bonus_calories
      };
    } catch (error) {
      console.error('Error getting weekend compensation plan:', error);
      return {
        weekendBonus: 0,
        compensationDays: [],
        totalCompensation: 0
      };
    }
  }

  /**
   * Get weekly budget suggestions
   */
  async getWeeklyBudgetSuggestions(userId: string): Promise<{
    message: string;
    suggestions: string[];
    adjustments: { type: string; value: number; reason: string }[];
  }> {
    try {
      const progress = await this.getWeeklyProgress(userId);
      if (!progress) {
        return {
          message: 'Nie można obliczyć postępów tygodniowych',
          suggestions: [],
          adjustments: []
        };
      }

      const suggestions: string[] = [];
      const adjustments: { type: string; value: number; reason: string }[] = [];

      // Analyze progress and provide suggestions
      if (progress.progress_percentage > 110) {
        suggestions.push('Przekroczyłeś budżet tygodniowy o ponad 10%');
        suggestions.push('Rozważ zwiększenie aktywności w kolejnym tygodniu');
        suggestions.push('Sprawdź weekend mode - może być zbyt wysoki bonus');
      } else if (progress.progress_percentage < 90) {
        suggestions.push('Jesteś znacznie poniżej budżetu tygodniowego');
        suggestions.push('Upewnij się, że jesz wystarczająco kalorii');
        suggestions.push('Sprawdź czy nie masz zbyt niskiego budżetu');
      } else {
        suggestions.push('Świetnie! Jesteś w zakresie budżetu tygodniowego');
      }

      // Weight loss analysis
      if (progress.weight_loss > 0 && progress.target_loss > 0) {
        const lossRatio = progress.weight_loss / progress.target_loss;
        if (lossRatio > 1.5) {
          suggestions.push('Utrata wagi jest szybsza niż planowana');
          adjustments.push({
            type: 'increase_calories',
            value: 200,
            reason: 'Zwiększ dzienne kalorie o 200 kcal'
          });
        } else if (lossRatio < 0.5) {
          suggestions.push('Utrata wagi jest wolniejsza niż planowana');
          adjustments.push({
            type: 'decrease_calories',
            value: 200,
            reason: 'Zmniejsz dzienne kalorie o 200 kcal'
          });
        }
      }

      return {
        message: `Postęp: ${progress.progress_percentage}% budżetu wykorzystane`,
        suggestions,
        adjustments
      };
    } catch (error) {
      console.error('Error getting weekly budget suggestions:', error);
      return {
        message: 'Błąd podczas analizy budżetu tygodniowego',
        suggestions: [],
        adjustments: []
      };
    }
  }

  /**
   * Get start of week (Monday)
   */
  private getStartOfWeek(date: Date): Date {
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);
    return startOfWeek;
  }

  /**
   * Check if weekly budget needs to be created
   */
  async checkAndCreateWeeklyBudget(userId: string): Promise<WeeklyBudget | null> {
    try {
      const currentBudget = await this.getCurrentWeeklyBudget(userId);
      if (currentBudget) {
        return currentBudget;
      }

      // Create new budget for current week
      return await this.autoCreateWeeklyBudget(userId);
    } catch (error) {
      console.error('Error checking and creating weekly budget:', error);
      return null;
    }
  }

  /**
   * Get budget status for the week
   */
  async getBudgetStatus(userId: string): Promise<{
    isOnTrack: boolean;
    remainingDays: number;
    averageRemainingPerDay: number;
    canAffordWeekend: boolean;
  }> {
    try {
      const progress = await this.getWeeklyProgress(userId);
      if (!progress) {
        return {
          isOnTrack: false,
          remainingDays: 0,
          averageRemainingPerDay: 0,
          canAffordWeekend: false
        };
      }

      const today = new Date();
      const endOfWeek = new Date(progress.week_end);
      const remainingDays = Math.ceil((endOfWeek.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      const remainingCalories = progress.target_calories - progress.actual_calories;
      const averageRemainingPerDay = remainingDays > 0 ? Math.round(remainingCalories / remainingDays) : 0;

      const user = await this.userService.getUserById(userId);
      const weekendBonus = user?.weekend_mode === 'active' ? 800 : 0;
      const canAffordWeekend = averageRemainingPerDay >= 1200; // Minimum daily calories

      return {
        isOnTrack: progress.progress_percentage <= 100,
        remainingDays: Math.max(0, remainingDays),
        averageRemainingPerDay,
        canAffordWeekend
      };
    } catch (error) {
      console.error('Error getting budget status:', error);
      return {
        isOnTrack: false,
        remainingDays: 0,
        averageRemainingPerDay: 0,
        canAffordWeekend: false
      };
    }
  }
}
