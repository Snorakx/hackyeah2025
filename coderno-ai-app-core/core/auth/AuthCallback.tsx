import React, { useEffect, useState } from 'react';
import { supabase } from './supabase';
import { useTranslation } from '../localization/useTranslation';

interface AuthCallbackProps {
  onAuthSuccess?: () => void;
  localizationConfig?: any;
}

export const AuthCallback: React.FC<AuthCallbackProps> = ({
  onAuthSuccess,
  localizationConfig
}) => {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  
  const { tWithFallback } = useTranslation(localizationConfig || {
    defaultLanguage: 'pl',
    supportedLanguages: ['pl'],
    translations: { pl: {} }
  });

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          setStatus('error');
          setMessage(tWithFallback('auth.callbackError', 'Błąd podczas logowania: ') + error.message);
          return;
        }

        if (data.session) {
          setStatus('success');
          setMessage(tWithFallback('auth.callbackSuccess', 'Logowanie udane! Przekierowywanie...'));
          
          // Redirect to main app after short delay
          setTimeout(() => {
            onAuthSuccess?.();
            window.location.href = '/';
          }, 1500);
        } else {
          setStatus('error');
          setMessage(tWithFallback('auth.callbackFailed', 'Nie udało się zalogować. Spróbuj ponownie.'));
        }
      } catch (error: any) {
        setStatus('error');
        setMessage(tWithFallback('auth.callbackUnexpected', 'Wystąpił nieoczekiwany błąd: ') + error.message);
      }
    };

    handleAuthCallback();
  }, [onAuthSuccess, tWithFallback]);

  return (
    <div className="auth-callback">
      <div className="auth-callback-content">
        {status === 'loading' && (
          <div className="auth-callback-loading">
            <div className="spinner-neo"></div>
            <p className="auth-callback-message">
              {tWithFallback('auth.processing', 'Przetwarzanie logowania...')}
            </p>
          </div>
        )}

        {status === 'success' && (
          <div className="auth-callback-success">
            <div className="auth-callback-icon">✅</div>
            <p className="auth-callback-message">{message}</p>
          </div>
        )}

        {status === 'error' && (
          <div className="auth-callback-error">
            <div className="auth-callback-icon">❌</div>
            <p className="auth-callback-message">{message}</p>
            <button 
              className="btn btn-primary"
              onClick={() => window.location.href = '/'}
            >
              {tWithFallback('auth.tryAgain', 'Spróbuj ponownie')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
