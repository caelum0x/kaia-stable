const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const morgan = require('morgan');
const winston = require('winston');
const { db } = require('./database/connection');
const SchedulerService = require('./services/scheduler');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.'
});

// Security and performance middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://static.line-scdn.net"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.baobab.klaytn.net", "https://api.cypress.klaytn.net"]
    }
  }
}));

app.use(compression());

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'https://liff.line.me'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use(morgan('combined', {
  stream: { write: message => logger.info(message.trim()) }
}));

app.use(limiter);

app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path} - ${req.ip}`);
  next();
});

const strategiesRoutes = require('./routes/strategies');
const yieldRoutes = require('./routes/yield');
const aiRoutes = require('./routes/ai');
const gameRoutes = require('./routes/game');
const lineRoutes = require('./routes/line');
const analyticsRoutes = require('./routes/analytics');

app.use('/api/strategies', strategiesRoutes);
app.use('/api/yield', yieldRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/game', gameRoutes);
app.use('/api/line', lineRoutes);
app.use('/api/analytics', analyticsRoutes);

// Health check endpoint with database connectivity
app.get('/health', async (req, res) => {
  try {
    const health = await db.healthCheck();
    const scheduler = schedulerService ? schedulerService.getJobStatus() : null;

    res.json({
      status: health.overall ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      services: {
        database: health.database,
        cache: health.cache,
        scheduler: scheduler ? Object.keys(scheduler).length : 0
      },
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      env: process.env.NODE_ENV
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

app.get('/', (req, res) => {
  res.json({
    name: 'KAIA YIELD AI Backend',
    version: '1.0.0',
    description: 'AI-powered stablecoin yield optimization API',
    endpoints: {
      strategies: '/api/strategies',
      yield: '/api/yield',
      ai: '/api/ai',
      game: '/api/game',
      line: '/api/line',
      analytics: '/api/analytics'
    }
  });
});

app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Initialize scheduler
let schedulerService;
if (process.env.NODE_ENV === 'production' || process.env.ENABLE_SCHEDULER === 'true') {
  schedulerService = new SchedulerService();
  schedulerService.start();
}

// Graceful shutdown
const gracefulShutdown = async (signal) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);

  if (schedulerService) {
    schedulerService.stop();
  }

  await db.close();

  logger.info('Graceful shutdown completed');
  process.exit(0);
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

const server = app.listen(PORT, () => {
  logger.info(`KAIA YIELD AI Backend running on port ${PORT}`);
  console.log(`🚀 Server started on http://localhost:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔗 Database: ${process.env.DATABASE_URL ? 'Connected' : 'Not configured'}`);
  console.log(`📈 Scheduler: ${schedulerService ? 'Running' : 'Disabled'}`);
});

// Handle server errors
server.on('error', (error) => {
  logger.error('Server error:', error);
});

module.exports = app;