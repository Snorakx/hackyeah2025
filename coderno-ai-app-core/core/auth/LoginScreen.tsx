import React, { useState } from 'react';
import { AuthService } from './AuthService';
import { useTranslation } from '../localization/useTranslation';

interface LoginScreenProps {
  authService: AuthService;
  onLoginSuccess?: () => void;
  localizationConfig?: any;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  authService,
  onLoginSuccess,
  localizationConfig
}) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; global?: string }>({});
  
  const { t, tWithFallback } = useTranslation(localizationConfig || {
    defaultLanguage: 'pl',
    supportedLanguages: ['pl'],
    translations: { pl: {} }
  });

  const validateForm = () => {
    const newErrors: { email?: string } = {};

    if (!email) {
      newErrors.email = tWithFallback('auth.emailRequired', 'Email jest wymagany');
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = tWithFallback('auth.emailInvalid', 'Nieprawidłowy format email');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});

    try {
      const result = await authService.loginWithEmail(email);
      
      if (result.success) {
        setErrors({ global: tWithFallback('auth.checkEmail', 'Sprawdź swój email, aby kontynuować logowanie!') });
      } else {
        setErrors({ global: result.error });
      }
    } catch (error: any) {
      setErrors({ global: error.message || tWithFallback('auth.loginError', 'Wystąpił błąd podczas logowania') });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setErrors({});

    try {
      const result = await authService.loginWithProvider('google');
      
      if (!result.success) {
        setErrors({ global: result.error });
        setIsLoading(false);
      }
    } catch (error: any) {
      setErrors({ global: error.message || tWithFallback('auth.googleError', 'Wystąpił błąd podczas logowania przez Google') });
      setIsLoading(false);
    }
  };

  const handleGitHubLogin = async () => {
    setIsLoading(true);
    setErrors({});

    try {
      const result = await authService.loginWithProvider('github');
      
      if (!result.success) {
        setErrors({ global: result.error });
        setIsLoading(false);
      }
    } catch (error: any) {
      setErrors({ global: error.message || tWithFallback('auth.githubError', 'Wystąpił błąd podczas logowania przez GitHub') });
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1 className="login-title">
            {tWithFallback('auth.welcome', 'Witaj!')}
          </h1>
          <p className="login-subtitle">
            {tWithFallback('auth.subtitle', 'Zaloguj się, aby kontynuować')}
          </p>
        </div>

        <form onSubmit={handleEmailLogin} className="login-form">
          <div className="form-group">
            <label htmlFor="email" className="form-label">
              {tWithFallback('auth.email', 'Email')}
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`ui-input ${errors.email ? 'ui-input--error' : ''}`}
              placeholder={tWithFallback('auth.emailPlaceholder', 'twoj@email.com')}
              disabled={isLoading}
            />
            {errors.email && (
              <span className="form-error">{errors.email}</span>
            )}
          </div>

          {errors.global && (
            <div className="form-error-container">
              <span className="form-error-message">{errors.global}</span>
            </div>
          )}

          <button
            type="submit"
            className="ui-button ui-button--md ui-button--primary"
            style={{ width: '100%' }}
            disabled={isLoading}
          >
            {isLoading ? tWithFallback('auth.loggingIn', 'Logowanie...') : tWithFallback('auth.login', 'Zaloguj się')}
          </button>
        </form>

        <div className="login-divider">
          <span className="login-divider-text">
            {tWithFallback('auth.or', 'lub')}
          </span>
        </div>

        <div className="login-social">
          <button
            onClick={handleGoogleLogin}
            className="ui-button ui-button--md ui-button--secondary"
            disabled={isLoading}
          >
            <span className="btn-social-icon">G</span>
            {tWithFallback('auth.loginGoogle', 'Zaloguj się przez Google')}
          </button>

          <button
            onClick={handleGitHubLogin}
            className="ui-button ui-button--md ui-button--secondary"
            disabled={isLoading}
          >
            <span className="btn-social-icon">G</span>
            {tWithFallback('auth.loginGithub', 'Zaloguj się przez GitHub')}
          </button>
        </div>
      </div>
    </div>
  );
};
