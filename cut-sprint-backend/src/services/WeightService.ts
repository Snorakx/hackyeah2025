import { supabase } from '../lib/supabase';
import { Weight, CreateWeightRequest, WeightTrend } from '../types';

export class WeightService {
  /**
   * Get weight entry by ID
   */
  async getWeightById(weightId: string): Promise<Weight | null> {
    try {
      const { data, error } = await supabase
        .from('weights')
        .select('*')
        .eq('id', weightId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting weight:', error);
      return null;
    }
  }

  /**
   * Get weight entries for a user
   */
  async getWeights(userId: string, limit: number = 30): Promise<Weight[]> {
    try {
      const { data, error } = await supabase
        .from('weights')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting weights:', error);
      return [];
    }
  }

  /**
   * Get weight entries for a date range
   */
  async getWeightsByDateRange(userId: string, startDate: string, endDate: string): Promise<Weight[]> {
    try {
      const { data, error } = await supabase
        .from('weights')
        .select('*')
        .eq('user_id', userId)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting weights by date range:', error);
      return [];
    }
  }

  /**
   * Get latest weight for a user
   */
  async getLatestWeight(userId: string): Promise<Weight | null> {
    try {
      const { data, error } = await supabase
        .from('weights')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting latest weight:', error);
      return null;
    }
  }

  /**
   * Create new weight entry
   */
  async createWeight(userId: string, weightData: CreateWeightRequest): Promise<Weight | null> {
    try {
      const weight: Partial<Weight> = {
        user_id: userId,
        date: weightData.date,
        value_kg: weightData.value_kg,
        note: weightData.note,
        flags: weightData.flags || [],
        source: weightData.source || 'manual'
      };

      const { data, error } = await supabase
        .from('weights')
        .insert(weight)
        .select()
        .single();

      if (error) throw error;

      // Update daily summary
      await this.updateDailySummary(userId, weightData.date);

      return data;
    } catch (error) {
      console.error('Error creating weight:', error);
      return null;
    }
  }

  /**
   * Update weight entry
   */
  async updateWeight(weightId: string, weightData: Partial<CreateWeightRequest>): Promise<Weight | null> {
    try {
      const { data, error } = await supabase
        .from('weights')
        .update(weightData)
        .eq('id', weightId)
        .select()
        .single();

      if (error) throw error;

      // Update daily summary if date is provided
      if (weightData.date) {
        await this.updateDailySummary(data.user_id, weightData.date);
      }

      return data;
    } catch (error) {
      console.error('Error updating weight:', error);
      return null;
    }
  }

  /**
   * Delete weight entry
   */
  async deleteWeight(weightId: string): Promise<boolean> {
    try {
      // Get weight to get user_id and date for daily summary update
      const weight = await this.getWeightById(weightId);
      if (!weight) return false;

      const { error } = await supabase
        .from('weights')
        .delete()
        .eq('id', weightId);

      if (error) throw error;

      // Update daily summary
      await this.updateDailySummary(weight.user_id, weight.date);

      return true;
    } catch (error) {
      console.error('Error deleting weight:', error);
      return false;
    }
  }

  /**
   * Get weight trend analysis
   */
  async getWeightTrend(userId: string, days: number = 30): Promise<WeightTrend[]> {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const weights = await this.getWeightsByDateRange(
        userId,
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      );

      if (weights.length < 2) {
        return [];
      }

      const trends: WeightTrend[] = [];
      let previousWeight = weights[0].value_kg;

      for (let i = 1; i < weights.length; i++) {
        const currentWeight = weights[i].value_kg;
        const change = Math.round((currentWeight - previousWeight) * 100) / 100;
        
        let trend: 'up' | 'down' | 'stable';
        if (change > 0.1) {
          trend = 'up';
        } else if (change < -0.1) {
          trend = 'down';
        } else {
          trend = 'stable';
        }

        trends.push({
          date: weights[i].date,
          weight: currentWeight,
          change,
          trend
        });

        previousWeight = currentWeight;
      }

      return trends;
    } catch (error) {
      console.error('Error getting weight trend:', error);
      return [];
    }
  }

  /**
   * Get 7-day moving average
   */
  async getMovingAverage(userId: string, days: number = 7): Promise<{ date: string; average: number }[]> {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - (days + 10)); // Get extra days for calculation

      const weights = await this.getWeightsByDateRange(
        userId,
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      );

      if (weights.length < days) {
        return [];
      }

      const averages: { date: string; average: number }[] = [];

      for (let i = days - 1; i < weights.length; i++) {
        const window = weights.slice(i - days + 1, i + 1);
        const sum = window.reduce((acc, w) => acc + w.value_kg, 0);
        const average = Math.round((sum / days) * 100) / 100;

        averages.push({
          date: weights[i].date,
          average
        });
      }

      return averages;
    } catch (error) {
      console.error('Error getting moving average:', error);
      return [];
    }
  }

  /**
   * Get weight statistics
   */
  async getWeightStats(userId: string, days: number = 30): Promise<{
    currentWeight: number;
    startWeight: number;
    totalChange: number;
    averageChange: number;
    highestWeight: number;
    lowestWeight: number;
    trend: 'up' | 'down' | 'stable';
  }> {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const weights = await this.getWeightsByDateRange(
        userId,
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      );

      if (weights.length === 0) {
        return {
          currentWeight: 0,
          startWeight: 0,
          totalChange: 0,
          averageChange: 0,
          highestWeight: 0,
          lowestWeight: 0,
          trend: 'stable'
        };
      }

      const currentWeight = weights[weights.length - 1].value_kg;
      const startWeight = weights[0].value_kg;
      const totalChange = Math.round((currentWeight - startWeight) * 100) / 100;
      const averageChange = Math.round((totalChange / days) * 100) / 100;

      const weightValues = weights.map(w => w.value_kg);
      const highestWeight = Math.max(...weightValues);
      const lowestWeight = Math.min(...weightValues);

      let trend: 'up' | 'down' | 'stable';
      if (totalChange > 0.5) {
        trend = 'up';
      } else if (totalChange < -0.5) {
        trend = 'down';
      } else {
        trend = 'stable';
      }

      return {
        currentWeight,
        startWeight,
        totalChange,
        averageChange,
        highestWeight,
        lowestWeight,
        trend
      };
    } catch (error) {
      console.error('Error getting weight stats:', error);
      return {
        currentWeight: 0,
        startWeight: 0,
        totalChange: 0,
        averageChange: 0,
        highestWeight: 0,
        lowestWeight: 0,
        trend: 'stable'
      };
    }
  }

  /**
   * Get weight predictions based on current trend
   */
  async getWeightPredictions(userId: string, weeks: number = 4): Promise<{
    date: string;
    predictedWeight: number;
    confidence: 'high' | 'medium' | 'low';
  }[]> {
    try {
      const stats = await this.getWeightStats(userId, 30);
      const predictions = [];

      if (stats.averageChange === 0) {
        return [];
      }

      const currentDate = new Date();
      const latestWeight = await this.getLatestWeight(userId);
      if (!latestWeight) return [];

      for (let week = 1; week <= weeks; week++) {
        const predictionDate = new Date(currentDate);
        predictionDate.setDate(predictionDate.getDate() + (week * 7));

        const predictedChange = stats.averageChange * (week * 7);
        const predictedWeight = Math.round((latestWeight.value_kg + predictedChange) * 100) / 100;

        let confidence: 'high' | 'medium' | 'low';
        if (week <= 2) {
          confidence = 'high';
        } else if (week <= 3) {
          confidence = 'medium';
        } else {
          confidence = 'low';
        }

        (predictions as any[]).push({
          date: predictionDate.toISOString().split('T')[0],
          predictedWeight,
          confidence
        });
      }

      return predictions;
    } catch (error) {
      console.error('Error getting weight predictions:', error);
      return [];
    }
  }

  /**
   * Get weight entries with flags
   */
  async getWeightsWithFlags(userId: string, flag: string): Promise<Weight[]> {
    try {
      const { data, error } = await supabase
        .from('weights')
        .select('*')
        .eq('user_id', userId)
        .contains('flags', [flag])
        .order('date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting weights with flags:', error);
      return [];
    }
  }

  /**
   * Get weight change between two dates
   */
  async getWeightChange(userId: string, startDate: string, endDate: string): Promise<{
    startWeight: number;
    endWeight: number;
    change: number;
    changePercent: number;
  } | null> {
    try {
      const weights = await this.getWeightsByDateRange(userId, startDate, endDate);
      
      if (weights.length < 2) {
        return null;
      }

      const startWeight = weights[0].value_kg;
      const endWeight = weights[weights.length - 1].value_kg;
      const change = Math.round((endWeight - startWeight) * 100) / 100;
      const changePercent = Math.round((change / startWeight) * 100 * 100) / 100;

      return {
        startWeight,
        endWeight,
        change,
        changePercent
      };
    } catch (error) {
      console.error('Error getting weight change:', error);
      return null;
    }
  }

  /**
   * Check if user should be reminded to weigh in
   */
  async shouldRemindToWeighIn(userId: string): Promise<boolean> {
    try {
      const latestWeight = await this.getLatestWeight(userId);
      if (!latestWeight) return true;

      const lastWeighIn = new Date(latestWeight.date);
      const today = new Date();
      const daysSinceLastWeighIn = Math.floor((today.getTime() - lastWeighIn.getTime()) / (1000 * 60 * 60 * 24));

      // Remind if more than 3 days have passed
      return daysSinceLastWeighIn > 3;
    } catch (error) {
      console.error('Error checking weight reminder:', error);
      return false;
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
}
