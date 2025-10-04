import express, { Request, Response } from 'express';
import { body, query, validationResult } from 'express-validator';
import { ActivityService } from '../services/ActivityService';
import { AuthenticatedRequest } from "../middleware/auth";

const router = express.Router();
const activityService = new ActivityService();

/**
 * @route GET /api/activities
 * @desc Get activities with search parameters
 * @access Private
 */
router.get('/', [
  query('date').optional().isISO8601(),
  query('type').optional().isIn(['running', 'cycling', 'swimming', 'strength', 'flexibility', 'mixed']),
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

    const date = req.query.date as string;
    const activities = date 
      ? await activityService.getActivitiesByDate(userId, date)
      : await activityService.getActivitiesByDateRange(userId, '', '');

    res.json({
      success: true,
      data: activities
    });
  } catch (error) {
    console.error('Error getting activities:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * @route GET /api/activities/date/:date
 * @desc Get activities for a specific date
 * @access Private
 */
router.get('/date/:date', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const date = req.params.date;
    const activities = await activityService.getActivitiesByDate(userId, date);

    res.json({
      success: true,
      data: activities
    });
  } catch (error) {
    console.error('Error getting activities by date:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * @route GET /api/activities/:id
 * @desc Get activity by ID
 * @access Private
 */
router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const activityId = req.params.id;
    const activity = await activityService.getActivityById(activityId);

    if (!activity) {
      return res.status(404).json({
        success: false,
        error: 'Activity not found'
      });
    }

    res.json({
      success: true,
      data: activity
    });
  } catch (error) {
    console.error('Error getting activity:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * @route POST /api/activities
 * @desc Create new activity
 * @access Private
 */
router.post('/', [
  body('date').isISO8601(),
  body('type').isIn(['running', 'cycling', 'swimming', 'strength', 'flexibility', 'mixed']),
  body('duration_minutes').isInt({ min: 1, max: 480 }),
  body('estimated_calories').optional().isInt({ min: 0, max: 2000 }),
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

    const activity = await activityService.createActivity(userId, req.body);
    if (!activity) {
      return res.status(500).json({
        success: false,
        error: 'Failed to create activity'
      });
    }

    res.status(201).json({
      success: true,
      data: activity,
      message: 'Activity created successfully'
    });
  } catch (error) {
    console.error('Error creating activity:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * @route PUT /api/activities/:id
 * @desc Update activity
 * @access Private
 */
router.put('/:id', [
  body('date').optional().isISO8601(),
  body('type').optional().isIn(['running', 'cycling', 'swimming', 'strength', 'flexibility', 'mixed']),
  body('duration_minutes').optional().isInt({ min: 1, max: 480 }),
  body('estimated_calories').optional().isInt({ min: 0, max: 2000 }),
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

    const activityId = req.params.id;
    const activity = await activityService.updateActivity(activityId, req.body);

    if (!activity) {
      return res.status(404).json({
        success: false,
        error: 'Activity not found'
      });
    }

    res.json({
      success: true,
      data: activity,
      message: 'Activity updated successfully'
    });
  } catch (error) {
    console.error('Error updating activity:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * @route DELETE /api/activities/:id
 * @desc Delete activity
 * @access Private
 */
router.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const activityId = req.params.id;
    const success = await activityService.deleteActivity(activityId);

    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'Activity not found'
      });
    }

    res.json({
      success: true,
      message: 'Activity deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting activity:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * @route GET /api/activities/daily-calories/:date
 * @desc Get daily total calories burned
 * @access Private
 */
router.get('/daily-calories/:date', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const date = req.params.date;
    const calories = await activityService.getDailyCaloriesBurned(userId, date);

    res.json({
      success: true,
      data: { calories }
    });
  } catch (error) {
    console.error('Error getting daily calories:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * @route GET /api/activities/weekly-calories
 * @desc Get weekly total calories burned
 * @access Private
 */
router.get('/weekly-calories', [
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
    const calories = await activityService.getWeeklyCaloriesBurned(userId, startDate, endDate);

    res.json({
      success: true,
      data: { calories }
    });
  } catch (error) {
    console.error('Error getting weekly calories:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * @route GET /api/activities/stats
 * @desc Get activity statistics
 * @access Private
 */
router.get('/stats', [
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
    const stats = await activityService.getActivityStats(userId, startDate, endDate);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting activity stats:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * @route GET /api/activities/recommended
 * @desc Get recommended activities
 * @access Private
 */
router.get('/recommended', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const recommendations = await activityService.getRecommendedActivities(userId);

    res.json({
      success: true,
      data: recommendations
    });
  } catch (error) {
    console.error('Error getting recommended activities:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * @route GET /api/activities/suggestions
 * @desc Get activity suggestions based on calorie goals
 * @access Private
 */
router.get('/suggestions', [
  query('date').isISO8601(),
  query('targetCalories').isInt({ min: 0, max: 5000 }),
  query('consumedCalories').isInt({ min: 0, max: 5000 })
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

    const date = req.query.date as string;
    const targetCalories = parseInt(req.query.targetCalories as string);
    const consumedCalories = parseInt(req.query.consumedCalories as string);

    const suggestions = await activityService.getActivitySuggestions(
      userId,
      date,
      targetCalories,
      consumedCalories
    );

    res.json({
      success: true,
      data: suggestions
    });
  } catch (error) {
    console.error('Error getting activity suggestions:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * @route GET /api/activities/quick-presets
 * @desc Get quick activity presets
 * @access Private
 */
router.get('/quick-presets', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const presets = activityService.getQuickActivityPresets();

    res.json({
      success: true,
      data: presets
    });
  } catch (error) {
    console.error('Error getting quick presets:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * @route POST /api/activities/calculate-calories
 * @desc Calculate calories burned for an activity
 * @access Private
 */
router.post('/calculate-calories', [
  body('type').isIn(['running', 'cycling', 'swimming', 'strength', 'flexibility', 'mixed']),
  body('duration_minutes').isInt({ min: 1, max: 480 }),
  body('user_weight').isFloat({ min: 30, max: 300 })
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

    const { type, duration_minutes, user_weight } = req.body;
    const calories = activityService.calculateCaloriesBurned(type, duration_minutes, user_weight);

    res.json({
      success: true,
      data: { calories }
    });
  } catch (error) {
    console.error('Error calculating calories:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;
