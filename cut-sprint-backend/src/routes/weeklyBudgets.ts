import express, { Request, Response } from 'express';
import { body, query, validationResult } from 'express-validator';
import { WeeklyBudgetService } from '../services/WeeklyBudgetService';
import { AuthenticatedRequest } from "../middleware/auth";

const router = express.Router();
const weeklyBudgetService = new WeeklyBudgetService();

/**
 * @route GET /api/weekly-budgets
 * @desc Get weekly budgets for a user
 * @access Private
 */
router.get('/', [
  query('limit').optional().isInt({ min: 1, max: 50 })
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

    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    const budgets = await weeklyBudgetService.getWeeklyBudgets(userId, limit);

    res.json({
      success: true,
      data: budgets
    });
  } catch (error) {
    console.error('Error getting weekly budgets:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * @route GET /api/weekly-budgets/current
 * @desc Get current weekly budget
 * @access Private
 */
router.get('/current', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const budget = await weeklyBudgetService.getCurrentWeeklyBudget(userId);
    if (!budget) {
      // Auto-create if doesn't exist
      const newBudget = await weeklyBudgetService.autoCreateWeeklyBudget(userId);
      if (!newBudget) {
        return res.status(500).json({
          success: false,
          error: 'Failed to create weekly budget'
        });
      }
      return res.json({
        success: true,
        data: newBudget
      });
    }

    res.json({
      success: true,
      data: budget
    });
  } catch (error) {
    console.error('Error getting current weekly budget:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * @route GET /api/weekly-budgets/:id
 * @desc Get weekly budget by ID
 * @access Private
 */
router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const budgetId = req.params.id;
    const budget = await weeklyBudgetService.getWeeklyBudgetById(budgetId);

    if (!budget) {
      return res.status(404).json({
        success: false,
        error: 'Weekly budget not found'
      });
    }

    res.json({
      success: true,
      data: budget
    });
  } catch (error) {
    console.error('Error getting weekly budget:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * @route POST /api/weekly-budgets
 * @desc Create new weekly budget
 * @access Private
 */
router.post('/', [
  body('start_date').isISO8601(),
  body('end_date').isISO8601(),
  body('target_calories').isInt({ min: 1000, max: 10000 }),
  body('target_protein').isFloat({ min: 0, max: 1000 }),
  body('target_fat').isFloat({ min: 0, max: 1000 }),
  body('target_carbs').isFloat({ min: 0, max: 1000 }),
  body('weekend_bonus_calories').optional().isInt({ min: 0, max: 2000 })
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

    const budget = await weeklyBudgetService.createWeeklyBudget(userId, req.body);
    if (!budget) {
      return res.status(500).json({
        success: false,
        error: 'Failed to create weekly budget'
      });
    }

    res.status(201).json({
      success: true,
      data: budget,
      message: 'Weekly budget created successfully'
    });
  } catch (error) {
    console.error('Error creating weekly budget:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * @route POST /api/weekly-budgets/auto-create
 * @desc Auto-create weekly budget based on user profile
 * @access Private
 */
router.post('/auto-create', [
  body('startDate').optional().isISO8601()
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

    const startDate = req.body.startDate;
    const budget = await weeklyBudgetService.autoCreateWeeklyBudget(userId, startDate);
    if (!budget) {
      return res.status(500).json({
        success: false,
        error: 'Failed to auto-create weekly budget'
      });
    }

    res.status(201).json({
      success: true,
      data: budget,
      message: 'Weekly budget auto-created successfully'
    });
  } catch (error) {
    console.error('Error auto-creating weekly budget:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * @route PUT /api/weekly-budgets/:id
 * @desc Update weekly budget
 * @access Private
 */
router.put('/:id', [
  body('start_date').optional().isISO8601(),
  body('end_date').optional().isISO8601(),
  body('target_calories').optional().isInt({ min: 1000, max: 10000 }),
  body('target_protein').optional().isFloat({ min: 0, max: 1000 }),
  body('target_fat').optional().isFloat({ min: 0, max: 1000 }),
  body('target_carbs').optional().isFloat({ min: 0, max: 1000 }),
  body('weekend_bonus_calories').optional().isInt({ min: 0, max: 2000 }),
  body('status').optional().isIn(['active', 'completed', 'cancelled'])
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

    const budgetId = req.params.id;
    const budget = await weeklyBudgetService.updateWeeklyBudget(budgetId, req.body);

    if (!budget) {
      return res.status(404).json({
        success: false,
        error: 'Weekly budget not found'
      });
    }

    res.json({
      success: true,
      data: budget,
      message: 'Weekly budget updated successfully'
    });
  } catch (error) {
    console.error('Error updating weekly budget:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * @route GET /api/weekly-budgets/progress
 * @desc Get weekly progress
 * @access Private
 */
router.get('/progress', [
  query('startDate').optional().isISO8601()
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
    const progress = await weeklyBudgetService.getWeeklyProgress(userId, startDate);

    if (!progress) {
      return res.status(404).json({
        success: false,
        error: 'Weekly progress not found'
      });
    }

    res.json({
      success: true,
      data: progress
    });
  } catch (error) {
    console.error('Error getting weekly progress:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * @route GET /api/weekly-budgets/daily-breakdown/:date
 * @desc Get daily budget breakdown
 * @access Private
 */
router.get('/daily-breakdown/:date', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const date = req.params.date;
    const breakdown = await weeklyBudgetService.getDailyBudgetBreakdown(userId, date);

    res.json({
      success: true,
      data: breakdown
    });
  } catch (error) {
    console.error('Error getting daily budget breakdown:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * @route GET /api/weekly-budgets/weekend-compensation/:date
 * @desc Get weekend compensation plan
 * @access Private
 */
router.get('/weekend-compensation/:date', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const weekendDate = req.params.date;
    const compensation = await weeklyBudgetService.getWeekendCompensationPlan(userId, weekendDate);

    res.json({
      success: true,
      data: compensation
    });
  } catch (error) {
    console.error('Error getting weekend compensation plan:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * @route GET /api/weekly-budgets/suggestions
 * @desc Get weekly budget suggestions
 * @access Private
 */
router.get('/suggestions', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const suggestions = await weeklyBudgetService.getWeeklyBudgetSuggestions(userId);

    res.json({
      success: true,
      data: suggestions
    });
  } catch (error) {
    console.error('Error getting weekly budget suggestions:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * @route GET /api/weekly-budgets/status
 * @desc Get budget status for the week
 * @access Private
 */
router.get('/status', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const status = await weeklyBudgetService.getBudgetStatus(userId);

    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Error getting budget status:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * @route POST /api/weekly-budgets/check-and-create
 * @desc Check and create weekly budget if needed
 * @access Private
 */
router.post('/check-and-create', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const budget = await weeklyBudgetService.checkAndCreateWeeklyBudget(userId);
    if (!budget) {
      return res.status(500).json({
        success: false,
        error: 'Failed to check and create weekly budget'
      });
    }

    res.json({
      success: true,
      data: budget,
      message: 'Weekly budget checked and created successfully'
    });
  } catch (error) {
    console.error('Error checking and creating weekly budget:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;
