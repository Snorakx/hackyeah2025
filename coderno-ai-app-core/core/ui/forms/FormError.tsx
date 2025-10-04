import React from 'react';
import { useTranslation } from '../../localization/useTranslation';

interface FormErrorProps {
  error: string;
  translations?: any;
}

export const FormError: React.FC<FormErrorProps> = ({
  error,
  translations
}) => {
  const { t } = useTranslation(
    translations || {
      defaultLanguage: 'pl',
      supportedLanguages: ['pl'],
      translations: { pl: {} }
    }
  );

  const getErrorMessage = () => {
    return t('messages.error', 'Wystąpił błąd');
  };

  return (
    <div className="form-error-container">
      <p className="form-error-message">
        {error || getErrorMessage()}
      </p>
    </div>
  );
};
