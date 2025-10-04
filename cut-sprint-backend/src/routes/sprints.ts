import { Router } from 'express';
import { body, query, validationResult } from 'express-validator';
import { supabase } from '../lib/supabase';
import { AuthenticatedRequest } from "../middleware/auth";
import { createError } from '../middleware/errorHandler';

const router = Router();

// Get user's sprints
router.get('/', [
  query('status').optional().isIn(['active', 'completed', 'extended', 'cancelled']),
  query('limit').optional().isInt({ min: 1, max: 50 })
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

    const { status, limit = 20 } = req.query;

    let query = supabase
      .from('week_sprints')
      .select('*')
      .eq('user_id', req.user.id)
      .order('start_date', { ascending: false })
      .limit(Number(limit));

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      throw createError('Failed to fetch sprints', 500);
    }

    res.json({ sprints: data });
  } catch (error) {
    next(error);
  }
});

// Get specific sprint
router.get('/:id', async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!req.user) {
      throw createError('User not authenticated', 401);
    }

    const { id } = req.params;

    const { data, error } = await supabase
      .from('week_sprints')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.user.id)
      .single();

    if (error) {
      throw createError('Sprint not found', 404);
    }

    res.json({ sprint: data });
  } catch (error) {
    next(error);
  }
});

// Create new sprint
router.post('/', [
  body('start_date').isISO8601(),
  body('end_date').isISO8601(),
  body('target_weight_loss').isFloat({ min: 0.1, max: 5.0 })
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

    const { start_date, end_date, target_weight_loss } = req.body;

    // Check if dates are valid
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    
    if (startDate >= endDate) {
      return res.status(400).json({
        error: 'Invalid Date Range',
        message: 'End date must be after start date'
      });
    }

    // Check if there's already an active sprint
    const { data: activeSprint } = await supabase
      .from('week_sprints')
      .select('id')
      .eq('user_id', req.user.id)
      .eq('status', 'active')
      .single();

    if (activeSprint) {
      return res.status(400).json({
        error: 'Active Sprint Exists',
        message: 'You already have an active sprint'
      });
    }

    const { data, error } = await supabase
      .from('week_sprints')
      .insert({
        user_id: req.user.id,
        start_date,
        end_date,
        target_weight_loss,
        status: 'active'
      })
      .select()
      .single();

    if (error) {
      throw createError('Failed to create sprint', 500);
    }

    res.status(201).json({ sprint: data });
  } catch (error) {
    next(error);
  }
});

// Update sprint
router.put('/:id', [
  body('status').optional().isIn(['active', 'completed', 'extended', 'cancelled']),
  body('actual_weight_loss').optional().isFloat({ min: 0, max: 10 }),
  body('end_date').optional().isISO8601()
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

    const { id } = req.params;
    const updateData = req.body;

    const { data, error } = await supabase
      .from('week_sprints')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (error) {
      throw createError('Failed to update sprint', 500);
    }

    res.json({ sprint: data });
  } catch (error) {
    next(error);
  }
});

// Delete sprint
router.delete('/:id', async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!req.user) {
      throw createError('User not authenticated', 401);
    }

    const { id } = req.params;

    // Check if sprint exists and belongs to user
    const { data: sprint } = await supabase
      .from('week_sprints')
      .select('id, status')
      .eq('id', id)
      .eq('user_id', req.user.id)
      .single();

    if (!sprint) {
      throw createError('Sprint not found', 404);
    }

    // Only allow deletion of cancelled or completed sprints
    if (sprint.status === 'active') {
      return res.status(400).json({
        error: 'Cannot Delete Active Sprint',
        message: 'Please cancel the sprint before deleting'
      });
    }

    const { error } = await supabase
      .from('week_sprints')
      .delete()
      .eq('id', id)
      .eq('user_id', req.user.id);

    if (error) {
      throw createError('Failed to delete sprint', 500);
    }

    res.json({ message: 'Sprint deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// Get sprint statistics
router.get('/:id/stats', async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!req.user) {
      throw createError('User not authenticated', 401);
    }

    const { id } = req.params;

    // Get sprint data
    const { data: sprint, error: sprintError } = await supabase
      .from('week_sprints')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.user.id)
      .single();

    if (sprintError) {
      throw createError('Sprint not found', 404);
    }

    // Get day entries for this sprint
    const { data: dayEntries, error: dayError } = await supabase
      .from('day_entries')
      .select('*')
      .eq('sprint_id', id)
      .order('date', { ascending: true });

    if (dayError) {
      throw createError('Failed to fetch day entries', 500);
    }

    // Calculate statistics
    const totalDays = dayEntries?.length || 0;
    const totalCaloriesConsumed = dayEntries?.reduce((sum, day) => sum + (day.calories_consumed || 0), 0) || 0;
    const totalCaloriesBurned = dayEntries?.reduce((sum, day) => sum + (day.calories_burned || 0), 0) || 0;
    const averageCaloriesPerDay = totalDays > 0 ? totalCaloriesConsumed / totalDays : 0;
    const averageBurnedPerDay = totalDays > 0 ? totalCaloriesBurned / totalDays : 0;

    // Get weight entries for sprint period
    const { data: weightEntries } = await supabase
      .from('weight_entries')
      .select('weight, date')
      .eq('user_id', req.user.id)
      .gte('date', sprint.start_date)
      .lte('date', sprint.end_date)
      .order('date', { ascending: true });

    let actualWeightLoss = 0;
    if (weightEntries && weightEntries.length > 1) {
      actualWeightLoss = weightEntries[0].weight - weightEntries[weightEntries.length - 1].weight;
    }

    res.json({
      stats: {
        sprint,
        total_days: totalDays,
        total_calories_consumed: totalCaloriesConsumed,
        total_calories_burned: totalCaloriesBurned,
        average_calories_per_day: averageCaloriesPerDay,
        average_burned_per_day: averageBurnedPerDay,
        actual_weight_loss: actualWeightLoss,
        progress_percentage: sprint.target_weight_loss > 0 ? (actualWeightLoss / sprint.target_weight_loss) * 100 : 0
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
