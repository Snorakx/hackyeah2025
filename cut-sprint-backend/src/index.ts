import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import dotenv from 'dotenv';

// Import routes
import authRoutes from './routes/auth';
import usersRoutes from './routes/users';
import productsRoutes from './routes/products';
import mealsRoutes from './routes/meals';
import activitiesRoutes from './routes/activities';
import weightsRoutes from './routes/weights';
import weeklyBudgetsRoutes from './routes/weeklyBudgets';
import userFavoritesRoutes from './routes/userFavorites';
import dailySummariesRoutes from './routes/dailySummaries';
import healthRoutes from './routes/health';
import onboardingRoutes from './routes/onboarding';
import friendsRoutes from './routes/friends';
import favoritesRoutes from './routes/favorites';
import notificationsRoutes from './routes/notifications';

// Import middleware
import { authMiddleware } from './middleware/auth';
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:4321',
  credentials: true
}));

// Rate limiting removed - only AI analysis limit (10/day) is enforced

// Logging
app.use(morgan('combined'));

// Compression
app.use(compression());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Simple health check endpoint (no auth required)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Health data routes (require auth)
app.use('/api/health-data', authMiddleware, healthRoutes);

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', authMiddleware, usersRoutes);
app.use('/api/products', authMiddleware, productsRoutes);
app.use('/api/meals', authMiddleware, mealsRoutes);
app.use('/api/activities', authMiddleware, activitiesRoutes);
app.use('/api/weights', authMiddleware, weightsRoutes);
app.use('/api/weekly-budgets', authMiddleware, weeklyBudgetsRoutes);
app.use('/api/favorites', authMiddleware, favoritesRoutes);
app.use('/api/daily-summaries', authMiddleware, dailySummariesRoutes);
app.use('/api/onboarding', authMiddleware, onboardingRoutes);
app.use('/api/friends', authMiddleware, friendsRoutes);
app.use('/api/notifications', notificationsRoutes);

// Error handling
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
});

export default app;


