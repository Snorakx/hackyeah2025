# Cut Sprint - Weight Loss Application

A modern, full-stack weight loss application with AI-powered meal and workout planning, built with a microservices architecture.

## 🏗️ Architecture

The application is split into two separate services:

```
┌─────────────────┐    HTTP API    ┌─────────────────┐    Database    ┌─────────────────┐
│   Frontend      │ ←────────────→ │   Backend API   │ ←────────────→ │   Supabase      │
│   (Port 4321)   │                │   (Port 3001)   │                │   (Port 54321)  │
│   cut-sprint-   │                │   cut-sprint-   │                │   PostgreSQL    │
│   front         │                │   backend       │                │   + Auth        │
└─────────────────┘                └─────────────────┘                └─────────────────┘
```

## 📁 Project Structure

```
diet week/
├── cut-sprint-front/          # Frontend application
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── services/          # API communication
│   │   ├── pages/             # Astro pages
│   │   └── ...
│   ├── package.json
│   └── README.md
├── cut-sprint-backend/        # Backend API
│   ├── src/
│   │   ├── routes/            # API endpoints
│   │   ├── middleware/        # Express middleware
│   │   ├── lib/               # Utilities
│   │   └── ...
│   ├── package.json
│   └── README.md
├── docker-compose.yml         # Supabase services
├── supabase/                  # Database schema
└── README.md                  # This file
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Docker and Docker Compose
- Git

### 1. Clone and Setup

```bash
# Clone the repository
git clone <repository-url>
cd "diet week"

# Copy environment files
cp cut-sprint-front/env.example cut-sprint-front/.env
cp cut-sprint-backend/env.example cut-sprint-backend/.env
```

### 2. Start Supabase Database

```bash
# Start all Supabase services
docker-compose up -d

# Wait for services to be ready
docker-compose ps
```

This starts:
- **PostgreSQL Database** (port 5432)
- **Supabase Studio** (port 3000) - Database management UI
- **Auth Service** (port 9999)
- **REST API** (port 3001)
- **Realtime** (port 4000)
- **Storage** (port 5000)
- **Edge Functions** (port 9000)
- **Mail Service** (port 8025)

### 3. Start Backend API

```bash
cd cut-sprint-backend
npm install
npm run dev
```

The API will be available at `http://localhost:3001`

### 4. Start Frontend

```bash
cd cut-sprint-front
npm install
npm run dev
```

The application will be available at `http://localhost:4321`

## 🎯 Features

### Core Features
- **Weekly Weight Loss Sprints** - Set and track weekly weight loss goals
- **AI-Powered Planning** - Get personalized meal and workout recommendations
- **Progress Tracking** - Monitor weight, calories, and workouts
- **Meal Management** - Track daily food intake with preset meals
- **Workout Tracking** - Log exercises and monitor calories burned

### Technical Features
- **Microservices Architecture** - Separate frontend and backend
- **RESTful API** - Complete CRUD operations for all entities
- **JWT Authentication** - Secure user authentication
- **Real-time Updates** - Live data synchronization
- **Mobile Ready** - Capacitor for mobile deployment
- **Multi-language** - English and Polish support
- **Health Integration** - Apple Health and Google Fit

## 🛠️ Tech Stack

### Frontend (`cut-sprint-front`)
- **Framework**: Astro + React + TypeScript
- **Styling**: TailwindCSS
- **State Management**: Zustand
- **Authentication**: Supabase Auth
- **Mobile**: Capacitor
- **Build Tool**: Vite

### Backend (`cut-sprint-backend`)
- **Runtime**: Node.js + TypeScript
- **Framework**: Express.js
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Validation**: Express Validator
- **Security**: Helmet, CORS, Rate Limiting

### Infrastructure
- **Database**: PostgreSQL (via Supabase)
- **Authentication**: Supabase Auth
- **Containerization**: Docker + Docker Compose
- **Development**: Hot reloading, TypeScript

## 📊 Database Schema

The application uses the following main tables:

- **users** - User profiles and preferences
- **weight_entries** - Daily weight tracking
- **meal_presets** - Predefined meals and nutrition info
- **workout_presets** - Predefined workouts
- **week_sprints** - Weekly weight loss goals
- **day_entries** - Daily tracking data
- **consumed_meals** - Meals consumed each day
- **completed_workouts** - Workouts completed each day
- **ai_plans** - AI-generated meal and workout plans
- **health_data** - Health metrics from external sources

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Core Features
- `GET/POST/PUT/DELETE /api/weight` - Weight tracking
- `GET/POST/PUT/DELETE /api/meals` - Meal presets
- `GET/POST/PUT/DELETE /api/workouts` - Workout presets
- `GET/POST/PUT/DELETE /api/sprints` - Sprint management
- `GET/POST/PUT/DELETE /api/days` - Daily entries
- `GET/POST/PUT/DELETE /api/health` - Health data
- `POST /api/ai/generate-plan` - AI plan generation

## 🔧 Development

### Available Scripts

#### Frontend
```bash
cd cut-sprint-front
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run sync         # Sync with Capacitor
```

#### Backend
```bash
cd cut-sprint-backend
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run test         # Run tests
npm run lint         # Run ESLint
```

#### Infrastructure
```bash
docker-compose up -d # Start Supabase services
docker-compose down  # Stop Supabase services
docker-compose logs  # View service logs
```

### Development Workflow

1. **Database Changes**: Modify schema in `supabase/init/`
2. **Backend Changes**: Update routes in `cut-sprint-backend/src/routes/`
3. **Frontend Changes**: Update components in `cut-sprint-front/src/components/`
4. **API Integration**: Use `ApiService` in frontend for backend communication

## 📱 Mobile Development

The frontend is configured for mobile deployment with Capacitor:

```bash
cd cut-sprint-front

# Add mobile platforms
npx cap add android
npx cap add ios

# Sync changes
npm run sync

# Open in native IDE
npx cap open android
npx cap open ios
```

## 🌍 Internationalization

The application supports multiple languages:
- **English** (en)
- **Polish** (pl)

Language files are located in `cut-sprint-front/src/locales/`

## 🤖 AI Integration

The application supports multiple AI providers:
- **OpenAI** - GPT-4 and GPT-3.5
- **Anthropic** - Claude models
- **DeepSeek** - Free tier available
- **HuggingFace** - Open source models
- **Ollama** - Local AI models

Configure your preferred provider in the environment variables.

## 🔒 Security Features

- **JWT Authentication** - Secure token-based authentication
- **Rate Limiting** - Prevents abuse with request limits
- **Input Validation** - Comprehensive request validation
- **CORS Protection** - Configured for frontend access
- **Error Handling** - Secure error responses
- **Row Level Security** - Database-level access control

## 🚀 Deployment

### Production Setup

1. **Database**: Use Supabase Cloud or self-hosted PostgreSQL
2. **Backend**: Deploy to Vercel, Railway, or any Node.js hosting
3. **Frontend**: Deploy to Vercel, Netlify, or any static hosting
4. **Environment**: Update environment variables for production

### Environment Variables

#### Frontend (`.env`)
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_URL=your_backend_api_url
```

#### Backend (`.env`)
```env
PORT=3001
NODE_ENV=production
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
FRONTEND_URL=your_frontend_url
```

## 📚 Documentation

- [Frontend Documentation](./cut-sprint-front/README.md)
- [Backend Documentation](./cut-sprint-backend/README.md)
- [API Documentation](./cut-sprint-backend/README.md#api-endpoints)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Ensure all components have proper IDs/classes
5. Update translations if needed
6. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 🆘 Support

For issues and questions:
1. Check the documentation in each service's README
2. Search existing issues
3. Create a new issue with detailed information

## 🔗 Links

- **Supabase Studio**: http://localhost:3000 (local development)
- **Frontend**: http://localhost:4321
- **Backend API**: http://localhost:3001
- **API Health Check**: http://localhost:3001/health
