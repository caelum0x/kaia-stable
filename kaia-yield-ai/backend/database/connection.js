const { Pool } = require('pg');
const redis = require('redis');
require('dotenv').config();

class DatabaseConnection {
  constructor() {
    // PostgreSQL connection
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/kaia_yield_ai',
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // Redis connection for caching
    this.redisClient = redis.createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      retry_strategy: (options) => {
        if (options.error && options.error.code === 'ECONNREFUSED') {
          console.error('Redis connection refused');
          return new Error('Redis connection refused');
        }
        if (options.total_retry_time > 1000 * 60 * 60) {
          return new Error('Redis retry time exhausted');
        }
        if (options.attempt > 10) {
          return undefined;
        }
        return Math.min(options.attempt * 100, 3000);
      }
    });

    this.redisClient.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    this.redisClient.on('connect', () => {
      console.log('🔗 Connected to Redis cache');
    });

    // Initialize database tables and Redis connection
    this.init();
  }

  async init() {
    try {
      await this.redisClient.connect();
      await this.initTables();
      console.log('🔗 Connected to PostgreSQL database');
    } catch (error) {
      console.error('Database initialization error:', error);
      // Fallback to mock mode if database is not available
      this.useMockMode = true;
      this.mockData = new Map();
      this.initMockData();
      console.log('🔗 Using mock database fallback mode');
    }
  }

  async initTables() {
    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        address VARCHAR(42) UNIQUE NOT NULL,
        line_user_id VARCHAR(255),
        display_name VARCHAR(255),
        risk_tolerance INTEGER DEFAULT 5,
        level INTEGER DEFAULT 1,
        points INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    const createStrategiesTable = `
      CREATE TABLE IF NOT EXISTS strategies (
        id SERIAL PRIMARY KEY,
        contract_id INTEGER UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        contract_address VARCHAR(42) NOT NULL,
        base_apy INTEGER NOT NULL,
        current_apy INTEGER NOT NULL,
        risk_level INTEGER NOT NULL,
        min_deposit BIGINT NOT NULL,
        max_deposit BIGINT NOT NULL,
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    const createDepositsTable = `
      CREATE TABLE IF NOT EXISTS deposits (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        strategy_id INTEGER REFERENCES strategies(id),
        amount BIGINT NOT NULL,
        transaction_hash VARCHAR(66),
        block_number INTEGER,
        deposit_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_reward_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        accumulated_rewards BIGINT DEFAULT 0,
        active BOOLEAN DEFAULT true
      );
    `;

    const createMissionsTable = `
      CREATE TABLE IF NOT EXISTS missions (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        reward INTEGER NOT NULL,
        difficulty INTEGER NOT NULL,
        duration INTEGER NOT NULL,
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    const createUserMissionsTable = `
      CREATE TABLE IF NOT EXISTS user_missions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        mission_id INTEGER REFERENCES missions(id),
        progress INTEGER DEFAULT 0,
        start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed BOOLEAN DEFAULT false,
        claimed BOOLEAN DEFAULT false,
        UNIQUE(user_id, mission_id)
      );
    `;

    const createIndexes = `
      CREATE INDEX IF NOT EXISTS idx_users_address ON users(address);
      CREATE INDEX IF NOT EXISTS idx_deposits_user_id ON deposits(user_id);
      CREATE INDEX IF NOT EXISTS idx_deposits_strategy_id ON deposits(strategy_id);
      CREATE INDEX IF NOT EXISTS idx_user_missions_user_id ON user_missions(user_id);
    `;

    try {
      await this.pool.query(createUsersTable);
      await this.pool.query(createStrategiesTable);
      await this.pool.query(createDepositsTable);
      await this.pool.query(createMissionsTable);
      await this.pool.query(createUserMissionsTable);
      await this.pool.query(createIndexes);

      // Insert default strategies if they don't exist
      await this.insertDefaultStrategies();
      await this.insertDefaultMissions();

      console.log('✅ Database tables initialized successfully');
    } catch (error) {
      console.error('Error creating database tables:', error);
      throw error;
    }
  }

  async insertDefaultStrategies() {
    const checkStrategies = 'SELECT COUNT(*) FROM strategies';
    const result = await this.pool.query(checkStrategies);

    if (parseInt(result.rows[0].count) === 0) {
      const insertStrategies = `
        INSERT INTO strategies (contract_id, name, description, contract_address, base_apy, current_apy, risk_level, min_deposit, max_deposit, active)
        VALUES
        (1, 'Stable Earn', 'Low-risk stable yield strategy', '0xA6D8A3Ff0E83C72e8F14e7D1234Bb8DeC3F5C1c2', 500, 520, 2, 10000000, 10000000000, true),
        (2, 'Growth Plus', 'Medium-risk growth strategy', '0xB7E9A4Ff1F94D83f9F25e8E2345Cc9EeD4F6D2d3', 1200, 1180, 5, 50000000, 50000000000, true),
        (3, 'High Yield Pro', 'High-risk high-reward strategy', '0xC8F0B5Ff2Fa5E94g0F36f9F3456DdAeF5G7E3e4', 2500, 2650, 8, 100000000, 100000000000, true)
        ON CONFLICT (contract_id) DO NOTHING;
      `;
      await this.pool.query(insertStrategies);
      console.log('✅ Default strategies inserted');
    }
  }

  async insertDefaultMissions() {
    const checkMissions = 'SELECT COUNT(*) FROM missions';
    const result = await this.pool.query(checkMissions);

    if (parseInt(result.rows[0].count) === 0) {
      const insertMissions = `
        INSERT INTO missions (name, description, reward, difficulty, duration, active)
        VALUES
        ('First Deposit', 'Make your first USDT deposit', 100, 1, 86400, true),
        ('Yield Explorer', 'Try 3 different yield strategies', 250, 2, 604800, true),
        ('Consistent Investor', 'Deposit for 7 consecutive days', 500, 3, 604800, true),
        ('High Roller', 'Deposit more than 1000 USDT in a single transaction', 1000, 4, 2592000, true),
        ('Social Butterfly', 'Refer 5 friends to the platform', 2500, 5, 2592000, true);
      `;
      await this.pool.query(insertMissions);
      console.log('✅ Default missions inserted');
    }
  }

  initMockData() {
    // Mock strategies data (fallback)
    this.mockData.set('strategies', [
      {
        id: 1,
        contract_id: 1,
        name: 'Stable Earn',
        description: 'Low-risk stable yield strategy',
        contract_address: '0xA6D8A3Ff0E83C72e8F14e7D1234Bb8DeC3F5C1c2',
        base_apy: 500,
        current_apy: 520,
        risk_level: 2,
        min_deposit: 10000000,
        max_deposit: 10000000000,
        active: true
      },
      {
        id: 2,
        contract_id: 2,
        name: 'Growth Plus',
        description: 'Medium-risk growth strategy',
        contract_address: '0xB7E9A4Ff1F94D83f9F25e8E2345Cc9EeD4F6D2d3',
        base_apy: 1200,
        current_apy: 1180,
        risk_level: 5,
        min_deposit: 50000000,
        max_deposit: 50000000000,
        active: true
      },
      {
        id: 3,
        contract_id: 3,
        name: 'High Yield Pro',
        description: 'High-risk high-reward strategy',
        contract_address: '0xC8F0B5Ff2Fa5E94g0F36f9F3456DdAeF5G7E3e4',
        base_apy: 2500,
        current_apy: 2650,
        risk_level: 8,
        min_deposit: 100000000,
        max_deposit: 100000000000,
        active: true
      }
    ]);
  }

  async query(text, params) {
    if (this.useMockMode) {
      console.log('Mock query:', text);
      return { rows: [] };
    }

    try {
      const start = Date.now();
      const result = await this.pool.query(text, params);
      const duration = Date.now() - start;

      if (process.env.LOG_LEVEL === 'debug') {
        console.log('Query executed:', { text, duration: `${duration}ms`, rows: result.rowCount });
      }

      return result;
    } catch (error) {
      console.error('Database query error:', { error: error.message, query: text, params });
      throw error;
    }
  }

  async healthCheck() {
    if (this.useMockMode) {
      return {
        database: true,
        cache: true,
        overall: true,
        mode: 'mock'
      };
    }

    try {
      // Test PostgreSQL connection
      const dbResult = await this.pool.query('SELECT 1');
      const dbHealthy = dbResult.rows.length > 0;

      // Test Redis connection
      let cacheHealthy = false;
      try {
        await this.redisClient.ping();
        cacheHealthy = true;
      } catch (redisError) {
        console.error('Redis health check failed:', redisError);
      }

      return {
        database: dbHealthy,
        cache: cacheHealthy,
        overall: dbHealthy && cacheHealthy,
        mode: 'production'
      };
    } catch (error) {
      console.error('Health check failed:', error);
      return {
        database: false,
        cache: false,
        overall: false,
        mode: 'production',
        error: error.message
      };
    }
  }

  async close() {
    if (this.useMockMode) {
      console.log('Mock database closed');
      return;
    }

    try {
      await this.pool.end();
      await this.redisClient.quit();
      console.log('Database connections closed');
    } catch (error) {
      console.error('Error closing database connections:', error);
    }
  }

  async get(key) {
    if (this.useMockMode) {
      return this.mockData.get(key);
    }

    try {
      const value = await this.redisClient.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async set(key, value, ttl = 300) {
    if (this.useMockMode) {
      this.mockData.set(key, value);
      return true;
    }

    try {
      await this.redisClient.setEx(key, ttl, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }

  async del(key) {
    if (this.useMockMode) {
      return this.mockData.delete(key);
    }

    try {
      const result = await this.redisClient.del(key);
      return result > 0;
    } catch (error) {
      console.error('Cache delete error:', error);
      return false;
    }
  }
}

class UserService {
  constructor(db) {
    this.db = db;
  }

  async getUserByAddress(address) {
    if (this.db.useMockMode) {
      return {
        id: 1,
        address,
        line_user_id: 'U1a2b3c4d5e6f7890123456789abcdef',
        display_name: 'Kaia Yield User',
        risk_tolerance: 5,
        level: 1
      };
    }

    try {
      const query = 'SELECT * FROM users WHERE address = $1';
      const result = await this.db.query(query, [address]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error fetching user by address:', error);
      return null;
    }
  }

  async createOrUpdateUser(userData) {
    if (this.db.useMockMode) {
      return {
        id: 1,
        ...userData
      };
    }

    try {
      const upsertQuery = `
        INSERT INTO users (address, line_user_id, display_name, risk_tolerance, level, points)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (address) DO UPDATE SET
          line_user_id = EXCLUDED.line_user_id,
          display_name = EXCLUDED.display_name,
          risk_tolerance = EXCLUDED.risk_tolerance,
          level = EXCLUDED.level,
          points = EXCLUDED.points,
          updated_at = CURRENT_TIMESTAMP
        RETURNING *;
      `;

      const values = [
        userData.address,
        userData.line_user_id || null,
        userData.display_name || null,
        userData.risk_tolerance || 5,
        userData.level || 1,
        userData.points || 0
      ];

      const result = await this.db.query(upsertQuery, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error creating/updating user:', error);
      throw error;
    }
  }
}

class StrategyService {
  constructor(db) {
    this.db = db;
  }

  async getAllStrategies() {
    if (this.db.useMockMode) {
      return this.db.get('strategies') || [];
    }

    try {
      // Try to get from cache first
      const cacheKey = 'strategies:all';
      const cached = await this.db.get(cacheKey);
      if (cached) {
        return cached;
      }

      // Fetch from database
      const query = 'SELECT * FROM strategies WHERE active = true ORDER BY id';
      const result = await this.db.query(query);

      // Cache the result for 5 minutes
      await this.db.set(cacheKey, result.rows, 300);

      return result.rows;
    } catch (error) {
      console.error('Error fetching strategies:', error);
      return [];
    }
  }

  async getStrategyById(id) {
    if (this.db.useMockMode) {
      const strategies = await this.getAllStrategies();
      return strategies.find(s => s.id === id);
    }

    try {
      // Try cache first
      const cacheKey = `strategy:${id}`;
      const cached = await this.db.get(cacheKey);
      if (cached) {
        return cached;
      }

      const query = 'SELECT * FROM strategies WHERE id = $1 AND active = true';
      const result = await this.db.query(query, [id]);

      const strategy = result.rows[0] || null;
      if (strategy) {
        await this.db.set(cacheKey, strategy, 300);
      }

      return strategy;
    } catch (error) {
      console.error('Error fetching strategy by ID:', error);
      return null;
    }
  }

  async updateStrategyAPY(strategyId, newAPY, source = 'system') {
    if (this.db.useMockMode) {
      const strategies = await this.getAllStrategies();
      const strategy = strategies.find(s => s.id === strategyId);
      if (strategy) {
        strategy.current_apy = newAPY;
      }
      return strategy;
    }

    try {
      const updateQuery = `
        UPDATE strategies
        SET current_apy = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2 AND active = true
        RETURNING *;
      `;

      const result = await this.db.query(updateQuery, [newAPY, strategyId]);

      if (result.rows[0]) {
        // Invalidate cache
        await this.db.del('strategies:all');
        await this.db.del(`strategy:${strategyId}`);

        console.log(`Strategy ${strategyId} APY updated to ${newAPY}% from ${source}`);
      }

      return result.rows[0] || null;
    } catch (error) {
      console.error('Error updating strategy APY:', error);
      throw error;
    }
  }
}

// Create singleton instances
const db = new DatabaseConnection();
const userService = new UserService(db);
const strategyService = new StrategyService(db);

module.exports = {
  db,
  userService,
  strategyService
};