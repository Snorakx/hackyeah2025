import { useState, useEffect } from 'react';
import { AuthService, AuthState } from './AuthService';

export const useAuth = (authService: AuthService) => {
  const [authState, setAuthState] = useState<AuthState>(authService.getCurrentState());

  useEffect(() => {
    const unsubscribe = authService.subscribe((state) => {
      setAuthState(state);
    });

    return unsubscribe;
  }, [authService]);

  return {
    user: authState.user,
    loading: authState.loading,
    onboardingCompleted: authState.onboardingCompleted,
    isAuthenticated: !!authState.user,
    loginWithEmail: authService.loginWithEmail.bind(authService),
    loginWithProvider: authService.loginWithProvider.bind(authService),
    logout: authService.logout.bind(authService),
    completeOnboarding: authService.completeOnboarding.bind(authService)
  };
};
