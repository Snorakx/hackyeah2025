import React from 'react';
import { useTranslation } from '../../localization/useTranslation';

interface FormNavigationProps {
  canGoBack: boolean;
  canGoForward: boolean;
  isLoading: boolean;
  onBack: () => void;
  onNext: () => void;
  translations?: any;
}

export const FormNavigation: React.FC<FormNavigationProps> = ({
  canGoBack,
  canGoForward,
  isLoading,
  onBack,
  onNext,
  translations
}) => {
  const { t } = useTranslation(
    translations || {
      defaultLanguage: 'pl',
      supportedLanguages: ['pl'],
      translations: { pl: {} }
    }
  );

  const getBackText = () => {
    return t('buttons.back', 'Wstecz');
  };

  const getNextText = () => {
    return t('buttons.next', 'Dalej');
  };

  const getLoadingText = () => {
    return t('messages.saving', 'Zapisywanie...');
  };

  return (
    <div className="form-navigation">
      <button
        type="button"
        onClick={onBack}
        className="ui-button ui-button--md ui-button--outline"
        disabled={!canGoBack}
      >
        {getBackText()}
      </button>
      
      <button
        type="button"
        onClick={onNext}
        disabled={!canGoForward || isLoading}
        className="ui-button ui-button--md ui-button--primary"
      >
        {isLoading ? getLoadingText() : getNextText()}
      </button>
    </div>
  );
};
