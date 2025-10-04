import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { supabase } from '../lib/supabase';
import { AuthenticatedRequest } from "../middleware/auth";

const router = express.Router();

/**
 * @route GET /api/favorites
 * @desc Get user favorites
 * @access Private
 */
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const { data, error } = await supabase
      .from('user_favorites')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      data: data || []
    });
  } catch (error) {
    console.error('Error getting user favorites:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * @route GET /api/favorites/:id
 * @desc Get favorite by ID
 * @access Private
 */
router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const favoriteId = req.params.id;
    const { data, error } = await supabase
      .from('user_favorites')
      .select('*')
      .eq('id', favoriteId)
      .eq('user_id', userId)
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({
        success: false,
        error: 'Favorite not found'
      });
    }

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error getting favorite:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * @route POST /api/favorites
 * @desc Create new favorite
 * @access Private
 */
router.post('/', [
  body('name').isString().trim().isLength({ min: 1, max: 255 }),
  body('type').isIn(['product', 'meal', 'template']),
  body('product_id').optional().isUUID(),
  body('meal_data').optional().isObject(),
  body('calories').isInt({ min: 0, max: 5000 }),
  body('protein').isFloat({ min: 0, max: 500 }),
  body('fat').isFloat({ min: 0, max: 500 }),
  body('carbs').isFloat({ min: 0, max: 1000 })
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

    const favorite = {
      user_id: userId,
      name: req.body.name,
      type: req.body.type,
      product_id: req.body.product_id,
      meal_data: req.body.meal_data,
      calories: req.body.calories,
      protein: req.body.protein,
      fat: req.body.fat,
      carbs: req.body.carbs
    };

    const { data, error } = await supabase
      .from('user_favorites')
      .insert(favorite)
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      data,
      message: 'Favorite created successfully'
    });
  } catch (error) {
    console.error('Error creating favorite:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * @route PUT /api/favorites/:id
 * @desc Update favorite
 * @access Private
 */
router.put('/:id', [
  body('name').optional().isString().trim().isLength({ min: 1, max: 255 }),
  body('type').optional().isIn(['product', 'meal', 'template']),
  body('product_id').optional().isUUID(),
  body('meal_data').optional().isObject(),
  body('calories').optional().isInt({ min: 0, max: 5000 }),
  body('protein').optional().isFloat({ min: 0, max: 500 }),
  body('fat').optional().isFloat({ min: 0, max: 500 }),
  body('carbs').optional().isFloat({ min: 0, max: 1000 })
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

    const favoriteId = req.params.id;
    const { data, error } = await supabase
      .from('user_favorites')
      .update(req.body)
      .eq('id', favoriteId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({
        success: false,
        error: 'Favorite not found'
      });
    }

    res.json({
      success: true,
      data,
      message: 'Favorite updated successfully'
    });
  } catch (error) {
    console.error('Error updating favorite:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * @route DELETE /api/favorites/:id
 * @desc Delete favorite
 * @access Private
 */
router.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const favoriteId = req.params.id;
    const { error } = await supabase
      .from('user_favorites')
      .delete()
      .eq('id', favoriteId)
      .eq('user_id', userId);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Favorite deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting favorite:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * @route GET /api/favorites/type/:type
 * @desc Get favorites by type
 * @access Private
 */
router.get('/type/:type', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const type = req.params.type;
    if (!['product', 'meal', 'template'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid favorite type'
      });
    }

    const { data, error } = await supabase
      .from('user_favorites')
      .select('*')
      .eq('user_id', userId)
      .eq('type', type)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      data: data || []
    });
  } catch (error) {
    console.error('Error getting favorites by type:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * @route POST /api/favorites/quick-add
 * @desc Quick add favorite from meal
 * @access Private
 */
router.post('/quick-add', [
  body('mealId').isUUID(),
  body('name').isString().trim().isLength({ min: 1, max: 255 })
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

    const { mealId, name } = req.body;

    // Get meal with items
    const { data: meal, error: mealError } = await supabase
      .from('meals')
      .select(`
        *,
        meal_items (
          *,
          products (*)
        )
      `)
      .eq('id', mealId)
      .eq('user_id', userId)
      .single();

    if (mealError || !meal) {
      return res.status(404).json({
        success: false,
        error: 'Meal not found'
      });
    }

    // Create favorite from meal
    const favorite = {
      user_id: userId,
      name,
      type: 'meal' as const,
      meal_data: {
        items: meal.meal_items.map((item: any) => ({
          product_name: item.products.name,
          quantity: item.quantity_grams
        }))
      },
      calories: meal.total_calories,
      protein: meal.total_protein,
      fat: meal.total_fat,
      carbs: meal.total_carbs
    };

    const { data, error } = await supabase
      .from('user_favorites')
      .insert(favorite)
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      data,
      message: 'Favorite created from meal successfully'
    });
  } catch (error) {
    console.error('Error creating favorite from meal:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * @route POST /api/favorites/duplicate-yesterday
 * @desc Create favorite from yesterday's meals
 * @access Private
 */
router.post('/duplicate-yesterday', [
  body('name').isString().trim().isLength({ min: 1, max: 255 })
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

    const { name } = req.body;

    // Get yesterday's date
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    // Get yesterday's meals
    const { data: meals, error: mealsError } = await supabase
      .from('meals')
      .select(`
        *,
        meal_items (
          *,
          products (*)
        )
      `)
      .eq('user_id', userId)
      .eq('date', yesterdayStr);

    if (mealsError) throw mealsError;

    if (!meals || meals.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No meals found for yesterday'
      });
    }

    // Calculate total nutrition
    const totalCalories = meals.reduce((sum, meal) => sum + meal.total_calories, 0);
    const totalProtein = meals.reduce((sum, meal) => sum + meal.total_protein, 0);
    const totalFat = meals.reduce((sum, meal) => sum + meal.total_fat, 0);
    const totalCarbs = meals.reduce((sum, meal) => sum + meal.total_carbs, 0);

    // Create meal data
    const mealData = {
      meals: meals.map(meal => ({
        type: meal.type,
        items: meal.meal_items.map((item: any) => ({
          product_name: item.products.name,
          quantity: item.quantity_grams
        }))
      }))
    };

    // Create favorite
    const favorite = {
      user_id: userId,
      name,
      type: 'template' as const,
      meal_data: mealData,
      calories: totalCalories,
      protein: totalProtein,
      fat: totalFat,
      carbs: totalCarbs
    };

    const { data, error } = await supabase
      .from('user_favorites')
      .insert(favorite)
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      data,
      message: 'Favorite created from yesterday meals successfully'
    });
  } catch (error) {
    console.error('Error creating favorite from yesterday meals:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;
