import admin from 'firebase-admin';
import webpush from 'web-push';
import * as cron from 'node-cron';
import { supabase } from '../lib/supabase';
import type {
  DeviceToken,
  NotificationPreferences,
  NotificationTemplate,
  ScheduledNotification,
  NotificationLog,
  UserContext,
  NotificationVariables,
  PushNotificationPayload,
  WebPushSubscription,
  RegisterDeviceRequest,
  RegisterWebRequest
} from '../types/notifications';

export class NotificationService {
  private isInitialized: boolean = false;
  private cronJobs: Map<string, cron.ScheduledTask> = new Map();

  constructor() {
    this.initialize();
  }

  /**
   * Initialize notification service
   */
  private async initialize(): Promise<void> {
    try {
      // Initialize Firebase Admin
      if (!admin.apps.length) {
        console.log('🔍 Firebase config debug:');
        console.log('FIREBASE_PROJECT_ID:', process.env.FIREBASE_PROJECT_ID);
        console.log('FIREBASE_CLIENT_EMAIL:', process.env.FIREBASE_CLIENT_EMAIL);
        console.log('FIREBASE_PRIVATE_KEY length:', process.env.FIREBASE_PRIVATE_KEY?.length);
        
        const serviceAccount = {
          project_id: process.env.FIREBASE_PROJECT_ID!,
          private_key: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
          client_email: process.env.FIREBASE_CLIENT_EMAIL!,
        };
        
        console.log('Service account:', serviceAccount);

        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
        });
      }

      // Initialize Web Push
      webpush.setVapidDetails(
        `mailto:${process.env.VAPID_EMAIL}`,
        process.env.VAPID_PUBLIC_KEY!,
        process.env.VAPID_PRIVATE_KEY!
      );

      // Setup cron jobs for scheduled notifications
      this.setupCronJobs();

      this.isInitialized = true;
      console.log('✅ NotificationService initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize NotificationService:', error);
      throw error;
    }
  }

  /**
   * Get VAPID public key for web push
   */
  getVapidPublicKey(): string {
    return process.env.VAPID_PUBLIC_KEY!;
  }

  /**
   * Register device token
   */
  async registerDeviceToken(request: RegisterDeviceRequest): Promise<void> {
    try {
      const { userId, token, platform, deviceId } = request;

      // Deactivate existing tokens for this device
      await supabase
        .from('device_tokens')
        .update({ is_active: false })
        .eq('user_id', userId)
        .eq('device_id', deviceId);

      // Insert new token
      const { error } = await supabase
        .from('device_tokens')
        .insert({
          user_id: userId,
          token,
          platform,
          device_id: deviceId,
          is_active: true,
          registered_at: new Date().toISOString(),
          last_used: new Date().toISOString()
        });

      if (error) throw error;

      console.log(`✅ Device token registered: ${userId} (${platform})`);
      
      // Schedule default notifications for new user
      await this.scheduleDefaultNotifications(userId);
    } catch (error) {
      console.error('❌ Error registering device token:', error);
      throw error;
    }
  }

  /**
   * Register web push subscription
   */
  async registerWebSubscription(request: RegisterWebRequest): Promise<void> {
    try {
      const { userId, subscription } = request;

      // Generate device ID from subscription endpoint
      const deviceId = 'web_' + Buffer.from(subscription.endpoint).toString('base64').slice(-10);

      // Deactivate existing web subscriptions for this user
      await supabase
        .from('device_tokens')
        .update({ is_active: false })
        .eq('user_id', userId)
        .eq('platform', 'web');

      // Insert new subscription
      const { error } = await supabase
        .from('device_tokens')
        .insert({
          user_id: userId,
          token: subscription.endpoint,
          platform: 'web',
          device_id: deviceId,
          is_active: true,
          web_subscription: subscription,
          registered_at: new Date().toISOString(),
          last_used: new Date().toISOString()
        });

      if (error) throw error;

      console.log(`✅ Web subscription registered: ${userId}`);
      
      // Schedule default notifications for new user
      await this.scheduleDefaultNotifications(userId);
    } catch (error) {
      console.error('❌ Error registering web subscription:', error);
      throw error;
    }
  }

  /**
   * Get user notification preferences
   */
  async getUserPreferences(userId: string): Promise<NotificationPreferences> {
    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') { // Not found error
        throw error;
      }

      // Return default preferences if not found
      if (!data) {
        const defaultPreferences: NotificationPreferences = {
          userId,
          mealReminders: true,
          calorieProgress: true,
          motivational: true,
          quietHoursEnabled: true,
          quietHoursStart: '22:00',
          quietHoursEnd: '07:00',
          timezone: 'Europe/Warsaw',
          updatedAt: new Date()
        };

        // Save default preferences
        await this.updateUserPreferences(userId, defaultPreferences);
        return defaultPreferences;
      }

      return {
        userId: data.user_id,
        mealReminders: data.meal_reminders,
        calorieProgress: data.calorie_progress,
        motivational: data.motivational,
        quietHoursEnabled: data.quiet_hours_enabled,
        quietHoursStart: data.quiet_hours_start,
        quietHoursEnd: data.quiet_hours_end,
        timezone: data.timezone || 'Europe/Warsaw',
        updatedAt: new Date(data.updated_at)
      };
    } catch (error) {
      console.error('❌ Error getting user preferences:', error);
      throw error;
    }
  }

  /**
   * Update user notification preferences
   */
  async updateUserPreferences(userId: string, preferences: NotificationPreferences): Promise<void> {
    try {
      const { error } = await supabase
        .from('notification_preferences')
        .upsert({
          user_id: userId,
          meal_reminders: preferences.mealReminders,
          calorie_progress: preferences.calorieProgress,
          motivational: preferences.motivational,
          quiet_hours_enabled: preferences.quietHoursEnabled,
          quiet_hours_start: preferences.quietHoursStart,
          quiet_hours_end: preferences.quietHoursEnd,
          timezone: preferences.timezone,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      console.log(`✅ Preferences updated for user: ${userId}`);
    } catch (error) {
      console.error('❌ Error updating preferences:', error);
      throw error;
    }
  }

  /**
   * Send test notification
   */
  async sendTestNotification(userId: string, templateId: string, testMode: boolean = true): Promise<void> {
    try {
      const template = await this.getTemplate(templateId);
      if (!template) {
        throw new Error(`Template not found: ${templateId}`);
      }

      const userContext = await this.getUserContext(userId);
      const variables = this.buildNotificationVariables(userContext);
      const interpolated = this.interpolateTemplate(template, variables);

      const payload: PushNotificationPayload = {
        notification: {
          title: testMode ? `[TEST] ${interpolated.title}` : interpolated.title,
          body: interpolated.body,
          icon: '/icon-192x192.png',
          badge: '/badge-72x72.png',
          click_action: 'FCM_PLUGIN_ACTIVITY'
        },
        data: {
          templateId,
          testMode: testMode.toString(),
          timestamp: new Date().toISOString()
        }
      };

      await this.sendToUserDevices(userId, payload, templateId);
    } catch (error) {
      console.error('❌ Error sending test notification:', error);
      throw error;
    }
  }

  /**
   * Handle meal added event
   */
  async handleMealAddedEvent(userId: string, mealData: any, timestamp: Date): Promise<void> {
    try {
      // Update user's last meal time
      await this.updateUserLastMealTime(userId, timestamp);

      // Cancel any pending meal reminders for today
      await this.cancelPendingMealReminders(userId);

      // Schedule next meal reminders based on time
      await this.scheduleNextMealReminders(userId, timestamp);

      console.log(`✅ Meal added event processed for user: ${userId}`);
    } catch (error) {
      console.error('❌ Error handling meal added event:', error);
      throw error;
    }
  }

  /**
   * Handle calorie update event
   */
  async handleCalorieUpdateEvent(userId: string, calorieData: { consumed: number; target: number }, timestamp: Date): Promise<void> {
    try {
      // Update user's current calorie data
      await this.updateUserCalorieData(userId, calorieData);

      // Check if goal achieved
      const percentage = (calorieData.consumed / calorieData.target) * 100;
      if (percentage >= 95 && percentage <= 105) {
        await this.sendGoalAchievedNotification(userId);
      }

      console.log(`✅ Calorie update event processed for user: ${userId}`);
    } catch (error) {
      console.error('❌ Error handling calorie update event:', error);
      throw error;
    }
  }

  /**
   * Send notification to all user devices
   */
  private async sendToUserDevices(userId: string, payload: PushNotificationPayload, templateId: string): Promise<void> {
    try {
      // Get active device tokens
      const { data: tokens, error } = await supabase
        .from('device_tokens')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true);

      if (error) throw error;

      if (!tokens || tokens.length === 0) {
        console.log(`⚠️ No active devices found for user: ${userId}`);
        return;
      }

      // Send to each device
      const sendPromises = tokens.map(async (tokenData) => {
        try {
          if (tokenData.platform === 'web') {
            return await this.sendWebPushNotification(tokenData, payload, templateId);
          } else {
            return await this.sendFcmNotification(tokenData.token, payload, templateId);
          }
        } catch (error) {
          console.error(`❌ Failed to send to device ${tokenData.id}:`, error);
          // Mark token as inactive if it's invalid
          if (this.isTokenError(error)) {
            await this.deactivateToken(tokenData.id);
          }
          throw error;
        }
      });

      await Promise.allSettled(sendPromises);
      console.log(`✅ Notifications sent to ${tokens.length} devices for user: ${userId}`);
    } catch (error) {
      console.error('❌ Error sending to user devices:', error);
      throw error;
    }
  }

  /**
   * Send FCM notification (iOS/Android)
   */
  private async sendFcmNotification(token: string, payload: PushNotificationPayload, templateId: string): Promise<void> {
    try {
      const message = {
        token,
        notification: payload.notification,
        data: payload.data || {},
        android: payload.android,
        apns: payload.apns
      };

      const response = await admin.messaging().send(message);
      console.log('✅ FCM notification sent:', response);
      
      // Log successful send
      await this.logNotification({
        userId: '', // Will be filled by caller
        deviceTokenId: '',
        templateId,
        title: payload.notification.title,
        body: payload.notification.body,
        status: 'sent',
        platform: 'android', // Will be determined by caller
        sentAt: new Date()
      });
    } catch (error) {
      console.error('❌ FCM send error:', error);
      throw error;
    }
  }

  /**
   * Send web push notification
   */
  private async sendWebPushNotification(tokenData: any, payload: PushNotificationPayload, templateId: string): Promise<void> {
    try {
      const subscription = tokenData.web_subscription;
      if (!subscription) {
        throw new Error('No web subscription data');
      }

      const webPayload = JSON.stringify({
        title: payload.notification.title,
        body: payload.notification.body,
        icon: payload.notification.icon,
        badge: payload.notification.badge,
        data: payload.data
      });

      await webpush.sendNotification(subscription, webPayload);
      console.log('✅ Web push notification sent');
      
      // Log successful send
      await this.logNotification({
        userId: tokenData.user_id,
        deviceTokenId: tokenData.id,
        templateId,
        title: payload.notification.title,
        body: payload.notification.body,
        status: 'sent',
        platform: 'web',
        sentAt: new Date()
      });
    } catch (error) {
      console.error('❌ Web push send error:', error);
      throw error;
    }
  }

  /**
   * Setup cron jobs for scheduled notifications
   */
  private setupCronJobs(): void {
    // Breakfast reminder - 8:00 AM
    const breakfastJob = cron.schedule('0 8 * * *', async () => {
      await this.sendScheduledNotifications('meal_reminder_breakfast');
    });

    // Lunch reminder - 1:00 PM  
    const lunchJob = cron.schedule('0 13 * * *', async () => {
      await this.sendScheduledNotifications('meal_reminder_lunch');
    });

    // Dinner reminder - 7:00 PM
    const dinnerJob = cron.schedule('0 19 * * *', async () => {
      await this.sendScheduledNotifications('meal_reminder_dinner');
    });

    // Midday progress - 12:00 PM
    const middayJob = cron.schedule('0 12 * * *', async () => {
      await this.sendScheduledNotifications('calorie_progress_midday');
    });

    // Evening progress - 5:00 PM
    const eveningJob = cron.schedule('0 17 * * *', async () => {
      await this.sendScheduledNotifications('calorie_progress_evening');
    });

    // Morning motivation - 9:00 AM (weekdays)
    const motivationJob = cron.schedule('0 9 * * 1-5', async () => {
      await this.sendScheduledNotifications('motivation_morning');
    });

    // Store jobs
    this.cronJobs.set('breakfast', breakfastJob);
    this.cronJobs.set('lunch', lunchJob);
    this.cronJobs.set('dinner', dinnerJob);
    this.cronJobs.set('midday', middayJob);
    this.cronJobs.set('evening', eveningJob);
    this.cronJobs.set('motivation', motivationJob);

    // Jobs are automatically started by node-cron
    console.log('✅ All cron jobs scheduled successfully');
  }

  /**
   * Send scheduled notifications by template
   */
  private async sendScheduledNotifications(templateId: string): Promise<void> {
    try {
      console.log(`📅 Processing scheduled notifications: ${templateId}`);
      
      // Get all users with active devices and matching preferences
      const users = await this.getUsersForScheduledNotification(templateId);
      
      const sendPromises = users.map(async (user) => {
        try {
          await this.sendTestNotification(user.id, templateId, false);
        } catch (error) {
          console.error(`❌ Failed to send scheduled notification to user ${user.id}:`, error);
        }
      });

      await Promise.allSettled(sendPromises);
      console.log(`✅ Scheduled notifications processed: ${templateId} (${users.length} users)`);
    } catch (error) {
      console.error(`❌ Error processing scheduled notifications for ${templateId}:`, error);
    }
  }

  /**
   * Get users eligible for scheduled notification
   */
  private async getUsersForScheduledNotification(templateId: string): Promise<any[]> {
    try {
      // Get users with active device tokens and their preferences
      const { data: deviceTokens, error } = await supabase
        .from('device_tokens')
        .select('user_id')
        .eq('is_active', true);

      if (error || !deviceTokens) {
        console.error('Error getting device tokens:', error);
        return [];
      }

      const userIds = [...new Set(deviceTokens.map(dt => dt.user_id))];
      
      // Get preferences for these users
      const { data: preferences, error: prefsError } = await supabase
        .from('notification_preferences')
        .select('*')
        .in('user_id', userIds);

      if (prefsError) {
        console.error('Error getting preferences:', prefsError);
        return [];
      }

      // Filter users based on preferences and template type
      const eligibleUsers = preferences?.filter(prefs => {
        // Check if this notification type is enabled
        if (templateId.includes('meal_reminder') && !prefs.meal_reminders) return false;
        if (templateId.includes('calorie_progress') && !prefs.calorie_progress) return false;
        if (templateId.includes('motivation') && !prefs.motivational) return false;

        // Check quiet hours
        if (prefs.quiet_hours_enabled) {
          const now = new Date();
          const currentTime = now.getHours() * 60 + now.getMinutes();
          const startTime = this.parseTime(prefs.quiet_hours_start);
          const endTime = this.parseTime(prefs.quiet_hours_end);
          
          if (this.isInQuietHours(currentTime, startTime, endTime)) {
            return false;
          }
        }

        return true;
      }) || [];

      return eligibleUsers.map(prefs => ({ id: prefs.user_id }));
    } catch (error) {
      console.error('Error in getUsersForScheduledNotification:', error);
      return [];
    }
  }

  // Helper methods (implement based on your needs)
  private async getTemplate(templateId: string): Promise<NotificationTemplate | null> {
    // Implement template retrieval from database or config
    return null;
  }

  private async getUserContext(userId: string): Promise<UserContext> {
    // Implement user context retrieval
    return { userId };
  }

  private buildNotificationVariables(userContext: UserContext): NotificationVariables {
    const now = new Date();
    return {
      user: userContext,
      date: {
        today: now.toISOString().split('T')[0],
        time: now.toLocaleTimeString(),
        dayOfWeek: now.toLocaleDateString('pl-PL', { weekday: 'long' }),
        month: now.toLocaleDateString('pl-PL', { month: 'long' }),
        year: now.getFullYear().toString()
      },
      calories: {
        target: userContext.dailyCaloriesTarget || 2000,
        consumed: userContext.dailyCaloriesConsumed || 0,
        remaining: (userContext.dailyCaloriesTarget || 2000) - (userContext.dailyCaloriesConsumed || 0),
        percentage: userContext.dailyCaloriesTarget ? 
          Math.round(((userContext.dailyCaloriesConsumed || 0) / userContext.dailyCaloriesTarget) * 100) : 0
      },
      meals: {
        count: 0, // Implement meal count
        lastMealTime: userContext.lastMealTime?.toLocaleTimeString(),
        timeSinceLastMeal: userContext.lastMealTime ? 
          this.formatTimeSince(userContext.lastMealTime) : undefined
      },
      app: {
        name: 'Cut Sprint',
        version: '1.0.0'
      }
    };
  }

  private interpolateTemplate(template: NotificationTemplate, variables: NotificationVariables): { title: string; body: string } {
    // Implement template interpolation
    return {
      title: template.title,
      body: template.body
    };
  }

  private parseTime(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private isInQuietHours(currentTime: number, startTime: number, endTime: number): boolean {
    if (startTime <= endTime) {
      return currentTime >= startTime && currentTime <= endTime;
    } else {
      return currentTime >= startTime || currentTime <= endTime;
    }
  }

  private formatTimeSince(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}m temu`;
    } else {
      return `${diffMinutes}m temu`;
    }
  }

  private isTokenError(error: any): boolean {
    // Check if error indicates invalid token
    return error.code === 'messaging/invalid-registration-token' ||
           error.code === 'messaging/registration-token-not-registered';
  }

  private async deactivateToken(tokenId: string): Promise<void> {
    await supabase
      .from('device_tokens')
      .update({ is_active: false })
      .eq('id', tokenId);
  }

  private async logNotification(log: Partial<NotificationLog>): Promise<void> {
    await supabase
      .from('notification_logs')
      .insert({
        user_id: log.userId,
        device_token_id: log.deviceTokenId,
        template_id: log.templateId,
        title: log.title,
        body: log.body,
        status: log.status,
        platform: log.platform,
        sent_at: log.sentAt?.toISOString()
      });
  }

  // Placeholder methods to implement
  private async scheduleDefaultNotifications(userId: string): Promise<void> {}
  private async updateUserLastMealTime(userId: string, timestamp: Date): Promise<void> {}
  private async cancelPendingMealReminders(userId: string): Promise<void> {}
  private async scheduleNextMealReminders(userId: string, timestamp: Date): Promise<void> {}
  private async updateUserCalorieData(userId: string, calorieData: { consumed: number; target: number }): Promise<void> {}
  private async sendGoalAchievedNotification(userId: string): Promise<void> {}
  async unregisterDeviceToken(userId: string, token: string): Promise<void> {}
  async getNotificationHistory(userId: string, limit: number, offset: number): Promise<NotificationLog[]> { return []; }
  async getNotificationTemplates(): Promise<NotificationTemplate[]> { return []; }
  async getScheduledNotifications(userId: string): Promise<ScheduledNotification[]> { return []; }
}