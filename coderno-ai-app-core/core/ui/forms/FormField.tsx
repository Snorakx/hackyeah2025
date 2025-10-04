import React from 'react';
import { OnboardingField } from '../../types';
import { useTranslation } from '../../localization/useTranslation';

interface FormFieldProps {
  field: OnboardingField;
  value: any;
  onChange: (key: string, value: any) => void;
  error?: string;
  translations?: any;
}

export const FormField: React.FC<FormFieldProps> = ({
  field,
  value,
  onChange,
  error,
  translations
}) => {
  const { t, tWithFallback } = useTranslation(
    translations || {
      defaultLanguage: 'pl',
      supportedLanguages: ['pl'],
      translations: { pl: {} }
    }
  );

  const handleChange = (newValue: any) => {
    onChange(field.key, newValue);
  };

  const getLabel = () => {
    return tWithFallback(`fields.${field.key}.label`, field.label);
  };

  const getPlaceholder = () => {
    return tWithFallback(`fields.${field.key}.placeholder`, field.placeholder || '');
  };

  const getOptionLabel = (option: any) => {
    return tWithFallback(`fields.${field.key}.${option.value}`, option.label);
  };

  const commonProps = {
    id: field.key,
    name: field.key,
    value: value || field.defaultValue || '',
    required: field.required,
    className: `ui-input ${error ? 'ui-input--error' : ''}`
  };

  const renderInput = () => {
    switch (field.type) {
      case 'text':
      case 'email':
        return (
          <input
            {...commonProps}
            type={field.type}
            placeholder={getPlaceholder()}
            onChange={(e) => handleChange(e.target.value)}
          />
        );

      case 'number':
        return (
          <input
            {...commonProps}
            type="number"
            placeholder={getPlaceholder()}
            min={field.validation?.min}
            max={field.validation?.max}
            onChange={(e) => handleChange(parseFloat(e.target.value) || 0)}
          />
        );

      case 'date':
        return (
          <input
            {...commonProps}
            type="date"
            onChange={(e) => handleChange(e.target.value)}
          />
        );

      case 'select':
        return (
          <select
            {...commonProps}
            onChange={(e) => handleChange(e.target.value)}
          >
            <option value="">{t('buttons.select', 'Wybierz...')}</option>
            {field.options?.map(option => (
              <option key={option.value} value={option.value}>
                {getOptionLabel(option)}
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
                      handleChange([...currentValues, option.value]);
                    } else {
                      handleChange(currentValues.filter(v => v !== option.value));
                    }
                  }}
                />
                <span>{getOptionLabel(option)}</span>
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
              onChange={(e) => handleChange(e.target.checked)}
            />
            <span>{getLabel()}</span>
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
              onChange={(e) => handleChange(parseFloat(e.target.value))}
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
            placeholder={getPlaceholder()}
            onChange={(e) => handleChange(e.target.value)}
          />
        );
    }
  };

  return (
    <div className="form-field">
      {field.type !== 'boolean' && (
        <label htmlFor={field.key} className="form-label">
          {getLabel()}
          {field.required && <span className="form-required">*</span>}
        </label>
      )}
      
      {renderInput()}
      
      {error && (
        <p className="form-error">{error}</p>
      )}
    </div>
  );
};
