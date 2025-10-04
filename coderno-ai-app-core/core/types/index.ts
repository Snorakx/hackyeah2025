// Universal Framework Core Types - Domain Agnostic

export interface AppConfig {
  app: {
    name: string;
    version: string;
    description?: string;
  };
  onboarding: OnboardingConfig;
  ai: AIConfig;
  database: DatabaseConfig;
  ui: UIConfig;
}

export interface OnboardingConfig {
  steps: OnboardingStep[];
  validation: ValidationConfig;
  completion: CompletionConfig;
}

export interface OnboardingStep {
  id: string;
  title: string;
  description?: string;
  fields: OnboardingField[];
  conditional?: ConditionalLogic;
}

export interface OnboardingField {
  key: string;
  type: 'text' | 'number' | 'email' | 'select' | 'multiselect' | 'date' | 'boolean' | 'range';
  label: string;
  placeholder?: string;
  required: boolean;
  options?: FieldOption[];
  validation?: FieldValidation;
  conditional?: ConditionalLogic;
  defaultValue?: any;
}

export interface FieldOption {
  value: string;
  label: string;
  description?: string;
}

export interface FieldValidation {
  min?: number;
  max?: number;
  pattern?: string;
  custom?: string;
}

export interface ConditionalLogic {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
  value: any;
  show?: boolean;
  hide?: boolean;
}

export interface ValidationConfig {
  rules: ValidationRule[];
  messages: ValidationMessages;
}

export interface ValidationRule {
  field: string;
  type: 'required' | 'email' | 'min' | 'max' | 'pattern' | 'custom';
  value?: any;
  message: string;
}

export interface ValidationMessages {
  [key: string]: string;
}

export interface CompletionConfig {
  redirectTo: string;
  successMessage: string;
  createUserRecord: boolean;
  generateInitialData: boolean;
}

export interface AIConfig {
  provider: 'openai' | 'openrouter' | 'anthropic' | 'custom';
  apiKey: string;
  prompts: AIPromptConfig[];
  responseFormats: ResponseFormat[];
}

export interface AIPromptConfig {
  id: string;
  name: string;
  systemPrompt: string;
  userContextTemplate: string;
  responseFormat: string;
  examples: AIExample[];
  temperature?: number;
  maxTokens?: number;
}

export interface AIExample {
  input: string;
  output: any;
  context?: any;
}

export interface ResponseFormat {
  id: string;
  name: string;
  schema: any;
  validation: any;
}

export interface DatabaseConfig {
  tables: TableConfig[];
  relationships: RelationshipConfig[];
  indexes: IndexConfig[];
}

export interface TableConfig {
  name: string;
  fields: TableField[];
  primaryKey: string;
  timestamps: boolean;
}

export interface TableField {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'json' | 'date' | 'uuid';
  required: boolean;
  unique?: boolean;
  defaultValue?: any;
  constraints?: any;
}

export interface RelationshipConfig {
  from: string;
  to: string;
  type: 'one-to-one' | 'one-to-many' | 'many-to-many';
  foreignKey: string;
}

export interface IndexConfig {
  table: string;
  fields: string[];
  unique?: boolean;
}

export interface UIConfig {
  theme: ThemeConfig;
  components: ComponentConfig[];
  layouts: LayoutConfig[];
}

export interface ThemeConfig {
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  borderRadius: string;
  spacing: SpacingConfig;
}

export interface SpacingConfig {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
}

export interface ComponentConfig {
  id: string;
  type: 'form' | 'card' | 'list' | 'chart' | 'button' | 'input';
  props: any;
  styles: any;
}

export interface LayoutConfig {
  id: string;
  name: string;
  components: string[];
  responsive: ResponsiveConfig;
}

export interface ResponsiveConfig {
  mobile: any;
  tablet: any;
  desktop: any;
}

// Service Layer Types
export interface ServiceConfig {
  name: string;
  dependencies: string[];
  methods: ServiceMethod[];
}

export interface ServiceMethod {
  name: string;
  parameters: ParameterConfig[];
  returnType: string;
  implementation: string;
}

export interface ParameterConfig {
  name: string;
  type: string;
  required: boolean;
  defaultValue?: any;
}

// Repository Types
export interface RepositoryConfig {
  name: string;
  table: string;
  methods: RepositoryMethod[];
  relationships: string[];
}

export interface RepositoryMethod {
  name: string;
  type: 'create' | 'read' | 'update' | 'delete' | 'custom';
  query: string;
  parameters: ParameterConfig[];
}

// User Data Types
export interface UserData {
  [key: string]: any;
}

export interface OnboardingData {
  stepId: string;
  fieldKey: string;
  value: any;
  timestamp: string;
}

export interface AISession {
  id: string;
  userId: string;
  promptId: string;
  input: any;
  output: any;
  context: any;
  timestamp: string;
}

// API Types
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T = any> extends APIResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
