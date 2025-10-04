import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { UserService } from '../services/UserService';
import { AuthenticatedRequest } from "../middleware/auth";

const router = express.Router();
const userService = new UserService();

/**
 * @route GET /api/users/profile
 * @desc Get current user profile
 * @access Private
 */
router.get('/profile', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const user = await userService.getUserById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Error getting user profile:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * @route POST /api/users/profile
 * @desc Create or update user profile
 * @access Private
 */
router.post('/profile', [
  body('email').isEmail().normalizeEmail(),
  body('weight').isFloat({ min: 30, max: 300 }),
  body('height').isInt({ min: 100, max: 250 }),
  body('age').isInt({ min: 13, max: 120 }),
  body('gender').isIn(['male', 'female', 'other']),
  body('target_weekly_loss').optional().isFloat({ min: 0, max: 2 }),
  body('activity_level').optional().isIn(['sedentary', 'light', 'moderate', 'active', 'very_active']),
  body('weekend_mode').optional().isIn(['active', 'inactive']),
  body('sleep_hours').optional().isInt({ min: 4, max: 12 })
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

    // Check if user already exists
    const existingUser = await userService.getUserById(userId);
    
    if (existingUser) {
      // Update existing user
      const updatedUser = await userService.updateUser(userId, req.body);
      if (!updatedUser) {
        return res.status(500).json({
          success: false,
          error: 'Failed to update user profile'
        });
      }

      res.json({
        success: true,
        data: updatedUser,
        message: 'Profile updated successfully'
      });
    } else {
      // Create new user
      const newUser = await userService.createUser(req.body, userId);
      if (!newUser) {
        return res.status(500).json({
          success: false,
          error: 'Failed to create user profile'
        });
      }

      res.status(201).json({
        success: true,
        data: newUser,
        message: 'Profile created successfully'
      });
    }
  } catch (error) {
    console.error('Error creating/updating user profile:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * @route PUT /api/users/profile
 * @desc Update user profile
 * @access Private
 */
router.put('/profile', [
  body('display_name').optional().isString().trim().isLength({ min: 1, max: 50 }).withMessage('Display name must be between 1 and 50 characters'),
  body('avatar').optional().isString().trim().isLength({ min: 1, max: 20 }).withMessage('Avatar must be a valid string'),
  body('region').optional().isString().trim().isLength({ min: 2, max: 5 }).withMessage('Region must be a valid country code'),
], async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
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

    const { display_name, avatar, region } = req.body;
    const updateData: any = {};
    
    if (display_name !== undefined) {
      updateData.display_name = display_name;
    }
    if (avatar !== undefined) {
      updateData.avatar = avatar;
    }
    if (region !== undefined) {
      updateData.region = region;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid fields to update'
      });
    }

    const updatedUser = await userService.updateUser(userId, updateData);
    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      data: updatedUser
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * @route GET /api/users/nutrition-targets
 * @desc Get user's daily nutrition targets
 * @access Private
 */
router.get('/nutrition-targets', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const dailyTarget = await userService.calculateDailyNutritionTarget(userId);
    if (!dailyTarget) {
      return res.status(404).json({
        success: false,
        error: 'User profile not found or incomplete'
      });
    }

    res.json({
      success: true,
      data: dailyTarget
    });
  } catch (error) {
    console.error('Error getting nutrition targets:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * @route GET /api/users/weekly-nutrition-targets
 * @desc Get user's weekly nutrition targets
 * @access Private
 */
router.get('/weekly-nutrition-targets', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const startDate = req.query.startDate as string || new Date().toISOString().split('T')[0];
    const weeklyTarget = await userService.calculateWeeklyNutritionTarget(userId, startDate);
    if (!weeklyTarget) {
      return res.status(404).json({
        success: false,
        error: 'User profile not found or incomplete'
      });
    }

    res.json({
      success: true,
      data: weeklyTarget
    });
  } catch (error) {
    console.error('Error getting weekly nutrition targets:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * @route GET /api/users/weekend-mode
 * @desc Get user's weekend mode configuration
 * @access Private
 */
router.get('/weekend-mode', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const config = await userService.getWeekendModeConfig(userId);
    if (!config) {
      return res.status(404).json({
        success: false,
        error: 'User profile not found'
      });
    }

    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    console.error('Error getting weekend mode config:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * @route POST /api/users/weekend-mode
 * @desc Update user's weekend mode configuration
 * @access Private
 */
router.post('/weekend-mode', [
  body('is_active').isBoolean(),
  body('start_day').optional().isInt({ min: 0, max: 6 }),
  body('end_day').optional().isInt({ min: 0, max: 6 })
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

    const updateData = {
      weekend_mode: (req.body.is_active ? 'active' : 'inactive') as 'active' | 'inactive',
      weekend_start_day: req.body.start_day,
      weekend_end_day: req.body.end_day
    };

    const updatedUser = await userService.updateUser(userId, updateData);
    if (!updatedUser) {
      return res.status(500).json({
        success: false,
        error: 'Failed to update weekend mode'
      });
    }

    const config = await userService.getWeekendModeConfig(userId);

    res.json({
      success: true,
      data: config,
      message: 'Weekend mode updated successfully'
    });
  } catch (error) {
    console.error('Error updating weekend mode:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * @route GET /api/users/notifications
 * @desc Get user's notification preferences
 * @access Private
 */
router.get('/notifications', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const preferences = await userService.getNotificationPreferences(userId);
    if (!preferences) {
      return res.status(404).json({
        success: false,
        error: 'User profile not found'
      });
    }

    res.json({
      success: true,
      data: preferences
    });
  } catch (error) {
    console.error('Error getting notification preferences:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * @route PUT /api/users/notifications
 * @desc Update user's notification preferences
 * @access Private
 */
router.put('/notifications', [
  body('daily_reminder').optional().isBoolean(),
  body('weight_reminder').optional().isBoolean(),
  body('meal_suggestions').optional().isBoolean()
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

    const success = await userService.updateNotificationPreferences(userId, req.body);
    if (!success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to update notification preferences'
      });
    }

    const preferences = await userService.getNotificationPreferences(userId);

    res.json({
      success: true,
      data: preferences,
      message: 'Notification preferences updated successfully'
    });
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * @route GET /api/users/current-weight
 * @desc Get user's current weight
 * @access Private
 */
router.get('/current-weight', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const weight = await userService.getCurrentWeight(userId);
    if (weight === null) {
      return res.status(404).json({
        success: false,
        error: 'User profile not found'
      });
    }

    res.json({
      success: true,
      data: { weight }
    });
  } catch (error) {
    console.error('Error getting current weight:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * @route PUT /api/users/current-weight
 * @desc Update user's current weight
 * @access Private
 */
router.put('/current-weight', [
  body('weight').isFloat({ min: 30, max: 300 })
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

    const success = await userService.updateCurrentWeight(userId, req.body.weight);
    if (!success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to update current weight'
      });
    }

    res.json({
      success: true,
      message: 'Current weight updated successfully'
    });
  } catch (error) {
    console.error('Error updating current weight:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;
