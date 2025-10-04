# Cut Sprint Backend API

Backend API for the Cut Sprint weight loss application, built with Express.js and Supabase.

## Features

- **Authentication**: JWT-based authentication with Supabase Auth
- **User Management**: Profile creation, updates, and account deletion
- **Weight Tracking**: CRUD operations for weight entries with statistics
- **Meal Management**: Global and user-specific meal presets
- **Workout Management**: Global and user-specific workout presets
- **Sprint Management**: Weight loss sprint planning and tracking
- **Day Entries**: Daily calorie and activity tracking
- **AI Integration**: AI-powered plan generation (mock implementation)
- **Health Data**: Comprehensive health metrics tracking
- **Security**: Rate limiting, CORS, input validation, and error handling

## Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Validation**: Express Validator
- **Security**: Helmet, CORS, Rate Limiting
- **Development**: tsx for hot reloading

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/me` - Get current user

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `DELETE /api/users/account` - Delete user account

### Weight Tracking
- `GET /api/weight` - Get weight entries
- `POST /api/weight` - Add weight entry
- `PUT /api/weight/:id` - Update weight entry
- `DELETE /api/weight/:id` - Delete weight entry
- `GET /api/weight/stats` - Get weight statistics

### Meals
- `GET /api/meals` - Get meal presets
- `POST /api/meals` - Create meal preset
- `PUT /api/meals/:id` - Update meal preset
- `DELETE /api/meals/:id` - Delete meal preset

### Workouts
- `GET /api/workouts` - Get workout presets
- `POST /api/workouts` - Create workout preset
- `PUT /api/workouts/:id` - Update workout preset
- `DELETE /api/workouts/:id` - Delete workout preset

### Sprints
- `GET /api/sprints` - Get user sprints
- `GET /api/sprints/:id` - Get specific sprint
- `POST /api/sprints` - Create new sprint
- `PUT /api/sprints/:id` - Update sprint
- `DELETE /api/sprints/:id` - Delete sprint
- `GET /api/sprints/:id/stats` - Get sprint statistics

### Day Entries
- `GET /api/days` - Get day entries
- `GET /api/days/:date` - Get specific day entry
- `POST /api/days` - Create/update day entry
- `POST /api/days/:date/meals` - Add consumed meal
- `POST /api/days/:date/workouts` - Add completed workout
- `DELETE /api/days/meals/:id` - Delete consumed meal
- `DELETE /api/days/workouts/:id` - Delete completed workout

### AI Plans
- `POST /api/ai/generate-plan` - Generate AI plan for sprint
- `GET /api/ai/plan/:sprint_id` - Get AI plan for sprint
- `GET /api/ai/plans` - Get all AI plans
- `DELETE /api/ai/plan/:id` - Delete AI plan

### Health Data
- `GET /api/health` - Get health data
- `GET /api/health/:date` - Get health data for date
- `POST /api/health` - Create/update health data
- `DELETE /api/health/:date` - Delete health data
- `GET /api/health/stats/overview` - Get health statistics

## Setup

### Prerequisites

- Node.js 18+ 
- Docker and Docker Compose
- Supabase CLI (optional)

### Installation

1. **Clone the repository**
   ```bash
   cd cut-sprint-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

4. **Start Supabase (if not already running)**
   ```bash
   # From the parent directory
   docker-compose up -d
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

The API will be available at `http://localhost:3001`

### Environment Variables

- `PORT` - Server port (default: 3001)
- `NODE_ENV` - Environment (development/production)
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `FRONTEND_URL` - Frontend URL for CORS

## Development

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run test` - Run tests
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

### Project Structure

```
src/
├── index.ts              # Main server entry point
├── lib/
│   └── supabase.ts       # Supabase client configuration
├── middleware/
│   ├── auth.ts           # Authentication middleware
│   └── errorHandler.ts   # Error handling middleware
└── routes/
    ├── auth.ts           # Authentication routes
    ├── users.ts          # User management routes
    ├── weight.ts         # Weight tracking routes
    ├── meals.ts          # Meal preset routes
    ├── workouts.ts       # Workout preset routes
    ├── sprints.ts        # Sprint management routes
    ├── days.ts           # Day entry routes
    ├── ai.ts             # AI plan routes
    └── health.ts         # Health data routes
```

## Database Schema

The API uses the following Supabase tables:

- `users` - User profiles
- `weight_entries` - Weight tracking data
- `meal_presets` - Meal templates
- `workout_presets` - Workout templates
- `week_sprints` - Weight loss sprints
- `day_entries` - Daily tracking entries
- `consumed_meals` - Meals consumed on specific days
- `completed_workouts` - Workouts completed on specific days
- `ai_plans` - AI-generated plans
- `health_data` - Health metrics

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Rate Limiting**: Prevents abuse with request limits
- **Input Validation**: Comprehensive request validation
- **CORS Protection**: Configured for frontend access
- **Error Handling**: Secure error responses
- **Row Level Security**: Database-level access control

## API Documentation

The API follows RESTful conventions and returns JSON responses. All endpoints require authentication except for registration and login.

### Response Format

```json
{
  "data": {...},
  "message": "Success message",
  "error": "Error message (if applicable)"
}
```

### Error Handling

The API returns appropriate HTTP status codes and error messages:

- `400` - Bad Request (validation errors)
- `401` - Unauthorized (authentication required)
- `404` - Not Found
- `500` - Internal Server Error

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License
