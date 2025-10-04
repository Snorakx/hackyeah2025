import { Router } from 'express';
import { body, query, validationResult } from 'express-validator';
import { supabase } from '../lib/supabase';
import { AuthenticatedRequest } from "../middleware/auth";
import { createError } from '../middleware/errorHandler';

const router = Router();

// Get weight entries
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
      .from('weight_entries')
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
      throw createError('Failed to fetch weight entries', 500);
    }

    res.json({ entries: data });
  } catch (error) {
    next(error);
  }
});

// Add weight entry
router.post('/', [
  body('weight').isFloat({ min: 30, max: 300 }),
  body('date').isISO8601(),
  body('source').optional().isIn(['manual', 'apple_health', 'google_fit'])
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

    const { weight, date, source = 'manual' } = req.body;

    const { data, error } = await supabase
      .from('weight_entries')
      .insert({
        user_id: req.user.id,
        weight,
        date,
        source
      })
      .select()
      .single();

    if (error) {
      throw createError('Failed to add weight entry', 500);
    }

    res.status(201).json({ entry: data });
  } catch (error) {
    next(error);
  }
});

// Update weight entry
router.put('/:id', [
  body('weight').isFloat({ min: 30, max: 300 }),
  body('date').isISO8601(),
  body('source').optional().isIn(['manual', 'apple_health', 'google_fit'])
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
    const { weight, date, source } = req.body;

    const { data, error } = await supabase
      .from('weight_entries')
      .update({ weight, date, source })
      .eq('id', id)
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (error) {
      throw createError('Failed to update weight entry', 500);
    }

    res.json({ entry: data });
  } catch (error) {
    next(error);
  }
});

// Delete weight entry
router.delete('/:id', async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!req.user) {
      throw createError('User not authenticated', 401);
    }

    const { id } = req.params;

    const { error } = await supabase
      .from('weight_entries')
      .delete()
      .eq('id', id)
      .eq('user_id', req.user.id);

    if (error) {
      throw createError('Failed to delete weight entry', 500);
    }

    res.json({ message: 'Weight entry deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// Get weight statistics
router.get('/stats', [
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
      .from('weight_entries')
      .select('weight, date')
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
      throw createError('Failed to fetch weight statistics', 500);
    }

    if (!data || data.length === 0) {
      return res.json({
        stats: {
          total_entries: 0,
          current_weight: null,
          starting_weight: null,
          total_loss: 0,
          average_weight: null,
          trend: 'stable'
        }
      });
    }

    const weights = data.map(entry => entry.weight);
    const currentWeight = weights[weights.length - 1];
    const startingWeight = weights[0];
    const totalLoss = startingWeight - currentWeight;
    const averageWeight = weights.reduce((sum, weight) => sum + weight, 0) / weights.length;

    // Calculate trend (simple linear regression)
    let trend = 'stable';
    if (weights.length > 1) {
      const firstHalf = weights.slice(0, Math.floor(weights.length / 2));
      const secondHalf = weights.slice(Math.floor(weights.length / 2));
      const firstAvg = firstHalf.reduce((sum, weight) => sum + weight, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((sum, weight) => sum + weight, 0) / secondHalf.length;
      
      if (secondAvg < firstAvg - 0.5) trend = 'decreasing';
      else if (secondAvg > firstAvg + 0.5) trend = 'increasing';
    }

    res.json({
      stats: {
        total_entries: data.length,
        current_weight: currentWeight,
        starting_weight: startingWeight,
        total_loss: totalLoss,
        average_weight: averageWeight,
        trend
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
