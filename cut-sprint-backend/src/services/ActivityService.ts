import { supabase } from '../lib/supabase';
import { Activity, CreateActivityRequest } from '../types';

export class ActivityService {
  // Predefined activity calorie burn rates (kcal per minute for 70kg person)
  private readonly activityCalorieRates = {
    running: 11.5,      // 8 min/mile pace
    cycling: 8.0,       // 15 mph
    swimming: 9.0,      // moderate pace
    strength: 6.0,      // weight training
    flexibility: 2.5,   // yoga/stretching
    mixed: 7.5          // circuit training
  };

  /**
   * Get activity by ID
   */
  async getActivityById(activityId: string): Promise<Activity | null> {
    try {
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .eq('id', activityId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting activity:', error);
      return null;
    }
  }

  /**
   * Get activities for a user on a specific date
   */
  async getActivitiesByDate(userId: string, date: string): Promise<Activity[]> {
    try {
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .eq('user_id', userId)
        .eq('date', date)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting activities by date:', error);
      return [];
    }
  }

  /**
   * Get activities for a user within a date range
   */
  async getActivitiesByDateRange(userId: string, startDate: string, endDate: string): Promise<Activity[]> {
    try {
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .eq('user_id', userId)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting activities by date range:', error);
      return [];
    }
  }

  /**
   * Create new activity
   */
  async createActivity(userId: string, activityData: CreateActivityRequest): Promise<Activity | null> {
    try {
      // Calculate estimated calories if not provided
      let estimatedCalories = activityData.estimated_calories;
      if (!estimatedCalories) {
        estimatedCalories = this.calculateCaloriesBurned(
          activityData.type,
          activityData.duration_minutes,
          70 // Default weight, should be replaced with user's actual weight
        );
      }

      const activity: Partial<Activity> = {
        user_id: userId,
        date: activityData.date,
        type: activityData.type,
        duration_minutes: activityData.duration_minutes,
        estimated_calories: estimatedCalories,
        notes: activityData.notes
      };

      const { data, error } = await supabase
        .from('activities')
        .insert(activity)
        .select()
        .single();

      if (error) throw error;

      // Update daily summary
      await this.updateDailySummary(userId, activityData.date);

      return data;
    } catch (error) {
      console.error('Error creating activity:', error);
      return null;
    }
  }

  /**
   * Update activity
   */
  async updateActivity(activityId: string, activityData: Partial<CreateActivityRequest>): Promise<Activity | null> {
    try {
      // Recalculate calories if duration or type changed
      if (activityData.duration_minutes || activityData.type) {
        const currentActivity = await this.getActivityById(activityId);
        if (currentActivity) {
          const newDuration = activityData.duration_minutes || currentActivity.duration_minutes;
          const newType = activityData.type || currentActivity.type;
          
          activityData.estimated_calories = this.calculateCaloriesBurned(
            newType,
            newDuration,
            70 // Should use user's actual weight
          );
        }
      }

      const { data, error } = await supabase
        .from('activities')
        .update(activityData)
        .eq('id', activityId)
        .select()
        .single();

      if (error) throw error;

      // Update daily summary if date is provided
      if (activityData.date) {
        await this.updateDailySummary(data.user_id, activityData.date);
      }

      return data;
    } catch (error) {
      console.error('Error updating activity:', error);
      return null;
    }
  }

  /**
   * Delete activity
   */
  async deleteActivity(activityId: string): Promise<boolean> {
    try {
      // Get activity to get user_id and date for daily summary update
      const activity = await this.getActivityById(activityId);
      if (!activity) return false;

      const { error } = await supabase
        .from('activities')
        .delete()
        .eq('id', activityId);

      if (error) throw error;

      // Update daily summary
      await this.updateDailySummary(activity.user_id, activity.date);

      return true;
    } catch (error) {
      console.error('Error deleting activity:', error);
      return false;
    }
  }

  /**
   * Calculate calories burned for an activity
   */
  calculateCaloriesBurned(
    activityType: 'running' | 'cycling' | 'swimming' | 'strength' | 'flexibility' | 'mixed',
    durationMinutes: number,
    userWeight: number
  ): number {
    const baseRate = this.activityCalorieRates[activityType];
    const weightMultiplier = userWeight / 70; // Normalize to 70kg baseline
    return Math.round(baseRate * durationMinutes * weightMultiplier);
  }

  /**
   * Get daily total calories burned
   */
  async getDailyCaloriesBurned(userId: string, date: string): Promise<number> {
    try {
      const activities = await this.getActivitiesByDate(userId, date);
      return activities.reduce((total, activity) => total + activity.estimated_calories, 0);
    } catch (error) {
      console.error('Error getting daily calories burned:', error);
      return 0;
    }
  }

  /**
   * Get weekly total calories burned
   */
  async getWeeklyCaloriesBurned(userId: string, startDate: string, endDate: string): Promise<number> {
    try {
      const activities = await this.getActivitiesByDateRange(userId, startDate, endDate);
      return activities.reduce((total, activity) => total + activity.estimated_calories, 0);
    } catch (error) {
      console.error('Error getting weekly calories burned:', error);
      return 0;
    }
  }

  /**
   * Get activity statistics
   */
  async getActivityStats(userId: string, startDate: string, endDate: string): Promise<{
    totalActivities: number;
    totalDuration: number;
    totalCalories: number;
    averageDuration: number;
    mostFrequentType: string;
    typeBreakdown: Record<string, { count: number; totalDuration: number; totalCalories: number }>;
  }> {
    try {
      const activities = await this.getActivitiesByDateRange(userId, startDate, endDate);
      
      const stats = {
        totalActivities: activities.length,
        totalDuration: activities.reduce((sum, activity) => sum + activity.duration_minutes, 0),
        totalCalories: activities.reduce((sum, activity) => sum + activity.estimated_calories, 0),
        averageDuration: 0,
        mostFrequentType: '',
        typeBreakdown: {} as Record<string, { count: number; totalDuration: number; totalCalories: number }>
      };

      // Calculate type breakdown
      activities.forEach(activity => {
        if (!stats.typeBreakdown[activity.type]) {
          stats.typeBreakdown[activity.type] = { count: 0, totalDuration: 0, totalCalories: 0 };
        }
        stats.typeBreakdown[activity.type].count++;
        stats.typeBreakdown[activity.type].totalDuration += activity.duration_minutes;
        stats.typeBreakdown[activity.type].totalCalories += activity.estimated_calories;
      });

      // Calculate averages and most frequent type
      if (activities.length > 0) {
        stats.averageDuration = Math.round(stats.totalDuration / activities.length);
        stats.mostFrequentType = Object.entries(stats.typeBreakdown)
          .sort(([, a], [, b]) => b.count - a.count)[0][0];
      }

      return stats;
    } catch (error) {
      console.error('Error getting activity stats:', error);
      return {
        totalActivities: 0,
        totalDuration: 0,
        totalCalories: 0,
        averageDuration: 0,
        mostFrequentType: '',
        typeBreakdown: {}
      };
    }
  }

  /**
   * Get recommended activities based on user's goals
   */
  async getRecommendedActivities(userId: string): Promise<{
    type: string;
    duration: number;
    calories: number;
    description: string;
  }[]> {
    try {
      // This would typically use user's goals and preferences
      // For now, return some default recommendations
      return [
        {
          type: 'running',
          duration: 30,
          calories: 345,
          description: '30 minut biegania w umiarkowanym tempie'
        },
        {
          type: 'cycling',
          duration: 45,
          calories: 360,
          description: '45 minut jazdy na rowerze'
        },
        {
          type: 'strength',
          duration: 40,
          calories: 240,
          description: '40 minut treningu siłowego'
        },
        {
          type: 'mixed',
          duration: 35,
          calories: 263,
          description: '35 minut treningu mieszanego'
        }
      ];
    } catch (error) {
      console.error('Error getting recommended activities:', error);
      return [];
    }
  }

  /**
   * Get activity suggestions based on daily calorie goals
   */
  async getActivitySuggestions(
    userId: string,
    date: string,
    targetCalories: number,
    consumedCalories: number
  ): Promise<{
    message: string;
    suggestions: { type: string; duration: number; calories: number; description: string }[];
  }> {
    try {
      const dailyBurned = await this.getDailyCaloriesBurned(userId, date);
      const netCalories = consumedCalories - dailyBurned;
      const deficit = targetCalories - netCalories;

      let message = '';
      let suggestions: { type: string; duration: number; calories: number; description: string }[] = [];

      if (deficit > 300) {
        message = `Potrzebujesz spalić ${deficit} kcal więcej. Oto sugestie:`;
        
        // Calculate how much activity is needed
        const runningTime = Math.ceil(deficit / 11.5); // 11.5 kcal/min for running
        const cyclingTime = Math.ceil(deficit / 8.0);  // 8.0 kcal/min for cycling
        
        suggestions = [
          {
            type: 'running',
            duration: Math.min(runningTime, 60), // Max 60 minutes
            calories: Math.min(deficit, runningTime * 11.5),
            description: `${Math.min(runningTime, 60)} minut biegania`
          },
          {
            type: 'cycling',
            duration: Math.min(cyclingTime, 90), // Max 90 minutes
            calories: Math.min(deficit, cyclingTime * 8.0),
            description: `${Math.min(cyclingTime, 90)} minut jazdy na rowerze`
          }
        ];
      } else if (deficit > 0) {
        message = `Jesteś blisko celu! Dodaj ${deficit} kcal aktywności:`;
        suggestions = [
          {
            type: 'walking',
            duration: Math.ceil(deficit / 4.0), // 4.0 kcal/min for walking
            calories: deficit,
            description: `${Math.ceil(deficit / 4.0)} minut spaceru`
          }
        ];
      } else {
        message = 'Świetnie! Jesteś w deficycie kalorycznym.';
        suggestions = [];
      }

      return { message, suggestions };
    } catch (error) {
      console.error('Error getting activity suggestions:', error);
      return { message: 'Błąd podczas generowania sugestii aktywności', suggestions: [] };
    }
  }

  /**
   * Update daily summary in the database
   */
  private async updateDailySummary(userId: string, date: string): Promise<void> {
    try {
      // Call the database function to calculate daily summary
      const { error } = await supabase.rpc('calculate_daily_summary', {
        user_uuid: userId,
        target_date: date
      });

      if (error) {
        console.error('Error updating daily summary:', error);
      }
    } catch (error) {
      console.error('Error calling calculate_daily_summary:', error);
    }
  }

  /**
   * Get quick activity presets
   */
  getQuickActivityPresets(): {
    type: string;
    duration: number;
    calories: number;
    description: string;
  }[] {
    return [
      {
        type: 'running',
        duration: 20,
        calories: 230,
        description: '20 min biegania'
      },
      {
        type: 'cycling',
        duration: 30,
        calories: 240,
        description: '30 min rower'
      },
      {
        type: 'strength',
        duration: 25,
        calories: 150,
        description: '25 min siłowy'
      },
      {
        type: 'flexibility',
        duration: 20,
        calories: 50,
        description: '20 min rozciąganie'
      },
      {
        type: 'mixed',
        duration: 30,
        calories: 225,
        description: '30 min mieszany'
      }
    ];
  }
}
