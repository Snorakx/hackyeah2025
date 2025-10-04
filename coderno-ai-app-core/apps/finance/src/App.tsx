import React, { useState, useEffect } from 'react';
import { OnboardingEngine } from '../../../core/onboarding/OnboardingEngine';
import { AIService } from '../../../core/ai/AIService';
import { OnboardingForm } from '../../../core/onboarding/OnboardingForm';
import { LoginScreen } from '../../../core/auth/LoginScreen';
import { AuthService } from '../../../core/auth/AuthService';
import { useAuth } from '../../../core/auth/useAuth';
import { AppConfig } from '../../../core/types';
import financeConfig from '../config/app.json';

const App: React.FC = () => {
  const [authService] = useState(() => new AuthService());
  const [onboardingEngine, setOnboardingEngine] = useState<OnboardingEngine | null>(null);
  const [aiService, setAIService] = useState<AIService | null>(null);
  const [userData, setUserData] = useState<any>(null);
  
  const { user, loading, onboardingCompleted, isAuthenticated, completeOnboarding } = useAuth(authService);

  useEffect(() => {
    // Initialize services
    const engine = new OnboardingEngine(financeConfig as AppConfig);
    const ai = new AIService(financeConfig.ai);
    
    setOnboardingEngine(engine);
    setAIService(ai);
  }, []);

  const handleOnboardingComplete = async (data: any) => {
    console.log('Finance onboarding completed:', data);
    setUserData(data);
    await completeOnboarding();
    
    // Save to existing backend API
    try {
      const response = await fetch('/api/onboarding/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          app_type: 'finance' // Identify app type
        })
      });
      
      if (response.ok) {
        console.log('Data saved to backend');
      }
    } catch (error) {
      console.error('Error saving to backend:', error);
    }
  };

  const handleOnboardingError = (error: string) => {
    console.error('Onboarding error:', error);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner-neo"></div>
        <p className="loading-text">Ładowanie Finance Tracker...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <LoginScreen
        authService={authService}
        localizationConfig={financeConfig.localization}
      />
    );
  }

  if (!onboardingCompleted) {
    return (
      <div className="app-container">
        <OnboardingForm
          engine={onboardingEngine!}
          onComplete={handleOnboardingComplete}
          onError={handleOnboardingError}
          localizationConfig={financeConfig.localization}
        />
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="app-content">
        <h1 className="app-title">
          Witaj w Finance Tracker! 💰
        </h1>
        
        <div className="dashboard-grid">
          <div className="glass-card">
            <h2 className="card-title">Twoje finanse</h2>
            <div className="user-data">
              <p><strong>Dochody:</strong> {userData.monthly_income} PLN</p>
              <p><strong>Wydatki:</strong> {userData.monthly_expenses} PLN</p>
              <p><strong>Oszczędności:</strong> {userData.monthly_income - userData.monthly_expenses} PLN</p>
              <p><strong>Cel:</strong> {userData.primary_goal}</p>
            </div>
          </div>

          <div className="glass-card">
            <h2 className="card-title">Analiza budżetu</h2>
            <button 
              className="ui-button ui-button--md ui-button--primary"
              onClick={async () => {
                if (aiService) {
                  const result = await aiService.generateResponse(
                    'budget_analysis',
                    'Przeanalizuj mój budżet',
                    { 
                      user_data: userData,
                      budget_data: {
                        income: userData.monthly_income,
                        expenses: userData.monthly_expenses,
                        savings: userData.monthly_income - userData.monthly_expenses
                      },
                      goal: userData.primary_goal
                    }
                  );
                  console.log('Budget Analysis:', result);
                }
              }}
            >
              Przeanalizuj budżet
            </button>
          </div>

          <div className="glass-card">
            <h2 className="card-title">Rady inwestycyjne</h2>
            <button 
              className="ui-button ui-button--md ui-button--secondary"
              onClick={async () => {
                if (aiService) {
                  const result = await aiService.generateResponse(
                    'investment_advice',
                    'Daj mi rady inwestycyjne',
                    { 
                      user_data: userData,
                      goal: userData.primary_goal,
                      time_horizon: userData.time_horizon,
                      amount: userData.savings_goal || 10000
                    }
                  );
                  console.log('Investment Advice:', result);
                }
              }}
            >
              Wygeneruj plan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
