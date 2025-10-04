import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { OnboardingService } from '../services/OnboardingService';
import { AuthenticatedRequest } from "../middleware/auth";

const router = express.Router();
const onboardingService = new OnboardingService();

/**
 * @route POST /api/onboarding/save
 * @desc Save user onboarding data
 * @access Private
 */
router.post('/save', [
  body('units').isIn(['metric', 'imperial']),
  body('weighing_frequency').isIn(['weekly', 'daily', '2-3x']),
  body('weighing_day_of_week').optional().isInt({ min: 0, max: 6 }),
  body('meals_per_day').optional().isInt({ min: 2, max: 5 }),
  body('diet_preferences').optional().isArray(),
  body('allergies').optional().isArray(),
  body('goal').optional().isIn(['weight_loss', 'maintenance', 'muscle_gain']),
  body('goal_intensity').optional().isIn(['conservative', 'moderate', 'aggressive'])
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
    const userEmail = req.user?.email;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const onboardingData = {
      ...req.body,
      user_id: userId,
      email: userEmail
    };

    const result = await onboardingService.saveOnboardingData(onboardingData);

    res.json({
      success: true,
      data: result,
      message: 'Onboarding data saved successfully'
    });
  } catch (error: any) {
    console.error('Error saving onboarding data:', error);
    res.status(500).json({
      success: false,
      error: error?.message || 'Internal server error'
    });
  }
});

/**
 * @route GET /api/onboarding/data
 * @desc Get user onboarding data
 * @access Private
 */
router.get('/data', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const data = await onboardingService.getOnboardingData(userId);

    if (!data) {
      return res.status(404).json({
        success: false,
        error: 'Onboarding data not found'
      });
    }

    res.json({
      success: true,
      data: data
    });
  } catch (error) {
    console.error('Error getting onboarding data:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * @route POST /api/onboarding/complete
 * @desc Mark onboarding as completed and create initial sprint
 * @access Private
 */
router.post('/complete', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const result = await onboardingService.completeOnboarding(userId);

    res.json({
      success: true,
      data: result,
      message: 'Onboarding completed successfully'
    });
  } catch (error: any) {
    console.error('Error completing onboarding:', error);
    res.status(500).json({
      success: false,
      error: error?.message || 'Internal server error'
    });
  }
});

export default router;
