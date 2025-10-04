#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

class AppGenerator {
  constructor() {
    this.appsDir = path.join(__dirname, '..', 'apps');
    this.templates = {
      fitness: {
        name: 'Fitness Tracker',
        description: 'AI-powered fitness and nutrition tracking',
        fields: [
          { key: 'weight', type: 'number', label: 'Weight (kg)', required: true, validation: { min: 30, max: 200 } },
          { key: 'height', type: 'number', label: 'Height (cm)', required: true, validation: { min: 100, max: 250 } },
          { key: 'age', type: 'number', label: 'Age', required: true, validation: { min: 13, max: 100 } },
          { key: 'goal', type: 'select', label: 'Fitness Goal', required: true, options: ['lose_weight', 'gain_weight', 'maintain', 'build_muscle'] }
        ],
        aiPrompts: [
          {
            id: 'meal_analysis',
            systemPrompt: 'You are a nutrition expert. Analyze the provided meal and give detailed nutritional advice.',
            responseFormat: 'nutrition_analysis'
          },
          {
            id: 'workout_suggestion',
            systemPrompt: 'You are a fitness trainer. Suggest personalized workout plans based on user goals.',
            responseFormat: 'workout_plan'
          }
        ]
      },
      finance: {
        name: 'Finance Tracker',
        description: 'AI-powered personal finance management',
        fields: [
          { key: 'income', type: 'number', label: 'Monthly Income', required: true, validation: { min: 0 } },
          { key: 'expenses', type: 'number', label: 'Monthly Expenses', required: true, validation: { min: 0 } },
          { key: 'savings_goal', type: 'number', label: 'Savings Goal', required: true, validation: { min: 0 } },
          { key: 'investment_risk', type: 'select', label: 'Investment Risk Tolerance', required: true, options: ['conservative', 'moderate', 'aggressive'] }
        ],
        aiPrompts: [
          {
            id: 'budget_analysis',
            systemPrompt: 'You are a financial advisor. Analyze spending patterns and provide budget optimization advice.',
            responseFormat: 'budget_analysis'
          },
          {
            id: 'investment_advice',
            systemPrompt: 'You are an investment expert. Provide personalized investment recommendations.',
            responseFormat: 'investment_plan'
          }
        ]
      },
      travel: {
        name: 'Travel Planner',
        description: 'AI-powered travel planning and recommendations',
        fields: [
          { key: 'budget', type: 'number', label: 'Travel Budget', required: true, validation: { min: 0 } },
          { key: 'duration', type: 'number', label: 'Trip Duration (days)', required: true, validation: { min: 1, max: 365 } },
          { key: 'destination', type: 'text', label: 'Preferred Destination', required: true },
          { key: 'interests', type: 'multiselect', label: 'Travel Interests', required: true, options: ['culture', 'nature', 'adventure', 'relaxation', 'food', 'history'] }
        ],
        aiPrompts: [
          {
            id: 'itinerary_planning',
            systemPrompt: 'You are a travel expert. Create detailed itineraries based on budget, duration, and interests.',
            responseFormat: 'travel_itinerary'
          },
          {
            id: 'budget_optimization',
            systemPrompt: 'You are a travel budget specialist. Optimize travel expenses and suggest cost-saving tips.',
            responseFormat: 'budget_optimization'
          }
        ]
      },
      wellbeing: {
        name: 'Wellbeing Tracker',
        description: 'AI-powered mental health and wellness tracking',
        fields: [
          { key: 'mood', type: 'select', label: 'Current Mood', required: true, options: ['excellent', 'good', 'neutral', 'poor', 'terrible'] },
          { key: 'sleep_hours', type: 'number', label: 'Sleep Hours (last night)', required: true, validation: { min: 0, max: 24 } },
          { key: 'stress_level', type: 'select', label: 'Stress Level', required: true, options: ['low', 'moderate', 'high', 'very_high'] },
          { key: 'wellness_goals', type: 'multiselect', label: 'Wellness Goals', required: true, options: ['reduce_stress', 'improve_sleep', 'increase_energy', 'better_mood', 'mindfulness'] }
        ],
        aiPrompts: [
          {
            id: 'mood_analysis',
            systemPrompt: 'You are a mental health counselor. Analyze mood patterns and provide wellness recommendations.',
            responseFormat: 'wellness_plan'
          },
          {
            id: 'stress_management',
            systemPrompt: 'You are a stress management expert. Provide personalized stress reduction techniques.',
            responseFormat: 'stress_management_plan'
          }
        ]
      }
    };
  }

  async run() {
    console.log('🚀 AI App Core - App Generator\n');
    
    try {
      // Show available templates
      console.log('Available app templates:');
      Object.keys(this.templates).forEach((key, index) => {
        const template = this.templates[key];
        console.log(`${index + 1}. ${template.name} - ${template.description}`);
      });

      // Get user selection
      const templateKey = await this.selectTemplate();
      const template = this.templates[templateKey];

      // Get app details
      const appName = await this.getAppName();
      const appDescription = await this.getAppDescription();

      // Generate app
      await this.generateApp(templateKey, template, appName, appDescription);

      console.log(`\n✅ App "${appName}" created successfully!`);
      console.log(`📁 Location: ai-app-core/apps/${appName}/`);
      console.log('\n🚀 Next steps:');
      console.log(`1. cd ai-app-core/apps/${appName}`);
      console.log('2. npm install');
      console.log('3. npm run dev');

    } catch (error) {
      console.error('❌ Error:', error.message);
    }
  }

  async selectTemplate() {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    return new Promise((resolve) => {
      rl.question('\nSelect app type (1-4): ', (answer) => {
        const choice = parseInt(answer) - 1;
        const templateKeys = Object.keys(this.templates);
        
        if (choice >= 0 && choice < templateKeys.length) {
          rl.close();
          resolve(templateKeys[choice]);
        } else {
          console.log('Invalid selection, using first template');
          rl.close();
          resolve(templateKeys[0]);
        }
      });
    });
  }

  async getAppName() {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    return new Promise((resolve) => {
      rl.question('Enter app name (kebab-case, e.g., my-fitness-app): ', (answer) => {
        rl.close();
        resolve(answer.trim() || 'my-app');
      });
    });
  }

  async getAppDescription() {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    return new Promise((resolve) => {
      rl.question('Enter app description: ', (answer) => {
        rl.close();
        resolve(answer.trim() || 'AI-powered application');
      });
    });
  }

  async generateApp(templateKey, template, appName, appDescription) {
    console.log('\n📋 Generating app configuration...');

    // Create app directory
    const appDir = path.join(this.appsDir, appName);
    if (!fs.existsSync(appDir)) {
      fs.mkdirSync(appDir, { recursive: true });
    }

    // Create config directory
    const configDir = path.join(appDir, 'config');
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir);
    }

    // Generate app.json config
    const appConfig = {
      app: {
        name: template.name,
        description: appDescription,
        version: '1.0.0',
        type: templateKey
      },
      onboarding: {
        steps: [
          {
            id: 'basic-info',
            title: 'Basic Information',
            fields: template.fields
          }
        ]
      },
      ai: {
        prompts: template.aiPrompts
      },
      database: {
        tables: [
          {
            name: 'user_data',
            fields: template.fields.map(field => ({
              name: field.key,
              type: field.type === 'number' ? 'numeric' : 'text',
              required: field.required
            }))
          }
        ]
      },
      theme: {
        primaryColor: '#3b82f6',
        secondaryColor: '#1e40af',
        accentColor: '#f59e0b'
      }
    };

    // Write config file
    fs.writeFileSync(
      path.join(configDir, 'app.json'),
      JSON.stringify(appConfig, null, 2)
    );

    // Generate package.json
    const packageJson = {
      name: appName,
      version: '1.0.0',
      type: 'module',
      scripts: {
        dev: 'vite',
        build: 'tsc && vite build',
        preview: 'vite preview'
      },
      dependencies: {
        react: '^18.2.0',
        'react-dom': '^18.2.0',
        'ai-app-core': 'file:..'
      },
      devDependencies: {
        '@types/react': '^18.2.0',
        '@types/react-dom': '^18.2.0',
        '@vitejs/plugin-react': '^4.0.0',
        typescript: '^5.0.0',
        vite: '^4.4.0'
      }
    };

    fs.writeFileSync(
      path.join(appDir, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    );

    // Generate vite.config.ts
    const viteConfig = `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173
  }
})`;

    fs.writeFileSync(path.join(appDir, 'vite.config.ts'), viteConfig);

    // Generate index.html
    const indexHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${template.name} - AI Framework</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`;

    fs.writeFileSync(path.join(appDir, 'index.html'), indexHtml);

    // Create src directory
    const srcDir = path.join(appDir, 'src');
    if (!fs.existsSync(srcDir)) {
      fs.mkdirSync(srcDir);
    }

    // Generate main.tsx
    const mainTsx = `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)`;

    fs.writeFileSync(path.join(srcDir, 'main.tsx'), mainTsx);

    // Generate App.tsx
    const appTsx = `import React from 'react'
import { OnboardingEngine } from 'ai-app-core/core/onboarding/OnboardingEngine'
import { OnboardingForm } from 'ai-app-core/core/ui/forms/OnboardingForm'
import appConfig from '../config/app.json'

function App() {
  const engine = new OnboardingEngine(appConfig)

  const handleComplete = (data: any) => {
    console.log('Onboarding completed:', data)
    // Send data to backend API
    fetch('http://localhost:3001/api/onboarding/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        appType: appConfig.app.type,
        data: data
      })
    })
    .then(response => response.json())
    .then(result => {
      console.log('Data saved:', result)
    })
    .catch(error => {
      console.error('Error saving data:', error)
    })
  }

  return (
    <div className="app">
      <h1>{appConfig.app.name}</h1>
      <p>{appConfig.app.description}</p>
      <OnboardingForm 
        engine={engine}
        onComplete={handleComplete}
      />
    </div>
  )
}

export default App`;

    fs.writeFileSync(path.join(srcDir, 'App.tsx'), appTsx);

    // Generate index.css
    const indexCss = `@import 'ai-app-core/core/ui/styles/main.scss';

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.app {
  padding: 2rem;
  max-width: 800px;
  margin: 0 auto;
}`;

    fs.writeFileSync(path.join(srcDir, 'index.css'), indexCss);

    // Generate README.md
    const readme = `# ${template.name}

${appDescription}

## Development

\`\`\`bash
npm install
npm run dev
\`\`\`

## Configuration

Edit \`config/app.json\` to customize:
- Onboarding steps and fields
- AI prompts and responses
- Database schema
- UI theme

## Backend Integration

This app automatically integrates with the backend API at \`http://localhost:3001\`.
`;

    fs.writeFileSync(path.join(appDir, 'README.md'), readme);
  }
}

// Run the app generator
if (require.main === module) {
  const generator = new AppGenerator();
  generator.run().catch(console.error);
}

module.exports = AppGenerator;
