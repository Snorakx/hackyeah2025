import { 
  AppConfig, 
  OnboardingStep, 
  OnboardingField, 
  OnboardingData,
  UserData,
  APIResponse 
} from '../types';

export class OnboardingEngine {
  private config: AppConfig;
  private currentStepIndex: number = 0;
  private userData: UserData = {};
  private stepData: OnboardingData[] = [];

  constructor(config: AppConfig) {
    this.config = config;
  }

  /**
   * Get current onboarding step
   */
  getCurrentStep(): OnboardingStep | null {
    const steps = this.config.onboarding.steps;
    if (this.currentStepIndex >= steps.length) {
      return null;
    }
    return steps[this.currentStepIndex];
  }

  /**
   * Get all onboarding steps
   */
  getAllSteps(): OnboardingStep[] {
    return this.config.onboarding.steps;
  }

  /**
   * Get step by index
   */
  getStep(index: number): OnboardingStep | null {
    const steps = this.config.onboarding.steps;
    if (index < 0 || index >= steps.length) {
      return null;
    }
    return steps[index];
  }

  /**
   * Get next step
   */
  getNextStep(): OnboardingStep | null {
    this.currentStepIndex++;
    return this.getCurrentStep();
  }

  /**
   * Get previous step
   */
  getPreviousStep(): OnboardingStep | null {
    if (this.currentStepIndex > 0) {
      this.currentStepIndex--;
      return this.getCurrentStep();
    }
    return null;
  }

  /**
   * Set current step index
   */
  setCurrentStep(index: number): boolean {
    if (index >= 0 && index < this.config.onboarding.steps.length) {
      this.currentStepIndex = index;
      return true;
    }
    return false;
  }

  /**
   * Save step data
   */
  saveStepData(stepId: string, data: Record<string, any>): void {
    const step = this.config.onboarding.steps.find(s => s.id === stepId);
    if (!step) {
      throw new Error(`Step with id ${stepId} not found`);
    }

    // Validate step data
    this.validateStepData(step, data);

    // Save to user data
    Object.assign(this.userData, data);

    // Save to step data
    Object.entries(data).forEach(([key, value]) => {
      this.stepData.push({
        stepId,
        fieldKey: key,
        value,
        timestamp: new Date().toISOString()
      });
    });
  }

  /**
   * Get user data
   */
  getUserData(): UserData {
    return { ...this.userData };
  }

  /**
   * Get step data
   */
  getStepData(): OnboardingData[] {
    return [...this.stepData];
  }

  /**
   * Check if step is valid
   */
  isStepValid(stepId: string, data: Record<string, any>): boolean {
    const step = this.config.onboarding.steps.find(s => s.id === stepId);
    if (!step) {
      return false;
    }

    try {
      this.validateStepData(step, data);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if onboarding is complete
   */
  isComplete(): boolean {
    return this.currentStepIndex >= this.config.onboarding.steps.length;
  }

  /**
   * Get completion config
   */
  getCompletionConfig() {
    return this.config.onboarding.completion;
  }

  /**
   * Reset onboarding
   */
  reset(): void {
    this.currentStepIndex = 0;
    this.userData = {};
    this.stepData = [];
  }

  /**
   * Validate step data
   */
  private validateStepData(step: OnboardingStep, data: Record<string, any>): void {
    const validationRules = this.config.onboarding.validation.rules;
    const messages = this.config.onboarding.validation.messages;

    // Check required fields
    step.fields.forEach(field => {
      if (field.required && (data[field.key] === undefined || data[field.key] === null || data[field.key] === '')) {
        throw new Error(messages.required || `Field ${field.key} is required`);
      }
    });

    // Apply validation rules
    validationRules.forEach(rule => {
      const value = data[rule.field];
      if (value !== undefined && value !== null && value !== '') {
        switch (rule.type) {
          case 'required':
            if (!value) {
              throw new Error(rule.message);
            }
            break;
          case 'email':
            if (!this.isValidEmail(value)) {
              throw new Error(rule.message);
            }
            break;
          case 'min':
            if (typeof value === 'number' && value < rule.value) {
              throw new Error(rule.message);
            }
            break;
          case 'max':
            if (typeof value === 'number' && value > rule.value) {
              throw new Error(rule.message);
            }
            break;
          case 'pattern':
            if (!new RegExp(rule.value).test(value)) {
              throw new Error(rule.message);
            }
            break;
        }
      }
    });

    // Apply field-specific validation
    step.fields.forEach(field => {
      const value = data[field.key];
      if (value !== undefined && value !== null && value !== '' && field.validation) {
        this.validateField(field, value);
      }
    });
  }

  /**
   * Validate individual field
   */
  private validateField(field: OnboardingField, value: any): void {
    if (field.validation) {
      if (field.validation.min !== undefined && value < field.validation.min) {
        throw new Error(`Value must be at least ${field.validation.min}`);
      }
      if (field.validation.max !== undefined && value > field.validation.max) {
        throw new Error(`Value must be at most ${field.validation.max}`);
      }
      if (field.validation.pattern && !new RegExp(field.validation.pattern).test(value)) {
        throw new Error('Invalid format');
      }
    }
  }

  /**
   * Check if email is valid
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Get conditional fields for current step
   */
  getConditionalFields(step: OnboardingStep, userData: UserData): OnboardingField[] {
    return step.fields.filter(field => {
      if (!field.conditional) {
        return true;
      }

      const { field: targetField, operator, value } = field.conditional;
      const targetValue = userData[targetField];

      switch (operator) {
        case 'equals':
          return targetValue === value;
        case 'not_equals':
          return targetValue !== value;
        case 'contains':
          return Array.isArray(targetValue) && targetValue.includes(value);
        case 'greater_than':
          return typeof targetValue === 'number' && targetValue > value;
        case 'less_than':
          return typeof targetValue === 'number' && targetValue < value;
        default:
          return true;
      }
    });
  }

  /**
   * Export onboarding data for API
   */
  exportForAPI(): APIResponse<{
    userData: UserData;
    stepData: OnboardingData[];
    completed: boolean;
  }> {
    return {
      success: true,
      data: {
        userData: this.getUserData(),
        stepData: this.getStepData(),
        completed: this.isComplete()
      }
    };
  }
}
