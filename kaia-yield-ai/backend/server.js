const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const winston = require('winston');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

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

app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true
}));
app.use(express.json());
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

app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
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

app.listen(PORT, () => {
  logger.info(`KAIA YIELD AI Backend running on port ${PORT}`);
  console.log(`🚀 Server started on http://localhost:${PORT}`);
});