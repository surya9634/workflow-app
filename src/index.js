import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { StatusCodes } from 'http-status-codes';
import config from './config/config.js';

// Import routes (to be created)
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
// Import other route files as needed

// Initialize Express app
const app = express();

// Trust first proxy (important for rate limiting behind proxies like nginx, Heroku, etc.)
app.set('trust proxy', 1);

// Middleware
app.use(helmet()); // Security headers
app.use(express.json()); // Parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded request bodies

// CORS configuration
app.use(cors({
  origin: config.cors.origin,
  methods: config.cors.methods,
  allowedHeaders: config.cors.allowedHeaders,
  credentials: config.cors.credentials,
}));

// Logging middleware in development
if (config.env === 'development') {
  app.use(morgan('dev'));
}

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: { 
    success: false, 
    message: 'Too many requests, please try again later.' 
  },
});

// Apply rate limiting to all API routes
app.use('/api', apiLimiter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(StatusCodes.OK).json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: config.env,
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
// Add other route handlers here

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(StatusCodes.NOT_FOUND).json({
    success: false,
    message: 'API endpoint not found',
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  
  const statusCode = err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
  const message = err.message || 'Internal Server Error';
  
  res.status(statusCode).json({
    success: false,
    message,
    ...(config.env === 'development' && { stack: err.stack }),
  });
});

// Start the server
const server = app.listen(config.port, () => {
  console.log(`\n🚀 Server running in ${config.env} mode on port ${config.port}`);
  console.log('=====================================');
  console.log(`🔗 Health Check: http://localhost:${config.port}/api/health`);
  console.log('=====================================');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  // Close server & exit process
  server.close(() => process.exit(1));
});

export default app;
