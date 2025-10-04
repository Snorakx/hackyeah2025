// Extended configuration types for additional features

export interface NotificationConfig {
  enabled: boolean;
  templates: NotificationTemplate[];
  settings: NotificationSettings;
}

export interface NotificationTemplate {
  id: string;
  title: string;
  body: string;
  type: string;
  category: string;
  priority: 'low' | 'normal' | 'high';
  enabled: boolean;
  variables: string[];
  triggers: NotificationTrigger[];
  schedule: NotificationSchedule;
  conditions?: NotificationCondition[];
}

export interface NotificationTrigger {
  type: 'time' | 'interval' | 'event';
  value: string | number;
  eventType?: string;
  delay?: number;
}

export interface NotificationSchedule {
  days: string[];
  timeRanges?: TimeRange[];
  maxPerDay: number;
  cooldownMinutes: number;
}

export interface TimeRange {
  start: string;
  end: string;
}

export interface NotificationCondition {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte' | 'exists' | 'contains';
  value: any;
}

export interface NotificationSettings {
  allowSound: boolean;
  allowVibration: boolean;
  quietHours: QuietHours;
  categories: NotificationCategory[];
}

export interface QuietHours {
  enabled: boolean;
  start: string;
  end: string;
}

export interface NotificationCategory {
  name: string;
  enabled: boolean;
  priority: 'low' | 'normal' | 'high';
}

export interface DashboardConfig {
  widgets: DashboardWidget[];
  layout: DashboardLayout;
  refreshInterval: number;
}

export interface DashboardWidget {
  id: string;
  type: 'card' | 'chart' | 'metric' | 'list' | 'progress';
  title: string;
  size: 'small' | 'medium' | 'large';
  position: { x: number; y: number; w: number; h: number };
  config: WidgetConfig;
  dataSource: DataSource;
}

export interface WidgetConfig {
  [key: string]: any;
}

export interface DataSource {
  type: 'api' | 'database' | 'calculation';
  endpoint?: string;
  query?: string;
  calculation?: CalculationConfig;
}

export interface CalculationConfig {
  formula: string;
  variables: string[];
  unit?: string;
}

export interface DashboardLayout {
  columns: number;
  breakpoints: {
    mobile: number;
    tablet: number;
    desktop: number;
  };
}

export interface APIConfig {
  endpoints: APIEndpoint[];
  middleware: MiddlewareConfig[];
  rateLimiting: RateLimitConfig;
}

export interface APIEndpoint {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  handler: string;
  middleware: string[];
  validation: ValidationConfig;
  documentation: EndpointDocumentation;
}

export interface MiddlewareConfig {
  name: string;
  type: 'auth' | 'validation' | 'rateLimit' | 'cors' | 'logging';
  config: any;
}

export interface RateLimitConfig {
  windowMs: number;
  max: number;
  message: string;
}

export interface EndpointDocumentation {
  summary: string;
  description: string;
  parameters: ParameterDocumentation[];
  responses: ResponseDocumentation[];
}

export interface ParameterDocumentation {
  name: string;
  type: string;
  required: boolean;
  description: string;
}

export interface ResponseDocumentation {
  status: number;
  description: string;
  schema: any;
}

export interface BusinessLogicConfig {
  calculations: CalculationRule[];
  workflows: WorkflowConfig[];
  rules: BusinessRule[];
}

export interface CalculationRule {
  id: string;
  name: string;
  formula: string;
  variables: string[];
  unit: string;
  description: string;
}

export interface WorkflowConfig {
  id: string;
  name: string;
  steps: WorkflowStep[];
  triggers: WorkflowTrigger[];
}

export interface WorkflowStep {
  id: string;
  type: 'action' | 'condition' | 'delay' | 'notification';
  config: any;
  next?: string;
}

export interface WorkflowTrigger {
  type: 'event' | 'schedule' | 'condition';
  config: any;
}

export interface BusinessRule {
  id: string;
  name: string;
  condition: string;
  action: string;
  priority: number;
  enabled: boolean;
}

export interface LocalizationConfig {
  defaultLanguage: string;
  supportedLanguages: string[];
  translations: TranslationConfig;
}

export interface TranslationConfig {
  [language: string]: {
    [key: string]: string;
  };
}

export interface SecurityConfig {
  authentication: AuthConfig;
  authorization: AuthorizationConfig;
  encryption: EncryptionConfig;
}

export interface AuthConfig {
  provider: 'supabase' | 'firebase' | 'custom';
  config: any;
}

export interface AuthorizationConfig {
  roles: RoleConfig[];
  permissions: PermissionConfig[];
}

export interface RoleConfig {
  name: string;
  permissions: string[];
}

export interface PermissionConfig {
  resource: string;
  actions: string[];
}

export interface EncryptionConfig {
  algorithm: string;
  keyLength: number;
}

// Extended AppConfig with all features
export interface ExtendedAppConfig extends AppConfig {
  notifications?: NotificationConfig;
  dashboard?: DashboardConfig;
  api?: APIConfig;
  businessLogic?: BusinessLogicConfig;
  localization?: LocalizationConfig;
  security?: SecurityConfig;
}
