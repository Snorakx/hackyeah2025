import React, { useState, useEffect } from 'react';
import { OnboardingEngine } from './OnboardingEngine';
import { AppConfig, OnboardingStep, OnboardingField } from '../types';
import { useTranslation } from '../localization/useTranslation';

interface OnboardingFormProps {
  engine: OnboardingEngine;
  onStepChange?: (step: OnboardingStep | null) => void;
  onComplete?: (userData: any) => void;
  onError?: (error: string) => void;
  localizationConfig?: any;
}

export const OnboardingForm: React.FC<OnboardingFormProps> = ({
  engine,
  onStepChange,
  onComplete,
  onError,
  localizationConfig
}) => {
  const [currentStep, setCurrentStep] = useState<OnboardingStep | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  
  // Initialize translations
  const { t, tWithFallback } = useTranslation(
    localizationConfig || {
      defaultLanguage: 'pl',
      supportedLanguages: ['pl'],
      translations: { pl: {} }
    }
  );

  useEffect(() => {
    const step = engine.getCurrentStep();
    setCurrentStep(step);
    onStepChange?.(step);
  }, [engine, onStepChange]);

  const handleFieldChange = (fieldKey: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldKey]: value
    }));

    // Clear error for this field
    if (errors[fieldKey]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldKey];
        return newErrors;
      });
    }
  };

  const handleNext = async () => {
    if (!currentStep) return;

    try {
      setIsLoading(true);
      
      // Validate current step
      if (!engine.isStepValid(currentStep.id, formData)) {
        throw new Error('Please fill in all required fields');
      }

      // Save step data
      engine.saveStepData(currentStep.id, formData);

      // Get next step
      const nextStep = engine.getNextStep();
      
      if (nextStep) {
        setCurrentStep(nextStep);
        setFormData({});
        setErrors({});
        onStepChange?.(nextStep);
      } else {
        // Onboarding complete
        const userData = engine.getUserData();
        onComplete?.(userData);
      }
    } catch (error: any) {
      setErrors({ general: error.message });
      onError?.(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrevious = () => {
    const prevStep = engine.getPreviousStep();
    if (prevStep) {
      setCurrentStep(prevStep);
      setFormData({});
      setErrors({});
      onStepChange?.(prevStep);
    }
  };

  const renderField = (field: OnboardingField) => {
    const value = formData[field.key] || field.defaultValue || '';
    const error = errors[field.key];

    // Get translated label and placeholder
    const label = tWithFallback(`fields.${field.key}.label`, field.label);
    const placeholder = tWithFallback(`fields.${field.key}.placeholder`, field.placeholder || '');

    const commonProps = {
      id: field.key,
      name: field.key,
      value: value,
      onChange: (e: any) => handleFieldChange(field.key, e.target.value),
      placeholder: placeholder,
      required: field.required,
      className: `w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
        error ? 'border-red-500' : 'border-gray-300'
      }`
    };

    switch (field.type) {
      case 'text':
      case 'email':
        return (
          <input
            {...commonProps}
            type={field.type}
          />
        );

      case 'number':
        return (
          <input
            {...commonProps}
            type="number"
            min={field.validation?.min}
            max={field.validation?.max}
          />
        );

      case 'date':
        return (
          <input
            {...commonProps}
            type="date"
          />
        );

      case 'select':
        return (
          <select {...commonProps}>
            <option value="">{t('buttons.select', 'Wybierz...')}</option>
            {field.options?.map(option => (
              <option key={option.value} value={option.value}>
                {tWithFallback(`fields.${field.key}.${option.value}`, option.label)}
              </option>
            ))}
          </select>
        );

      case 'multiselect':
        return (
          <div className="form-checkboxes">
            {field.options?.map(option => (
              <label key={option.value} className="form-checkbox">
                <input
                  type="checkbox"
                  checked={Array.isArray(value) && value.includes(option.value)}
                  onChange={(e) => {
                    const currentValues = Array.isArray(value) ? value : [];
                    if (e.target.checked) {
                      handleFieldChange(field.key, [...currentValues, option.value]);
                    } else {
                      handleFieldChange(field.key, currentValues.filter(v => v !== option.value));
                    }
                  }}
                />
                <span>{tWithFallback(`fields.${field.key}.${option.value}`, option.label)}</span>
              </label>
            ))}
          </div>
        );

      case 'boolean':
        return (
          <label className="form-checkbox">
            <input
              type="checkbox"
              checked={value === true}
              onChange={(e) => handleFieldChange(field.key, e.target.checked)}
            />
            <span>{label}</span>
          </label>
        );

      case 'range':
        return (
          <div>
            <input
              {...commonProps}
              type="range"
              min={field.validation?.min || 0}
              max={field.validation?.max || 100}
            />
            <div className="form-range-value">
              {value} {field.validation?.min && field.validation?.max && 
                `(${field.validation.min} - ${field.validation.max})`}
            </div>
          </div>
        );

      default:
        return (
          <input
            {...commonProps}
            type="text"
          />
        );
    }
  };

  if (!currentStep) {
    return (
      <div className="onboarding-complete">
        <p className="onboarding-complete-message">Onboarding zakończony!</p>
      </div>
    );
  }

  return (
    <div className="onboarding-form">
      <div className="onboarding-header">
        <h1 className="onboarding-title">
          {currentStep.title}
        </h1>
        {currentStep.description && (
          <p className="onboarding-description">{currentStep.description}</p>
        )}
      </div>

      <form onSubmit={(e) => { e.preventDefault(); handleNext(); }} className="onboarding-form-content">
        {currentStep.fields.map(field => (
          <div key={field.key} className="onboarding-field">
            <label htmlFor={field.key} className="onboarding-label">
              {field.label}
              {field.required && <span className="onboarding-required">*</span>}
            </label>
            
            {renderField(field)}
            
            {errors[field.key] && (
              <p className="onboarding-error">{errors[field.key]}</p>
            )}
          </div>
        ))}

        {errors.general && (
          <div className="onboarding-error-general">
            <p className="onboarding-error-message">{errors.general}</p>
          </div>
        )}

        <div className="onboarding-navigation">
          <button
            type="button"
            onClick={handlePrevious}
            className="ui-button ui-button--md ui-button--outline"
            disabled={engine.currentStepIndex === 0}
          >
            Wstecz
          </button>
          
          <button
            type="submit"
            disabled={isLoading}
            className="ui-button ui-button--md ui-button--primary"
          >
            {isLoading ? 'Zapisywanie...' : 'Dalej'}
          </button>
        </div>
      </form>
    </div>
  );
};
