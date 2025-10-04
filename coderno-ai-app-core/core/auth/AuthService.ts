import { supabase } from './supabase';

export interface User {
  id: string;
  email?: string;
  user_metadata?: any;
  app_metadata?: any;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  onboardingCompleted: boolean;
}

export interface LoginOptions {
  email?: string;
  provider?: 'google' | 'github';
  redirectTo?: string;
}

export class AuthService {
  private authState: AuthState = {
    user: null,
    loading: true,
    onboardingCompleted: false
  };

  private listeners: ((state: AuthState) => void)[] = [];

  constructor() {
    this.initializeAuth();
  }

  private async initializeAuth() {
    try {
      // Check current session
      const { data: { session } } = await supabase.auth.getSession();
      this.authState.user = session?.user ?? null;
      
      if (session?.user) {
        await this.checkOnboardingStatus();
      }
    } catch (error) {
      console.error('Error checking session:', error);
      this.authState.user = null;
    } finally {
      this.authState.loading = false;
      this.notifyListeners();
    }

    // Listen for auth state changes
    supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);
      this.authState.user = session?.user ?? null;
      
      if (session?.user) {
        await this.checkOnboardingStatus();
      } else {
        this.authState.onboardingCompleted = false;
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem('onboardingCompleted');
        }
      }
      
      this.authState.loading = false;
      this.notifyListeners();
    });
  }

  private async checkOnboardingStatus() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'}/api/users/profile`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });

      if (response.status === 401) {
        console.log('Token expired during onboarding check, signing out...');
        await supabase.auth.signOut();
        return;
      }

      if (response.ok) {
        const userData = await response.json();
        const completed = !!userData.data?.onboarding_completed;
        this.authState.onboardingCompleted = completed;
        
        if (typeof window !== 'undefined' && completed) {
          window.localStorage.setItem('onboardingCompleted', 'true');
        }
      }
    } catch (error) {
      console.warn('Onboarding status check failed:', error);
    }
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.authState));
  }

  public subscribe(listener: (state: AuthState) => void) {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  public getCurrentState(): AuthState {
    return { ...this.authState };
  }

  public async loginWithEmail(email: string, redirectTo?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectTo || `${window.location.origin}/auth/callback`
        }
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || 'Login failed' };
    }
  }

  public async loginWithProvider(provider: 'google' | 'github', redirectTo?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: redirectTo || `${window.location.origin}/auth/callback`
        }
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || 'OAuth login failed' };
    }
  }

  public async logout(): Promise<void> {
    try {
      await supabase.auth.signOut();
      this.authState.user = null;
      this.authState.onboardingCompleted = false;
      
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem('onboardingCompleted');
      }
      
      this.notifyListeners();
    } catch (error) {
      console.error('Error during logout:', error);
    }
  }

  public async completeOnboarding(): Promise<void> {
    this.authState.onboardingCompleted = true;
    
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('onboardingCompleted', 'true');
    }
    
    this.notifyListeners();
  }
}
