export interface DeviceToken {
  id: string;
  userId: string;
  token: string;
  platform: 'ios' | 'android' | 'web';
  deviceId: string;
  isActive: boolean;
  registeredAt: Date;
  lastUsed: Date;
  webSubscription?: WebPushSubscription;
}

export interface WebPushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface NotificationPreferences {
  userId: string;
  mealReminders: boolean;
  calorieProgress: boolean;
  motivational: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string; // "22:00"
  quietHoursEnd: string;   // "07:00"
  timezone: string;
  updatedAt: Date;
}

export interface NotificationTemplate {
  id: string;
  name: string;
  type: NotificationType;
  title: string;
  body: string;
  category: string;
  priority: 'low' | 'normal' | 'high';
  variables: string[];
  conditions?: NotificationCondition[];
  schedule?: NotificationSchedule;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationCondition {
  field: string;
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte' | 'exists';
  value: any;
}

export interface NotificationSchedule {
  type: 'time' | 'interval' | 'event';
  value: string | number;
  days?: ('monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday')[];
  timeRanges?: {
    start: string;
    end: string;
  }[];
}

export type NotificationType = 
  | 'meal_reminder' 
  | 'calorie_progress' 
  | 'daily_summary' 
  | 'motivation' 
  | 'goal_reminder'
  | 'achievement';

export interface ScheduledNotification {
  id: string;
  userId: string;
  templateId: string;
  scheduledFor: Date;
  title: string;
  body: string;
  data?: any;
  status: 'pending' | 'sent' | 'failed' | 'cancelled';
  attempts: number;
  maxAttempts: number;
  createdAt: Date;
  sentAt?: Date;
  error?: string;
}

export interface NotificationLog {
  id: string;
  userId: string;
  deviceTokenId: string;
  templateId: string;
  title: string;
  body: string;
  status: 'sent' | 'delivered' | 'clicked' | 'failed';
  platform: 'ios' | 'android' | 'web';
  sentAt: Date;
  deliveredAt?: Date;
  clickedAt?: Date;
  error?: string;
  data?: any;
}

export interface UserContext {
  userId: string;
  displayName?: string;
  gender?: 'male' | 'female' | 'other';
  email?: string;
  region?: string;
  timezone?: string;
  dailyCaloriesTarget?: number;
  dailyCaloriesConsumed?: number;
  lastMealTime?: Date;
  weight?: number;
  height?: number;
  age?: number;
}

export interface NotificationVariables {
  user: UserContext;
  date: {
    today: string;
    time: string;
    dayOfWeek: string;
    month: string;
    year: string;
  };
  calories: {
    target: number;
    consumed: number;
    remaining: number;
    percentage: number;
  };
  meals: {
    count: number;
    lastMealTime?: string;
    timeSinceLastMeal?: string;
  };
  app: {
    name: string;
    version: string;
  };
}

export interface PushNotificationPayload {
  to?: string; // FCM token
  notification: {
    title: string;
    body: string;
    icon?: string;
    badge?: string;
    sound?: string;
    click_action?: string;
  };
  data?: {
    [key: string]: string;
  };
  android?: {
    notification: {
      icon?: string;
      color?: string;
      sound?: string;
      default_sound?: boolean;
      tag?: string;
      click_action?: string;
      body_loc_key?: string;
      body_loc_args?: string[];
      title_loc_key?: string;
      title_loc_args?: string[];
    };
  };
  apns?: {
    payload: {
      aps: {
        alert?: {
          title?: string;
          body?: string;
          'title-loc-key'?: string;
          'title-loc-args'?: string[];
          'body-loc-key'?: string;
          'body-loc-args'?: string[];
        };
        badge?: number;
        sound?: string;
        'content-available'?: number;
        'mutable-content'?: number;
        category?: string;
        'thread-id'?: string;
      };
    };
  };
}

export interface NotificationEvent {
  userId: string;
  eventType: 'meal_added' | 'calorie_update' | 'app_opened' | 'goal_achieved';
  data?: any;
  timestamp: Date;
}

// API Request/Response Types
export interface RegisterDeviceRequest {
  userId: string;
  token: string;
  platform: 'ios' | 'android';
  deviceId: string;
}

export interface RegisterWebRequest {
  userId: string;
  subscription: WebPushSubscription;
  platform: 'web';
}

export interface UpdatePreferencesRequest {
  userId: string;
  preferences: NotificationPreferences;
}

export interface SendTestNotificationRequest {
  userId: string;
  templateId: string;
  testMode?: boolean;
}

export interface NotificationEventRequest {
  userId: string;
  eventType: string;
  data?: any;
  timestamp: string;
}

export interface CalorieUpdateRequest {
  userId: string;
  calorieData: {
    consumed: number;
    target: number;
  };
  timestamp: string;
}

export interface MealAddedRequest {
  userId: string;
  mealData: {
    name: string;
    calories: number;
    mealType: string;
  };
  timestamp: string;
}