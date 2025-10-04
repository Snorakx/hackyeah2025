import express, { Request, Response } from 'express';
import { body, query, validationResult } from 'express-validator';
import { WeightService } from '../services/WeightService';
import { AuthenticatedRequest } from "../middleware/auth";

const router = express.Router();
const weightService = new WeightService();

/**
 * @route GET /api/weights
 * @desc Get weight entries for a user
 * @access Private
 */
router.get('/', [
  query('limit').optional().isInt({ min: 1, max: 100 })
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

    const limit = req.query.limit ? parseInt(req.query.limit as string) : 30;
    const weights = await weightService.getWeights(userId, limit);

    res.json({
      success: true,
      data: weights
    });
  } catch (error) {
    console.error('Error getting weights:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * @route GET /api/weights/:id
 * @desc Get weight entry by ID
 * @access Private
 */
router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const weightId = req.params.id;
    const weight = await weightService.getWeightById(weightId);

    if (!weight) {
      return res.status(404).json({
        success: false,
        error: 'Weight entry not found'
      });
    }

    res.json({
      success: true,
      data: weight
    });
  } catch (error) {
    console.error('Error getting weight:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * @route POST /api/weights
 * @desc Create new weight entry
 * @access Private
 */
router.post('/', [
  body('date').isISO8601(),
  body('value_kg').isFloat({ min: 30, max: 300 }),
  body('note').optional().isString().trim(),
  body('flags').optional().isArray(),
  body('flags.*').optional().isString(),
  body('source').optional().isIn(['manual', 'apple_health', 'google_fit'])
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

    const weight = await weightService.createWeight(userId, req.body);
    if (!weight) {
      return res.status(500).json({
        success: false,
        error: 'Failed to create weight entry'
      });
    }

    res.status(201).json({
      success: true,
      data: weight,
      message: 'Weight entry created successfully'
    });
  } catch (error) {
    console.error('Error creating weight entry:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * @route PUT /api/weights/:id
 * @desc Update weight entry
 * @access Private
 */
router.put('/:id', [
  body('date').optional().isISO8601(),
  body('value_kg').optional().isFloat({ min: 30, max: 300 }),
  body('note').optional().isString().trim(),
  body('flags').optional().isArray(),
  body('flags.*').optional().isString(),
  body('source').optional().isIn(['manual', 'apple_health', 'google_fit'])
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

    const weightId = req.params.id;
    const weight = await weightService.updateWeight(weightId, req.body);

    if (!weight) {
      return res.status(404).json({
        success: false,
        error: 'Weight entry not found'
      });
    }

    res.json({
      success: true,
      data: weight,
      message: 'Weight entry updated successfully'
    });
  } catch (error) {
    console.error('Error updating weight entry:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * @route DELETE /api/weights/:id
 * @desc Delete weight entry
 * @access Private
 */
router.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const weightId = req.params.id;
    const success = await weightService.deleteWeight(weightId);

    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'Weight entry not found'
      });
    }

    res.json({
      success: true,
      message: 'Weight entry deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting weight entry:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * @route GET /api/weights/latest
 * @desc Get latest weight entry
 * @access Private
 */
router.get('/latest', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const weight = await weightService.getLatestWeight(userId);

    if (!weight) {
      return res.status(404).json({
        success: false,
        error: 'No weight entries found'
      });
    }

    res.json({
      success: true,
      data: weight
    });
  } catch (error) {
    console.error('Error getting latest weight:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * @route GET /api/weights/trend
 * @desc Get weight trend analysis
 * @access Private
 */
router.get('/trend', [
  query('days').optional().isInt({ min: 7, max: 365 })
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
    const trend = await weightService.getWeightTrend(userId, days);

    res.json({
      success: true,
      data: trend
    });
  } catch (error) {
    console.error('Error getting weight trend:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * @route GET /api/weights/moving-average
 * @desc Get moving average
 * @access Private
 */
router.get('/moving-average', [
  query('days').optional().isInt({ min: 3, max: 30 })
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

    const days = req.query.days ? parseInt(req.query.days as string) : 7;
    const movingAverage = await weightService.getMovingAverage(userId, days);

    res.json({
      success: true,
      data: movingAverage
    });
  } catch (error) {
    console.error('Error getting moving average:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * @route GET /api/weights/stats
 * @desc Get weight statistics
 * @access Private
 */
router.get('/stats', [
  query('days').optional().isInt({ min: 7, max: 365 })
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
    const stats = await weightService.getWeightStats(userId, days);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting weight stats:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * @route GET /api/weights/predictions
 * @desc Get weight predictions
 * @access Private
 */
router.get('/predictions', [
  query('weeks').optional().isInt({ min: 1, max: 12 })
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

    const weeks = req.query.weeks ? parseInt(req.query.weeks as string) : 4;
    const predictions = await weightService.getWeightPredictions(userId, weeks);

    res.json({
      success: true,
      data: predictions
    });
  } catch (error) {
    console.error('Error getting weight predictions:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * @route GET /api/weights/flags/:flag
 * @desc Get weight entries with specific flag
 * @access Private
 */
router.get('/flags/:flag', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const flag = req.params.flag;
    const weights = await weightService.getWeightsWithFlags(userId, flag);

    res.json({
      success: true,
      data: weights
    });
  } catch (error) {
    console.error('Error getting weights with flags:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * @route GET /api/weights/change
 * @desc Get weight change between two dates
 * @access Private
 */
router.get('/change', [
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
    const change = await weightService.getWeightChange(userId, startDate, endDate);

    if (!change) {
      return res.status(404).json({
        success: false,
        error: 'No weight entries found for the specified date range'
      });
    }

    res.json({
      success: true,
      data: change
    });
  } catch (error) {
    console.error('Error getting weight change:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * @route GET /api/weights/reminder
 * @desc Check if user should be reminded to weigh in
 * @access Private
 */
router.get('/reminder', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const shouldRemind = await weightService.shouldRemindToWeighIn(userId);

    res.json({
      success: true,
      data: { shouldRemind }
    });
  } catch (error) {
    console.error('Error checking weight reminder:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;
