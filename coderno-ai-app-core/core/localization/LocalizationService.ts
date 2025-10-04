import { LocalizationConfig } from '../types';

export class LocalizationService {
  private config: LocalizationConfig;
  private currentLanguage: string;
  private translations: Record<string, string> = {};

  constructor(config: LocalizationConfig) {
    this.config = config;
    this.currentLanguage = config.defaultLanguage;
    this.loadTranslations();
  }

  /**
   * Load translations for current language
   */
  private loadTranslations(): void {
    this.translations = this.config.translations[this.currentLanguage] || {};
  }

  /**
   * Get translation by key
   */
  t(key: string, params?: Record<string, any>): string {
    let translation = this.translations[key] || key;
    
    // Replace parameters in translation
    if (params) {
      Object.entries(params).forEach(([paramKey, paramValue]) => {
        translation = translation.replace(
          new RegExp(`{{${paramKey}}}`, 'g'), 
          String(paramValue)
        );
      });
    }
    
    return translation;
  }

  /**
   * Get translation with fallback
   */
  tWithFallback(key: string, fallback: string, params?: Record<string, any>): string {
    const translation = this.t(key, params);
    return translation !== key ? translation : fallback;
  }

  /**
   * Set current language
   */
  setLanguage(language: string): void {
    if (this.config.supportedLanguages.includes(language)) {
      this.currentLanguage = language;
      this.loadTranslations();
    } else {
      console.warn(`Language ${language} is not supported. Available: ${this.config.supportedLanguages.join(', ')}`);
    }
  }

  /**
   * Get current language
   */
  getCurrentLanguage(): string {
    return this.currentLanguage;
  }

  /**
   * Get supported languages
   */
  getSupportedLanguages(): string[] {
    return this.config.supportedLanguages;
  }

  /**
   * Check if key exists
   */
  hasKey(key: string): boolean {
    return key in this.translations;
  }

  /**
   * Get all translations for current language
   */
  getAllTranslations(): Record<string, string> {
    return { ...this.translations };
  }

  /**
   * Get translations for specific namespace
   */
  getNamespace(namespace: string): Record<string, string> {
    const namespaceTranslations: Record<string, string> = {};
    
    Object.entries(this.translations).forEach(([key, value]) => {
      if (key.startsWith(`${namespace}.`)) {
        const shortKey = key.substring(namespace.length + 1);
        namespaceTranslations[shortKey] = value;
      }
    });
    
    return namespaceTranslations;
  }

  /**
   * Format translation with pluralization
   */
  tPlural(key: string, count: number, params?: Record<string, any>): string {
    const baseKey = key;
    const pluralKey = `${key}_plural`;
    
    // Try plural form first
    if (count !== 1 && this.hasKey(pluralKey)) {
      return this.t(pluralKey, { ...params, count });
    }
    
    // Fall back to singular form
    return this.t(baseKey, { ...params, count });
  }

  /**
   * Format translation with conditional logic
   */
  tConditional(key: string, condition: boolean, params?: Record<string, any>): string {
    const trueKey = `${key}_true`;
    const falseKey = `${key}_false`;
    
    if (condition && this.hasKey(trueKey)) {
      return this.t(trueKey, params);
    } else if (!condition && this.hasKey(falseKey)) {
      return this.t(falseKey, params);
    }
    
    // Fall back to base key
    return this.t(key, params);
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<LocalizationConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.loadTranslations();
  }

  /**
   * Get configuration
   */
  getConfig(): LocalizationConfig {
    return { ...this.config };
  }
}
