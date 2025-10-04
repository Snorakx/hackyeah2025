import { Router } from 'express';
import { body, query, validationResult } from 'express-validator';
import { supabase } from '../lib/supabase';
import { AuthenticatedRequest } from "../middleware/auth";
import { createError } from '../middleware/errorHandler';

const router = Router();

// Get health data
router.get('/', [
  query('start_date').optional().isISO8601(),
  query('end_date').optional().isISO8601(),
  query('limit').optional().isInt({ min: 1, max: 100 })
], async (req: AuthenticatedRequest, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        details: errors.array()
      });
    }

    if (!req.user) {
      throw createError('User not authenticated', 401);
    }

    const { start_date, end_date, limit = 30 } = req.query;

    let query = supabase
      .from('health_data')
      .select('*')
      .eq('user_id', req.user.id)
      .order('date', { ascending: false })
      .limit(Number(limit));

    if (start_date) {
      query = query.gte('date', start_date as string);
    }

    if (end_date) {
      query = query.lte('date', end_date as string);
    }

    const { data, error } = await query;

    if (error) {
      throw createError('Failed to fetch health data', 500);
    }

    res.json({ data: data });
  } catch (error) {
    next(error);
  }
});

// Get health data for specific date
router.get('/:date', async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!req.user) {
      throw createError('User not authenticated', 401);
    }

    const { date } = req.params;

    const { data, error } = await supabase
      .from('health_data')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('date', date)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.json({ data: null });
      }
      throw createError('Failed to fetch health data', 500);
    }

    res.json({ data });
  } catch (error) {
    next(error);
  }
});

// Create or update health data
router.post('/', [
  body('date').isISO8601(),
  body('steps').optional().isInt({ min: 0, max: 100000 }),
  body('calories_burned').optional().isInt({ min: 0, max: 5000 }),
  body('workouts').optional().isArray(),
  body('weight').optional().isFloat({ min: 30, max: 300 })
], async (req: AuthenticatedRequest, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        details: errors.array()
      });
    }

    if (!req.user) {
      throw createError('User not authenticated', 401);
    }

    const { date, steps, calories_burned, workouts, weight } = req.body;

    // Check if entry already exists
    const { data: existingEntry } = await supabase
      .from('health_data')
      .select('id')
      .eq('user_id', req.user.id)
      .eq('date', date)
      .single();

    let result;
    if (existingEntry) {
      // Update existing entry
      const updateData: any = {};
      if (steps !== undefined) updateData.steps = steps;
      if (calories_burned !== undefined) updateData.calories_burned = calories_burned;
      if (workouts !== undefined) updateData.workouts = workouts;
      if (weight !== undefined) updateData.weight = weight;

      const { data, error } = await supabase
        .from('health_data')
        .update(updateData)
        .eq('id', existingEntry.id)
        .select()
        .single();

      if (error) {
        throw createError('Failed to update health data', 500);
      }

      result = data;
    } else {
      // Create new entry
      const { data, error } = await supabase
        .from('health_data')
        .insert({
          user_id: req.user.id,
          date,
          steps: steps || 0,
          calories_burned: calories_burned || 0,
          workouts: workouts || [],
          weight
        })
        .select()
        .single();

      if (error) {
        throw createError('Failed to create health data', 500);
      }

      result = data;
    }

    res.json({ data: result });
  } catch (error) {
    next(error);
  }
});

// Delete health data
router.delete('/:date', async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!req.user) {
      throw createError('User not authenticated', 401);
    }

    const { date } = req.params;

    const { error } = await supabase
      .from('health_data')
      .delete()
      .eq('user_id', req.user.id)
      .eq('date', date);

    if (error) {
      throw createError('Failed to delete health data', 500);
    }

    res.json({ message: 'Health data deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// Get health statistics
router.get('/stats/overview', [
  query('start_date').optional().isISO8601(),
  query('end_date').optional().isISO8601()
], async (req: AuthenticatedRequest, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        details: errors.array()
      });
    }

    if (!req.user) {
      throw createError('User not authenticated', 401);
    }

    const { start_date, end_date } = req.query;

    let query = supabase
      .from('health_data')
      .select('steps, calories_burned, weight, date')
      .eq('user_id', req.user.id)
      .order('date', { ascending: true });

    if (start_date) {
      query = query.gte('date', start_date as string);
    }

    if (end_date) {
      query = query.lte('date', end_date as string);
    }

    const { data, error } = await query;

    if (error) {
      throw createError('Failed to fetch health statistics', 500);
    }

    if (!data || data.length === 0) {
      return res.json({
        stats: {
          total_days: 0,
          total_steps: 0,
          total_calories_burned: 0,
          average_steps_per_day: 0,
          average_calories_burned_per_day: 0,
          current_weight: null,
          weight_change: 0,
          most_active_day: null,
          least_active_day: null
        }
      });
    }

    const totalDays = data.length;
    const totalSteps = data.reduce((sum, entry) => sum + (entry.steps || 0), 0);
    const totalCaloriesBurned = data.reduce((sum, entry) => sum + (entry.calories_burned || 0), 0);
    const averageStepsPerDay = totalDays > 0 ? totalSteps / totalDays : 0;
    const averageCaloriesBurnedPerDay = totalDays > 0 ? totalCaloriesBurned / totalDays : 0;

    // Find weight change
    const weightEntries = data.filter(entry => entry.weight !== null);
    let weightChange = 0;
    if (weightEntries.length > 1) {
      weightChange = weightEntries[weightEntries.length - 1].weight! - weightEntries[0].weight!;
    }

    // Find most and least active days
    const stepsByDay = data.map(entry => ({ date: entry.date, steps: entry.steps || 0 }));
    const mostActiveDay = stepsByDay.reduce((max, day) => day.steps > max.steps ? day : max);
    const leastActiveDay = stepsByDay.reduce((min, day) => day.steps < min.steps ? day : min);

    res.json({
      stats: {
        total_days: totalDays,
        total_steps: totalSteps,
        total_calories_burned: totalCaloriesBurned,
        average_steps_per_day: averageStepsPerDay,
        average_calories_burned_per_day: averageCaloriesBurnedPerDay,
        current_weight: weightEntries.length > 0 ? weightEntries[weightEntries.length - 1].weight : null,
        weight_change: weightChange,
        most_active_day: mostActiveDay,
        least_active_day: leastActiveDay
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
