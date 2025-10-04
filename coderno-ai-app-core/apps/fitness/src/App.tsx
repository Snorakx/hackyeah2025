import React, { useState, useEffect } from 'react';
import { OnboardingEngine } from '../../../core/onboarding/OnboardingEngine';
import { AIService } from '../../../core/ai/AIService';
import { OnboardingForm } from '../../../core/onboarding/OnboardingForm';
import { AppConfig } from '../../../core/types';
import fitnessConfig from '../config/app.json';

const App: React.FC = () => {
  const [onboardingEngine, setOnboardingEngine] = useState<OnboardingEngine | null>(null);
  const [aiService, setAIService] = useState<AIService | null>(null);
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    // Initialize services
    const engine = new OnboardingEngine(fitnessConfig as AppConfig);
    const ai = new AIService(fitnessConfig.ai);
    
    setOnboardingEngine(engine);
    setAIService(ai);
  }, []);

  const handleOnboardingComplete = async (data: any) => {
    console.log('Onboarding completed with data:', data);
    setUserData(data);
    setIsOnboardingComplete(true);
    
    // Here you would typically save to database
    // await saveUserData(data);
  };

  const handleOnboardingError = (error: string) => {
    console.error('Onboarding error:', error);
    // Handle error (show notification, etc.)
  };

  if (!onboardingEngine) {
    return (
      <div className="loading-container">
        <div className="spinner-neo"></div>
        <p className="loading-text">Ładowanie aplikacji...</p>
      </div>
    );
  }

  if (!isOnboardingComplete) {
    return (
      <div className="app-container">
        <OnboardingForm
          engine={onboardingEngine}
          onComplete={handleOnboardingComplete}
          onError={handleOnboardingError}
          localizationConfig={fitnessConfig.localization}
        />
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="app-content">
        <h1 className="app-title">
          Witaj w Fitness Tracker!
        </h1>
        
        <div className="dashboard-grid">
          <div className="glass-card">
            <h2 className="card-title">Twoje dane</h2>
            <div className="user-data">
              <p><strong>Waga:</strong> {userData.weight} kg</p>
              <p><strong>Wzrost:</strong> {userData.height} cm</p>
              <p><strong>Wiek:</strong> {userData.age} lat</p>
              <p><strong>Cel:</strong> {userData.goal}</p>
              <p><strong>Aktywność:</strong> {userData.activity_level}</p>
            </div>
          </div>

          <div className="glass-card">
            <h2 className="card-title">Analiza posiłku</h2>
            <button 
              className="btn btn-primary"
              onClick={async () => {
                if (aiService) {
                  const result = await aiService.generateResponse(
                    'meal_analysis',
                    'kanapka z szynką i serem',
                    { user_data: userData, region: 'PL' }
                  );
                  console.log('AI Response:', result);
                }
              }}
            >
              Przeanalizuj posiłek
            </button>
          </div>

          <div className="glass-card">
            <h2 className="card-title">Plan treningowy</h2>
            <button 
              className="btn btn-secondary"
              onClick={async () => {
                if (aiService) {
                  const result = await aiService.generateResponse(
                    'workout_suggestion',
                    'Stwórz plan treningowy',
                    { 
                      user_data: userData, 
                      goal: userData.goal,
                      activity_level: userData.activity_level,
                      workout_days: userData.workout_days
                    }
                  );
                  console.log('Workout Plan:', result);
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
