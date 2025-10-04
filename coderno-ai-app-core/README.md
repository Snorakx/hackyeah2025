# AI App Core

Uniwersalny framework do tworzenia aplikacji opartych na AI z konfigurowalnym onboardinguem i dynamicznymi widokami.

## 🏗️ Architektura

```
ai-app-core/
├── core/                    # Core framework (domain agnostic)
│   ├── onboarding/         # Dynamic onboarding engine
│   ├── services/           # Universal services
│   ├── repositories/       # Data access layer
│   ├── ai/                 # AI service layer
│   └── types/              # TypeScript definitions
├── apps/                   # Specific applications
│   ├── fitness/            # Fitness app with config
│   ├── finance/            # Finance app with config
│   └── travel/             # Travel app with config
├── examples/               # Example configurations
└── docs/                   # Documentation
```

## 🎯 Koncepcja

**Core** - bezosobowy, uniwersalny framework
**Apps** - konkretne aplikacje z własną konfiguracją

Każda aplikacja to:
1. **Config JSON** - definicja onboardingu, AI prompts, schema
2. **Custom Components** - specyficzne komponenty UI
3. **Business Logic** - logika biznesowa aplikacji

## 🚀 Przykład struktury

```
apps/fitness/
├── config/
│   ├── app.json           # App configuration
│   ├── onboarding.json    # Onboarding steps
│   ├── ai-prompts.json    # AI prompts
│   └── database.json      # Database schema
├── components/            # Fitness-specific components
├── services/              # Fitness-specific services
└── views/                 # Fitness-specific views
```

## 📦 Core Components

- **OnboardingEngine** - dynamiczne formularze z JSON
- **AIService** - integracja z LLM (OpenAI, OpenRouter, etc.)
- **DatabaseAdapter** - elastyczne schema z konfiguracji
- **ConfigValidator** - walidacja konfiguracji
- **UIComponents** - reużywalne komponenty React

## 🔧 Jak to działa

1. **Framework Core** - dostarcza uniwersalne komponenty
2. **App Config** - definiuje zachowanie aplikacji
3. **Dynamic Generation** - UI i logika generowana z konfiguracji
4. **AI Integration** - konfigurowalne prompty i response formaty