import { useState, useEffect, useCallback } from 'react';
import { LocalizationService } from './LocalizationService';
import { LocalizationConfig } from '../types';

export interface UseTranslationReturn {
  t: (key: string, params?: Record<string, any>) => string;
  tWithFallback: (key: string, fallback: string, params?: Record<string, any>) => string;
  tPlural: (key: string, count: number, params?: Record<string, any>) => string;
  tConditional: (key: string, condition: boolean, params?: Record<string, any>) => string;
  setLanguage: (language: string) => void;
  currentLanguage: string;
  supportedLanguages: string[];
  hasKey: (key: string) => boolean;
  getNamespace: (namespace: string) => Record<string, string>;
}

export function useTranslation(config: LocalizationConfig): UseTranslationReturn {
  const [localizationService] = useState(() => new LocalizationService(config));
  const [currentLanguage, setCurrentLanguage] = useState(config.defaultLanguage);
  const [forceUpdate, setForceUpdate] = useState(0);

  // Force re-render when language changes
  const forceRerender = useCallback(() => {
    setForceUpdate(prev => prev + 1);
  }, []);

  const setLanguage = useCallback((language: string) => {
    localizationService.setLanguage(language);
    setCurrentLanguage(language);
    forceRerender();
  }, [localizationService, forceRerender]);

  const t = useCallback((key: string, params?: Record<string, any>) => {
    return localizationService.t(key, params);
  }, [localizationService, forceUpdate]);

  const tWithFallback = useCallback((key: string, fallback: string, params?: Record<string, any>) => {
    return localizationService.tWithFallback(key, fallback, params);
  }, [localizationService, forceUpdate]);

  const tPlural = useCallback((key: string, count: number, params?: Record<string, any>) => {
    return localizationService.tPlural(key, count, params);
  }, [localizationService, forceUpdate]);

  const tConditional = useCallback((key: string, condition: boolean, params?: Record<string, any>) => {
    return localizationService.tConditional(key, condition, params);
  }, [localizationService, forceUpdate]);

  const hasKey = useCallback((key: string) => {
    return localizationService.hasKey(key);
  }, [localizationService, forceUpdate]);

  const getNamespace = useCallback((namespace: string) => {
    return localizationService.getNamespace(namespace);
  }, [localizationService, forceUpdate]);

  return {
    t,
    tWithFallback,
    tPlural,
    tConditional,
    setLanguage,
    currentLanguage,
    supportedLanguages: localizationService.getSupportedLanguages(),
    hasKey,
    getNamespace
  };
}

// Hook for simple translation without config
export function useSimpleTranslation(translations: Record<string, string>) {
  const t = useCallback((key: string, params?: Record<string, any>) => {
    let translation = translations[key] || key;
    
    if (params) {
      Object.entries(params).forEach(([paramKey, paramValue]) => {
        translation = translation.replace(
          new RegExp(`{{${paramKey}}}`, 'g'), 
          String(paramValue)
        );
      });
    }
    
    return translation;
  }, [translations]);

  return { t };
}
