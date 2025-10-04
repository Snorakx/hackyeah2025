import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { supabase } from '../lib/supabase';
import { AuthenticatedRequest } from '../middleware/auth';

const router = express.Router();

// Get user's favorite meals
router.get('/', [
  query('meal_type').optional().isIn(['breakfast', 'lunch', 'dinner', 'snack'])
], async (req: AuthenticatedRequest, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        details: errors.array()
      });
    }

    const { meal_type } = req.query;
    const userId = req.user!.id;

    const { data, error } = await supabase.rpc('get_favorite_meals', {
      p_user_id: userId,
      p_meal_type: meal_type || null
    });

    if (error) {
      return res.status(500).json({
        error: 'Database Error',
        message: error.message
      });
    }

    res.json({
      success: true,
      data: data || []
    });
  } catch (error) {
    next(error);
  }
});

// Get recent meals (for adding to favorites)
router.get('/recent', [
  query('meal_type').optional().isIn(['breakfast', 'lunch', 'dinner', 'snack']),
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

    const { meal_type, limit = 10 } = req.query;
    const userId = req.user!.id;

    const { data, error } = await supabase.rpc('get_recent_meals', {
      p_user_id: userId,
      p_meal_type: meal_type || null,
      p_limit: parseInt(limit as string)
    });

    if (error) {
      return res.status(500).json({
        error: 'Database Error',
        message: error.message
      });
    }

    res.json({
      success: true,
      data: data || []
    });
  } catch (error) {
    next(error);
  }
});

// Add meal to favorites from daily meal
router.post('/add-from-daily', [
  body('meal_id').isUUID().notEmpty(),
  body('name').isString().isLength({ min: 1, max: 100 }),
  body('meal_type').optional().isIn(['breakfast', 'lunch', 'dinner', 'snack'])
], async (req: AuthenticatedRequest, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        details: errors.array()
      });
    }

    const { meal_id, name, meal_type } = req.body;
    const userId = req.user!.id;

    const { data, error } = await supabase.rpc('add_favorite_from_daily_meal', {
      p_user_id: userId,
      p_meal_id: meal_id,
      p_name: name,
      p_meal_type: meal_type || null
    });

    if (error) {
      return res.status(500).json({
        error: 'Database Error',
        message: error.message
      });
    }

    res.json({
      success: true,
      data: { favorite_meal_id: data }
    });
  } catch (error) {
    next(error);
  }
});

// Add favorite meal to daily meals
router.post('/add-to-daily', [
  body('favorite_meal_id').isUUID().notEmpty(),
  body('meal_date').optional().isISO8601().toDate(),
  body('meal_type').optional().isIn(['breakfast', 'lunch', 'dinner', 'snack'])
], async (req: AuthenticatedRequest, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        details: errors.array()
      });
    }

    const { favorite_meal_id, meal_date, meal_type } = req.body;
    const userId = req.user!.id;

    const { data, error } = await supabase.rpc('add_favorite_to_daily_meal', {
      p_user_id: userId,
      p_favorite_meal_id: favorite_meal_id,
      p_meal_date: meal_date || new Date().toISOString().split('T')[0],
      p_meal_type: meal_type || null
    });

    if (error) {
      return res.status(500).json({
        error: 'Database Error',
        message: error.message
      });
    }

    res.json({
      success: true,
      data: { daily_meal_id: data }
    });
  } catch (error) {
    next(error);
  }
});

// Check for similar meals (smart detection)
router.post('/check-similar', [
  body('meal_id').isUUID().notEmpty(),
  body('similarity_threshold').optional().isFloat({ min: 0, max: 1 })
], async (req: AuthenticatedRequest, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        details: errors.array()
      });
    }

    const { meal_id, similarity_threshold = 0.8 } = req.body;
    const userId = req.user!.id;

    const { data, error } = await supabase.rpc('detect_similar_meals', {
      p_user_id: userId,
      p_meal_id: meal_id,
      p_similarity_threshold: similarity_threshold
    });

    if (error) {
      return res.status(500).json({
        error: 'Database Error',
        message: error.message
      });
    }

    const similarMeals = data || [];
    const shouldSuggest = similarMeals.length >= 3; // 3x rule

    res.json({
      success: true,
      data: {
        similar_meals: similarMeals,
        should_suggest: shouldSuggest,
        suggestion_count: similarMeals.length
      }
    });
  } catch (error) {
    next(error);
  }
});

// Auto-add favorite meal (AI suggested)
router.post('/auto-add', [
  body('meal_id').isUUID().notEmpty(),
  body('name').optional().isString().isLength({ min: 1, max: 100 })
], async (req: AuthenticatedRequest, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        details: errors.array()
      });
    }

    const { meal_id, name } = req.body;
    const userId = req.user!.id;

    const { data, error } = await supabase.rpc('auto_add_favorite_meal', {
      p_user_id: userId,
      p_meal_id: meal_id,
      p_name: name || null
    });

    if (error) {
      return res.status(500).json({
        error: 'Database Error',
        message: error.message
      });
    }

    res.json({
      success: true,
      data: { favorite_meal_id: data }
    });
  } catch (error) {
    next(error);
  }
});

// Update favorite meal
router.put('/:id', [
  param('id').isUUID(),
  body('name').optional().isString().isLength({ min: 1, max: 100 }),
  body('meal_type').optional().isIn(['breakfast', 'lunch', 'dinner', 'snack']),
  body('is_favorite').optional().isBoolean()
], async (req: AuthenticatedRequest, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        details: errors.array()
      });
    }

    const { id } = req.params;
    const { name, meal_type, is_favorite } = req.body;
    const userId = req.user!.id;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (meal_type !== undefined) updateData.meal_type = meal_type;
    if (is_favorite !== undefined) updateData.is_favorite = is_favorite;

    const { data, error } = await supabase
      .from('favorite_meals')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      return res.status(500).json({
        error: 'Database Error',
        message: error.message
      });
    }

    if (!data) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Favorite meal not found'
      });
    }

    res.json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
});

// Delete favorite meal
router.delete('/:id', [
  param('id').isUUID()
], async (req: AuthenticatedRequest, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        details: errors.array()
      });
    }

    const { id } = req.params;
    const userId = req.user!.id;

    const { error } = await supabase
      .from('favorite_meals')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      return res.status(500).json({
        error: 'Database Error',
        message: error.message
      });
    }

    res.json({
      success: true,
      message: 'Favorite meal deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

export default router;
