# AI App Core - CLI Usage

## 🚀 **Quick Start**

### **1. Create new app**
```bash
cd ai-app-core
node cli/create-app.js
```

### **2. Follow the prompts**
```
🚀 AI App Core - App Generator

Available app templates:
1. Fitness Tracker - AI-powered fitness and nutrition tracking
2. Finance Tracker - AI-powered personal finance management
3. Travel Planner - AI-powered travel planning and recommendations
4. Wellbeing Tracker - AI-powered mental health and wellness tracking

Select app type (1-4): 2

Enter app name (kebab-case, e.g., my-fitness-app): my-finance-app
Enter app description: Personal finance management with AI insights

📋 Generating app configuration...

✅ App "my-finance-app" created successfully!
📁 Location: ai-app-core/apps/my-finance-app/

🚀 Next steps:
1. cd ai-app-core/apps/my-finance-app
2. npm install
3. npm run dev
```

## 🎯 **Available Templates**

### **1. Fitness Tracker**
- Fields: weight, height, age, goal
- AI: meal analysis, workout suggestions
- Use case: Health and fitness apps

### **2. Finance Tracker**
- Fields: income, expenses, savings goal
- AI: budget analysis, investment advice
- Use case: Personal finance apps

### **3. Travel Planner**
- Fields: budget, duration, destination, interests
- AI: itinerary planning, budget optimization
- Use case: Travel and tourism apps

### **4. Wellbeing Tracker**
- Fields: mood, sleep, stress, goals
- AI: mood analysis, wellness plans
- Use case: Mental health and wellness apps

## 📁 **Generated Structure**

```
apps/[app-name]/
├── config/
│   └── app.json          # App configuration
├── src/
│   └── App.tsx           # Main app component
├── package.json          # Dependencies
└── README.md             # Documentation
```

## ⚙️ **Configuration**

The CLI generates a complete `config/app.json` with:

- **Onboarding steps** - dynamic forms
- **AI prompts** - configurable LLM integration
- **Database schema** - table definitions
- **UI theme** - colors and styling

## 🔧 **Customization**

After generation, edit `config/app.json` to customize:

```json
{
  "onboarding": {
    "steps": [
      {
        "id": "custom-step",
        "title": "Custom Step",
        "fields": [
          {
            "key": "custom_field",
            "type": "text",
            "label": "Custom Field",
            "required": true
          }
        ]
      }
    ]
  },
  "ai": {
    "prompts": [
      {
        "id": "custom_prompt",
        "systemPrompt": "You are a custom AI assistant...",
        "responseFormat": "custom_format"
      }
    ]
  }
}
```

## 🚀 **Development**

### **Start development server**
```bash
cd apps/[app-name]
npm install
npm run dev
```

### **Build for production**
```bash
npm run build
```

### **Preview production build**
```bash
npm run preview
```

## 🔗 **Backend Integration**

All generated apps automatically integrate with the existing backend:

- **API Endpoint**: `/api/onboarding/save`
- **Method**: POST
- **Data**: User onboarding data + app type
- **Response**: Success/error status

## 📦 **Dependencies**

Generated apps include:

- **React 18** - UI framework
- **TypeScript** - Type safety
- **SCSS** - Styling
- **Vite** - Build tool
- **Core Framework** - OnboardingEngine, AIService

## 🎯 **Features**

- ✅ **Dynamic onboarding** from JSON config
- ✅ **AI integration** with configurable prompts
- ✅ **Responsive UI** with SCSS
- ✅ **TypeScript support** for type safety
- ✅ **Backend integration** with existing API
- ✅ **Hot reload** for development
- ✅ **Production builds** optimized

## 🔄 **Workflow**

1. **Generate app** with CLI
2. **Customize config** in `app.json`
3. **Develop features** in `src/App.tsx`
4. **Test with backend** API
5. **Deploy** to production

## 💡 **Tips**

- Use **kebab-case** for app names
- **Customize AI prompts** for your domain
- **Add custom fields** to onboarding
- **Test with real data** early
- **Iterate quickly** with config changes

## 🆘 **Troubleshooting**

### **App not starting**
```bash
cd apps/[app-name]
npm install
npm run dev
```

### **Backend connection issues**
- Check if backend is running on port 3001
- Verify API endpoint `/api/onboarding/save`
- Check network requests in browser dev tools

### **TypeScript errors**
- Run `npm install` to ensure dependencies
- Check `tsconfig.json` configuration
- Verify core framework imports

## 🚀 **Next Steps**

1. **Create your first app** with CLI
2. **Customize the configuration**
3. **Add your business logic**
4. **Deploy to production**

Happy coding! 🎉
