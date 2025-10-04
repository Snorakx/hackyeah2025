import { Router } from 'express';
import { body, query, validationResult } from 'express-validator';
import { supabase } from '../lib/supabase';
import { AuthenticatedRequest } from "../middleware/auth";
import { createError } from '../middleware/errorHandler';

const router = Router();

// Get workout presets (global + user's own)
router.get('/', [
  query('category').optional().isIn(['cardio', 'strength', 'flexibility', 'mixed']),
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

    const { category, limit = 50 } = req.query;

    let query = supabase
      .from('workout_presets')
      .select('*')
      .or(`is_global.eq.true,created_by.eq.${req.user.id}`)
      .order('name', { ascending: true })
      .limit(Number(limit));

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;

    if (error) {
      throw createError('Failed to fetch workout presets', 500);
    }

    res.json({ presets: data });
  } catch (error) {
    next(error);
  }
});

// Create workout preset
router.post('/', [
  body('name').isLength({ min: 1, max: 100 }),
  body('duration').isInt({ min: 1, max: 480 }),
  body('estimated_calories').isInt({ min: 0, max: 2000 }),
  body('category').isIn(['cardio', 'strength', 'flexibility', 'mixed']),
  body('description').optional().isLength({ max: 500 })
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

    const { name, duration, estimated_calories, category, description } = req.body;

    const { data, error } = await supabase
      .from('workout_presets')
      .insert({
        name,
        duration,
        estimated_calories,
        category,
        description,
        is_global: false,
        created_by: req.user.id
      })
      .select()
      .single();

    if (error) {
      throw createError('Failed to create workout preset', 500);
    }

    res.status(201).json({ preset: data });
  } catch (error) {
    next(error);
  }
});

// Update workout preset (only user's own)
router.put('/:id', [
  body('name').optional().isLength({ min: 1, max: 100 }),
  body('duration').optional().isInt({ min: 1, max: 480 }),
  body('estimated_calories').optional().isInt({ min: 0, max: 2000 }),
  body('category').optional().isIn(['cardio', 'strength', 'flexibility', 'mixed']),
  body('description').optional().isLength({ max: 500 })
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
      .from('workout_presets')
      .update(updateData)
      .eq('id', id)
      .eq('created_by', req.user.id)
      .eq('is_global', false)
      .select()
      .single();

    if (error) {
      throw createError('Failed to update workout preset', 500);
    }

    res.json({ preset: data });
  } catch (error) {
    next(error);
  }
});

// Delete workout preset (only user's own)
router.delete('/:id', async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!req.user) {
      throw createError('User not authenticated', 401);
    }

    const { id } = req.params;

    const { error } = await supabase
      .from('workout_presets')
      .delete()
      .eq('id', id)
      .eq('created_by', req.user.id)
      .eq('is_global', false);

    if (error) {
      throw createError('Failed to delete workout preset', 500);
    }

    res.json({ message: 'Workout preset deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
