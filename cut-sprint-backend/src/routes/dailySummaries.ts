import express, { Request, Response } from 'express';
import { query, validationResult } from 'express-validator';
import { supabase } from '../lib/supabase';
import { AuthenticatedRequest } from "../middleware/auth";

const router = express.Router();

/**
 * @route GET /api/daily-summaries
 * @desc Get daily summaries
 * @access Private
 */
router.get('/', [
  query('start_date').optional().isISO8601(),
  query('end_date').optional().isISO8601(),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('offset').optional().isInt({ min: 0 })
], async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    let query = supabase
      .from('daily_summaries')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    // Apply filters
    if (req.query.start_date) {
      query = query.gte('date', req.query.start_date as string);
    }
    if (req.query.end_date) {
      query = query.lte('date', req.query.end_date as string);
    }

    // Apply pagination
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 30;
    const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
    query = query.range(offset, offset + limit - 1);

    const { data, error } = await query;

    if (error) throw error;

    res.json({
      success: true,
      data: data || [],
      pagination: {
        limit,
        offset,
        total: data?.length || 0
      }
    });
  } catch (error) {
    console.error('Error getting daily summaries:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * @route GET /api/daily-summaries/:date
 * @desc Get daily summary by date
 * @access Private
 */
router.get('/:date', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const date = req.params.date;
    const { data, error } = await supabase
      .from('daily_summaries')
      .select('*')
      .eq('user_id', userId)
      .eq('date', date)
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({
        success: false,
        error: 'Daily summary not found'
      });
    }

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error getting daily summary:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * @route POST /api/daily-summaries/:date/calculate
 * @desc Manually calculate daily summary for a specific date
 * @access Private
 */
router.post('/:date/calculate', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const date = req.params.date;

    // Call the database function to calculate daily summary
    const { data, error } = await supabase
      .rpc('calculate_daily_summary', {
        p_user_id: userId,
        p_date: date
      });

    if (error) throw error;

    res.json({
      success: true,
      data,
      message: 'Daily summary calculated successfully'
    });
  } catch (error) {
    console.error('Error calculating daily summary:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * @route GET /api/daily-summaries/week/:weekStart
 * @desc Get weekly summary
 * @access Private
 */
router.get('/week/:weekStart', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const weekStart = req.params.weekStart;
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    const weekEndStr = weekEnd.toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('daily_summaries')
      .select('*')
      .eq('user_id', userId)
      .gte('date', weekStart)
      .lte('date', weekEndStr)
      .order('date', { ascending: true });

    if (error) throw error;

    // Calculate weekly totals
    const weeklyTotals = {
      total_calories: 0,
      total_protein: 0,
      total_fat: 0,
      total_carbs: 0,
      total_calories_burned: 0,
      total_steps: 0,
      total_weight: 0,
      days_counted: 0
    };

    data?.forEach(summary => {
      weeklyTotals.total_calories += summary.total_calories || 0;
      weeklyTotals.total_protein += summary.total_protein || 0;
      weeklyTotals.total_fat += summary.total_fat || 0;
      weeklyTotals.total_carbs += summary.total_carbs || 0;
      weeklyTotals.total_calories_burned += summary.calories_burned || 0;
      weeklyTotals.total_steps += summary.steps || 0;
      if (summary.weight) {
        weeklyTotals.total_weight += summary.weight;
        weeklyTotals.days_counted++;
      }
    });

    // Calculate averages
    const averages = {
      avg_calories: weeklyTotals.total_calories / 7,
      avg_protein: weeklyTotals.total_protein / 7,
      avg_fat: weeklyTotals.total_fat / 7,
      avg_carbs: weeklyTotals.total_carbs / 7,
      avg_calories_burned: weeklyTotals.total_calories_burned / 7,
      avg_steps: weeklyTotals.total_steps / 7,
      avg_weight: weeklyTotals.days_counted > 0 ? weeklyTotals.total_weight / weeklyTotals.days_counted : null
    };

    res.json({
      success: true,
      data: {
        daily_summaries: data || [],
        weekly_totals: weeklyTotals,
        weekly_averages: averages
      }
    });
  } catch (error) {
    console.error('Error getting weekly summary:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * @route GET /api/daily-summaries/analytics/trends
 * @desc Get nutrition and activity trends
 * @access Private
 */
router.get('/analytics/trends', [
  query('days').optional().isInt({ min: 7, max: 90 })
], async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const days = req.query.days ? parseInt(req.query.days as string) : 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('daily_summaries')
      .select('*')
      .eq('user_id', userId)
      .gte('date', startDateStr)
      .order('date', { ascending: true });

    if (error) throw error;

    // Calculate trends
    const trends = {
      calories_trend: calculateTrend(data?.map(d => d.total_calories) || []),
      protein_trend: calculateTrend(data?.map(d => d.total_protein) || []),
      fat_trend: calculateTrend(data?.map(d => d.total_fat) || []),
      carbs_trend: calculateTrend(data?.map(d => d.total_carbs) || []),
      activity_trend: calculateTrend(data?.map(d => d.calories_burned) || []),
      weight_trend: calculateTrend(data?.map(d => d.weight).filter(w => w !== null) || [])
    };

    res.json({
      success: true,
      data: {
        summaries: data || [],
        trends
      }
    });
  } catch (error) {
    console.error('Error getting trends:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * @route GET /api/daily-summaries/analytics/insights
 * @desc Get insights and recommendations
 * @access Private
 */
router.get('/analytics/insights', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    // Get last 7 days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);
    const startDateStr = startDate.toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('daily_summaries')
      .select('*')
      .eq('user_id', userId)
      .gte('date', startDateStr)
      .order('date', { ascending: true });

    if (error) throw error;

    if (!data || data.length === 0) {
      return res.json({
        success: true,
        data: {
          insights: [],
          recommendations: []
        }
      });
    }

    // Calculate insights
    const insights: any[] = [];
    const recommendations: string[] = [];

    // Average daily calories
    const avgCalories = data.reduce((sum, d) => sum + (d.total_calories || 0), 0) / data.length;
    insights.push({
      type: 'calories',
      value: avgCalories,
      label: 'Średnie dzienne kalorie',
      status: avgCalories > 2000 ? 'high' : avgCalories < 1200 ? 'low' : 'normal'
    });

    // Protein consistency
    const avgProtein = data.reduce((sum, d) => sum + (d.total_protein || 0), 0) / data.length;
    insights.push({
      type: 'protein',
      value: avgProtein,
      label: 'Średnie dzienne białko (g)',
      status: avgProtein > 120 ? 'high' : avgProtein < 60 ? 'low' : 'normal'
    });

    // Activity level
    const avgActivity = data.reduce((sum, d) => sum + (d.calories_burned || 0), 0) / data.length;
    insights.push({
      type: 'activity',
      value: avgActivity,
      label: 'Średnie dzienne spalone kalorie',
      status: avgActivity > 500 ? 'high' : avgActivity < 200 ? 'low' : 'normal'
    });

    // Weight trend
    const weights = data.map(d => d.weight).filter(w => w !== null);
    if (weights.length > 1) {
      const weightChange = weights[weights.length - 1] - weights[0];
      insights.push({
        type: 'weight',
        value: weightChange,
        label: 'Zmiana wagi (kg)',
        status: weightChange > 0 ? 'gain' : weightChange < 0 ? 'loss' : 'stable'
      });
    }

    // Generate recommendations
    if (avgCalories < 1200) {
      recommendations.push('Rozważ zwiększenie dziennego spożycia kalorii');
    }
    if (avgProtein < 60) {
      recommendations.push('Zwiększ spożycie białka - dodaj więcej mięsa, ryb lub roślin strączkowych');
    }
    if (avgActivity < 200) {
      recommendations.push('Spróbuj zwiększyć aktywność fizyczną - nawet krótki spacer pomoże');
    }

    res.json({
      success: true,
      data: {
        insights,
        recommendations
      }
    });
  } catch (error) {
    console.error('Error getting insights:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * Helper function to calculate trend
 */
function calculateTrend(values: number[]): 'increasing' | 'decreasing' | 'stable' {
  if (values.length < 2) return 'stable';
  
  const firstHalf = values.slice(0, Math.floor(values.length / 2));
  const secondHalf = values.slice(Math.floor(values.length / 2));
  
  const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;
  
  const change = secondAvg - firstAvg;
  const threshold = firstAvg * 0.05; // 5% threshold
  
  if (change > threshold) return 'increasing';
  if (change < -threshold) return 'decreasing';
  return 'stable';
}

export default router;
