import React from 'react';
import { OnboardingStep } from '../../types';
import { FormField } from './FormField';
import { useTranslation } from '../../localization/useTranslation';

interface FormStepProps {
  step: OnboardingStep;
  formData: Record<string, any>;
  errors: Record<string, string>;
  onFieldChange: (key: string, value: any) => void;
  translations?: any;
}

export const FormStep: React.FC<FormStepProps> = ({
  step,
  formData,
  errors,
  onFieldChange,
  translations
}) => {
  const { t, tWithFallback } = useTranslation(
    translations || {
      defaultLanguage: 'pl',
      supportedLanguages: ['pl'],
      translations: { pl: {} }
    }
  );

  const getStepTitle = () => {
    return tWithFallback(`onboarding.${step.id}.title`, step.title);
  };

  const getStepDescription = () => {
    return tWithFallback(`onboarding.${step.id}.description`, step.description || '');
  };

  return (
    <div className="form-step">
      <div className="form-step-header">
        <h1 className="form-step-title">
          {getStepTitle()}
        </h1>
        {step.description && (
          <p className="form-step-description">{getStepDescription()}</p>
        )}
      </div>

      <div className="form-step-fields">
        {step.fields.map(field => (
          <FormField
            key={field.key}
            field={field}
            value={formData[field.key]}
            onChange={onFieldChange}
            error={errors[field.key]}
            translations={translations}
          />
        ))}
      </div>
    </div>
  );
};
