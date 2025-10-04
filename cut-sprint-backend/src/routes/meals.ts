import express, { Request, Response, NextFunction } from 'express';
import { body, query, param, validationResult } from 'express-validator';
import { MealService } from '../services/MealService';
import { UserService } from '../services/UserService';
import { AuthenticatedRequest } from "../middleware/auth";

const router = express.Router();
const mealService = new MealService();
const userService = new UserService();

/**
 * Middleware to check AI analysis daily limit
 */
const checkAnalysisLimit = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const canAnalyze = await mealService.checkAnalysisLimit(userId);
    if (!canAnalyze.allowed) {
      return res.status(429).json({
        success: false,
        error: 'Daily limit exceeded',
        data: {
          currentUsage: canAnalyze.currentUsage,
          dailyLimit: canAnalyze.dailyLimit,
          upgradeUrl: 'https://your-domain.pl/upgrade'
        }
      });
    }

    // Add usage info to request for later use
    req.analysisUsage = {
      currentUsage: canAnalyze.currentUsage,
      dailyLimit: canAnalyze.dailyLimit
    };

    next();
  } catch (error) {
    console.error('Error checking analysis limit:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * @route GET /api/meals
 * @desc Get meals with search parameters
 * @access Private
 */
router.get('/', [
  query('date').optional().isISO8601(),
  query('type').optional().isIn(['breakfast', 'lunch', 'dinner', 'snack']),
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

    const searchParams = {
      date: req.query.date as string,
      type: req.query.type as 'breakfast' | 'lunch' | 'dinner' | 'snack',
      limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
      offset: req.query.offset ? parseInt(req.query.offset as string) : 0
    };

    const meals = await mealService.getMeals(userId, searchParams);

    res.json({
      success: true,
      data: meals
    });
  } catch (error) {
    console.error('Error getting meals:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * @route GET /api/meals/date/:date
 * @desc Get meals for a specific date
 * @access Private
 */
router.get('/date/:date', [
  query('date').isISO8601()
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

    const date = req.params.date;
    const meals = await mealService.getMealsByDate(userId, date);

    res.json({
      success: true,
      data: meals
    });
  } catch (error) {
    console.error('Error getting meals by date:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * @route GET /api/meals/:id
 * @desc Get meal by ID with items
 * @access Private
 */
router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const mealId = req.params.id;
    const mealWithItems = await mealService.getMealWithItems(mealId);

    if (!mealWithItems) {
      return res.status(404).json({
        success: false,
        error: 'Meal not found'
      });
    }

    res.json({
      success: true,
      data: mealWithItems
    });
  } catch (error) {
    console.error('Error getting meal:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * @route POST /api/meals
 * @desc Create new meal
 * @access Private
 */
router.post('/', [
  body('date').isISO8601(),
  body('type').isIn(['breakfast', 'lunch', 'dinner', 'snack']),
  body('items').isArray({ min: 1 }),
  body('items.*.product_id').isUUID(),
  body('items.*.quantity_grams').isFloat({ min: 0.1, max: 10000 }),
  body('items.*.quantity_portions').optional().isFloat({ min: 0.1, max: 10 }),
  body('notes').optional().isString().trim()
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

    const meal = await mealService.createMeal(userId, req.body);
    if (!meal) {
      return res.status(500).json({
        success: false,
        error: 'Failed to create meal'
      });
    }

    res.status(201).json({
      success: true,
      data: meal,
      message: 'Meal created successfully'
    });
  } catch (error) {
    console.error('Error creating meal:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * @route PUT /api/meals/:id
 * @desc Update meal
 * @access Private
 */
router.put('/:id', [
  body('date').optional().isISO8601(),
  body('type').optional().isIn(['breakfast', 'lunch', 'dinner', 'snack']),
  body('items').optional().isArray({ min: 1 }),
  body('items.*.product_id').optional().isUUID(),
  body('items.*.quantity_grams').optional().isFloat({ min: 0.1, max: 10000 }),
  body('items.*.quantity_portions').optional().isFloat({ min: 0.1, max: 10 }),
  body('notes').optional().isString().trim()
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

    const mealId = req.params.id;
    const meal = await mealService.updateMeal(mealId, req.body);

    if (!meal) {
      return res.status(404).json({
        success: false,
        error: 'Meal not found'
      });
    }

    res.json({
      success: true,
      data: meal,
      message: 'Meal updated successfully'
    });
  } catch (error) {
    console.error('Error updating meal:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * @route DELETE /api/meals/:id
 * @desc Delete meal
 * @access Private
 */
router.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const mealId = req.params.id;
    const success = await mealService.deleteMeal(mealId);

    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'Meal not found'
      });
    }

    res.json({
      success: true,
      message: 'Meal deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting meal:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * @route GET /api/meals/daily-summary/:date
 * @desc Get daily nutrition summary
 * @access Private
 */
router.get('/daily-summary/:date', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const date = req.params.date;
    const summary = await mealService.getDailyNutritionSummary(userId, date);

    res.json({
      success: true,
      data: summary
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
 * @route GET /api/meals/weekly-summary
 * @desc Get weekly nutrition summary
 * @access Private
 */
router.get('/weekly-summary', [
  query('startDate').isISO8601(),
  query('endDate').isISO8601()
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

    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;
    const summary = await mealService.getWeeklyNutritionSummary(userId, startDate, endDate);

    res.json({
      success: true,
      data: summary
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
 * @route POST /api/meals/duplicate-yesterday
 * @desc Duplicate yesterday's meals to target date
 * @access Private
 */
router.post('/duplicate-yesterday', [
  body('targetDate').isISO8601()
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

    const targetDate = req.body.targetDate;
    const success = await mealService.duplicateYesterdayMeals(userId, targetDate);

    if (!success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to duplicate yesterday meals'
      });
    }

    res.json({
      success: true,
      message: 'Yesterday meals duplicated successfully'
    });
  } catch (error) {
    console.error('Error duplicating yesterday meals:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * @route GET /api/meals/suggestions/:mealType
 * @desc Get meal suggestions based on missing nutrients
 * @access Private
 */
router.get('/suggestions/:mealType', [
  query('date').optional().isISO8601()
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

    const mealType = req.params.mealType as 'breakfast' | 'lunch' | 'dinner' | 'snack';
    const date = req.query.date as string || new Date().toISOString().split('T')[0];

    if (!['breakfast', 'lunch', 'dinner', 'snack'].includes(mealType)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid meal type'
      });
    }

    const suggestions = await mealService.getMealSuggestions(userId, date, mealType);

    res.json({
      success: true,
      data: suggestions
    });
  } catch (error) {
    console.error('Error getting meal suggestions:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * @route GET /api/meals/quick-add
 * @desc Get quick add meal options
 * @access Private
 */
router.get('/quick-add', async (req: AuthenticatedRequest, res: Response) => {
  try {
    // This would return predefined quick meal options
    const quickMeals = [
      {
        id: 'quick-breakfast',
        name: 'Szybkie śniadanie',
        type: 'breakfast',
        items: [
          { product_name: 'Owsianka', quantity: 50 },
          { product_name: 'Banan', quantity: 100 },
          { product_name: 'Mleko 2%', quantity: 200 }
        ],
        calories: 320,
        protein: 12,
        fat: 8,
        carbs: 55
      },
      {
        id: 'quick-lunch',
        name: 'Lunch do pracy',
        type: 'lunch',
        items: [
          { product_name: 'Kurczak pierś', quantity: 150 },
          { product_name: 'Ryż biały', quantity: 100 },
          { product_name: 'Brokuły', quantity: 100 }
        ],
        calories: 350,
        protein: 35,
        fat: 8,
        carbs: 45
      },
      {
        id: 'quick-dinner',
        name: 'Kolacja na szybko',
        type: 'dinner',
        items: [
          { product_name: 'Twaróg półtłusty', quantity: 200 },
          { product_name: 'Chleb żytni', quantity: 50 },
          { product_name: 'Pomidor', quantity: 100 }
        ],
        calories: 280,
        protein: 25,
        fat: 8,
        carbs: 35
      }
    ];

    res.json({
      success: true,
      data: quickMeals
    });
  } catch (error) {
    console.error('Error getting quick add options:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * @route POST /api/meals/analyze
 * @desc Save LLM meal analysis
 * @access Private
 */
router.post('/analyze', [
  body('input').isString().isLength({ min: 1, max: 1000 }),
  body('analysis').isObject(),
  body('date').optional().isISO8601()
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

    const { input, analysis, date } = req.body;
    const mealDate = date || new Date().toISOString().split('T')[0];

    // Save analysis to database
    const savedAnalysis = await mealService.saveMealAnalysis({
      userId,
      input,
      analysis,
      date: mealDate,
      createdAt: new Date()
    });

    res.status(201).json({
      success: true,
      data: savedAnalysis
    });
  } catch (error) {
    console.error('Error saving meal analysis:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * @route POST /api/meals/save
 * @desc Save meal from analysis to daily meals
 * @access Private
 */
router.post('/save', [
  body('name').isString().isLength({ min: 1, max: 100 }),
  body('mealType').isIn(['breakfast', 'lunch', 'dinner', 'snack']),
  body('calories').isFloat({ min: 0 }),
  body('protein').isFloat({ min: 0 }),
  body('carbs').isFloat({ min: 0 }),
  body('fat').isFloat({ min: 0 }),
  body('input_text').isString().isLength({ min: 1, max: 1000 }),
  body('date').optional().isISO8601()
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

    const { name, mealType, calories, protein, carbs, fat, input_text, date } = req.body;
    const mealDate = date || new Date().toISOString().split('T')[0];
    
    const savedMeal = await mealService.saveMealFromAnalysis({
      userId,
      name,
      mealType,
      calories,
      protein,
      carbs,
      fat,
      input_text,
      date: mealDate
    });

    res.status(201).json({ success: true, data: savedMeal });
  } catch (error) {
    console.error('Error saving meal from analysis:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * @route GET /api/meals/daily/:date
 * @desc Get daily meals with totals for a specific date
 * @access Private
 */
router.get('/daily/:date', [
  param('date').isISO8601()
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

    const date = req.params.date;
    const dailyMeals = await mealService.getDailyMealsWithTotals(userId, date);

    res.json({
      success: true,
      data: dailyMeals
    });
  } catch (error) {
    console.error('Error getting daily meals:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * @route GET /api/meals/limits
 * @desc Get user's current usage limits
 * @access Private
 */
router.get('/limits', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const limits = await mealService.getUserLimits(userId);

    res.json({
      success: true,
      data: limits
    });
  } catch (error) {
    console.error('Error getting user limits:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * @route POST /api/meals/analyze-ai
 * @desc Analyze meal using AI (OpenRouter) - with daily limit middleware
 * @access Private
 */
router.post('/analyze-ai', [
  body('input').isString().isLength({ min: 1, max: 1000 })
], checkAnalysisLimit, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { input } = req.body;
    const userId = req.user?.id;
    
    // Get user region for localized portion sizes
    let userRegion = 'PL'; // default
    if (userId) {
      const user = await userService.getUserById(userId);
      if (user?.region) {
        userRegion = user.region;
      }
    }
    
    const analysis = await mealService.analyzeMealWithAI(input, userRegion);

    res.json({
      success: true,
      data: analysis,
      usage: req.analysisUsage
    });
  } catch (error) {
    console.error('Error analyzing meal with AI:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;
