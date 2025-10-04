import express from 'express';
import { NotificationService } from '../services/NotificationService';
import { authenticateUser, AuthenticatedRequest } from '../middleware/auth';
import type {
  RegisterDeviceRequest,
  RegisterWebRequest,
  UpdatePreferencesRequest,
  SendTestNotificationRequest,
  NotificationEventRequest,
  CalorieUpdateRequest,
  MealAddedRequest
} from '../types/notifications';

const router = express.Router();
let notificationService: NotificationService | null = null;

// Lazy initialization of NotificationService
const getNotificationService = () => {
  if (!notificationService) {
    notificationService = new NotificationService();
  }
  return notificationService;
};

/**
 * GET /api/notifications/vapid-key
 * Get VAPID public key for web push
 */
router.get('/vapid-key', async (req, res) => {
  try {
    const publicKey = getNotificationService().getVapidPublicKey();
    res.json({ publicKey });
  } catch (error) {
    console.error('Error getting VAPID key:', error);
    res.status(500).json({ error: 'Failed to get VAPID key' });
  }
});

/**
 * POST /api/notifications/register-device
 * Register device token for push notifications (iOS/Android)
 */
router.post('/register-device', authenticateUser, async (req, res) => {
  try {
    const { userId, token, platform, deviceId }: RegisterDeviceRequest = req.body;
    
    if (!userId || !token || !platform || !deviceId) {
      return res.status(400).json({ 
        error: 'Missing required fields: userId, token, platform, deviceId' 
      });
    }

    if (!['ios', 'android'].includes(platform)) {
      return res.status(400).json({ 
        error: 'Platform must be ios or android' 
      });
    }

    await getNotificationService().registerDeviceToken({
      userId,
      token,
      platform: platform as 'ios' | 'android',
      deviceId
    });

    res.json({ 
      success: true, 
      message: 'Device token registered successfully' 
    });
  } catch (error) {
    console.error('Error registering device token:', error);
    res.status(500).json({ error: 'Failed to register device token' });
  }
});

/**
 * POST /api/notifications/register-web
 * Register web push subscription
 */
router.post('/register-web', authenticateUser, async (req, res) => {
  try {
    const { userId, subscription }: RegisterWebRequest = req.body;
    
    if (!userId || !subscription) {
      return res.status(400).json({ 
        error: 'Missing required fields: userId, subscription' 
      });
    }

    await getNotificationService().registerWebSubscription({
      userId,
      subscription,
      platform: 'web'
    });

    res.json({ 
      success: true, 
      message: 'Web subscription registered successfully' 
    });
  } catch (error) {
    console.error('Error registering web subscription:', error);
    res.status(500).json({ error: 'Failed to register web subscription' });
  }
});

/**
 * GET /api/notifications/preferences
 * Get user notification preferences
 */
router.get('/preferences', authenticateUser, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const preferences = await getNotificationService().getUserPreferences(userId);
    res.json({ preferences });
  } catch (error) {
    console.error('Error getting preferences:', error);
    res.status(500).json({ error: 'Failed to get preferences' });
  }
});

/**
 * PUT /api/notifications/preferences
 * Update user notification preferences
 */
router.put('/preferences', authenticateUser, async (req, res) => {
  try {
    const { userId, preferences }: UpdatePreferencesRequest = req.body;
    
    if (!userId || !preferences) {
      return res.status(400).json({ 
        error: 'Missing required fields: userId, preferences' 
      });
    }

    await getNotificationService().updateUserPreferences(userId, preferences);
    res.json({ 
      success: true, 
      message: 'Preferences updated successfully' 
    });
  } catch (error) {
    console.error('Error updating preferences:', error);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
});

/**
 * POST /api/notifications/test
 * Send test notification (admin/debug only)
 */
router.post('/test', authenticateUser, async (req, res) => {
  try {
    const { userId, templateId, testMode }: SendTestNotificationRequest = req.body;
    
    if (!userId || !templateId) {
      return res.status(400).json({ 
        error: 'Missing required fields: userId, templateId' 
      });
    }

    await getNotificationService().sendTestNotification(userId, templateId, testMode);
    res.json({ 
      success: true, 
      message: 'Test notification sent successfully' 
    });
  } catch (error) {
    console.error('Error sending test notification:', error);
    res.status(500).json({ error: 'Failed to send test notification' });
  }
});

/**
 * POST /api/notifications/events/meal-added
 * Handle meal added event
 */
router.post('/events/meal-added', authenticateUser, async (req, res) => {
  try {
    const { userId, mealData, timestamp }: MealAddedRequest = req.body;
    
    if (!userId || !mealData) {
      return res.status(400).json({ 
        error: 'Missing required fields: userId, mealData' 
      });
    }

    await getNotificationService().handleMealAddedEvent(userId, mealData, new Date(timestamp));
    res.json({ 
      success: true, 
      message: 'Meal added event processed' 
    });
  } catch (error) {
    console.error('Error handling meal added event:', error);
    res.status(500).json({ error: 'Failed to process meal added event' });
  }
});

/**
 * POST /api/notifications/events/calorie-update
 * Handle calorie progress update
 */
router.post('/events/calorie-update', authenticateUser, async (req, res) => {
  try {
    const { userId, calorieData, timestamp }: CalorieUpdateRequest = req.body;
    
    if (!userId || !calorieData) {
      return res.status(400).json({ 
        error: 'Missing required fields: userId, calorieData' 
      });
    }

    await getNotificationService().handleCalorieUpdateEvent(userId, calorieData, new Date(timestamp));
    res.json({ 
      success: true, 
      message: 'Calorie update event processed' 
    });
  } catch (error) {
    console.error('Error handling calorie update event:', error);
    res.status(500).json({ error: 'Failed to process calorie update event' });
  }
});

/**
 * POST /api/notifications/unregister
 * Unregister device token (logout)
 */
router.post('/unregister', authenticateUser, async (req, res) => {
  try {
    const { userId, token } = req.body;
    
    if (!userId || !token) {
      return res.status(400).json({ 
        error: 'Missing required fields: userId, token' 
      });
    }

    await getNotificationService().unregisterDeviceToken(userId, token);
    res.json({ 
      success: true, 
      message: 'Device token unregistered successfully' 
    });
  } catch (error) {
    console.error('Error unregistering device token:', error);
    res.status(500).json({ error: 'Failed to unregister device token' });
  }
});

/**
 * GET /api/notifications/history
 * Get notification history for user
 */
router.get('/history', authenticateUser, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const history = await getNotificationService().getNotificationHistory(userId, limit, offset);
    res.json({ history });
  } catch (error) {
    console.error('Error getting notification history:', error);
    res.status(500).json({ error: 'Failed to get notification history' });
  }
});

/**
 * GET /api/notifications/templates
 * Get available notification templates
 */
router.get('/templates', authenticateUser, async (req, res) => {
  try {
    const templates = await getNotificationService().getNotificationTemplates();
    res.json({ templates });
  } catch (error) {
    console.error('Error getting templates:', error);
    res.status(500).json({ error: 'Failed to get templates' });
  }
});

/**
 * GET /api/notifications/scheduled
 * Get scheduled notifications for user (admin/debug)
 */
router.get('/scheduled', authenticateUser, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const scheduled = await getNotificationService().getScheduledNotifications(userId);
    res.json({ scheduled });
  } catch (error) {
    console.error('Error getting scheduled notifications:', error);
    res.status(500).json({ error: 'Failed to get scheduled notifications' });
  }
});

export default router;