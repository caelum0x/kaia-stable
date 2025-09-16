const { Pool } = require('pg');
const Redis = require('redis');

class DatabaseConnection {
  constructor() {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is required. No mock data mode available.');
    }

    // PostgreSQL connection
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // Redis connection for caching
    this.redis = Redis.createClient({
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

    this.redis.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    this.redis.on('connect', () => {
      console.log('Redis connected successfully');
    });

    // Initialize connection
    this.init();
  }


  async init() {
    try {
      // Test PostgreSQL connection
      const client = await this.pool.connect();
      console.log('Database connected successfully');
      client.release();

      // Connect Redis
      await this.redis.connect();
    } catch (error) {
      console.error('Database initialization error:', error);
      throw error;
    }
  }

  // PostgreSQL query methods
  async query(text, params) {
    const start = Date.now();
    try {
      const res = await this.pool.query(text, params);
      const duration = Date.now() - start;

      if (duration > 1000) {
        console.log('Slow query detected:', { text, duration, rows: res.rowCount });
      }

      return res;
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  }

  async getClient() {
    return await this.pool.connect();
  }

  // Transaction helper
  async withTransaction(callback) {
    const client = await this.getClient();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Redis caching methods
  async get(key) {
    try {
      const value = await this.redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Redis get error:', error);
      return null;
    }
  }

  async set(key, value, ttl = 300) {
    try {
      const serialized = JSON.stringify(value);
      await this.redis.setEx(key, ttl, serialized);
      return true;
    } catch (error) {
      console.error('Redis set error:', error);
      return false;
    }
  }

  async del(key) {
    try {
      await this.redis.del(key);
      return true;
    } catch (error) {
      console.error('Redis delete error:', error);
      return false;
    }
  }

  async invalidatePattern(pattern) {
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(keys);
      }
      return true;
    } catch (error) {
      console.error('Redis pattern invalidation error:', error);
      return false;
    }
  }

  // Health check
  async healthCheck() {
    try {
      // Check PostgreSQL
      const pgResult = await this.query('SELECT 1 as healthy');
      const pgHealthy = pgResult.rows[0].healthy === 1;

      // Check Redis
      const redisResult = await this.redis.ping();
      const redisHealthy = redisResult === 'PONG';

      return {
        database: pgHealthy,
        cache: redisHealthy,
        overall: pgHealthy && redisHealthy
      };
    } catch (error) {
      console.error('Health check error:', error);
      return {
        database: false,
        cache: false,
        overall: false,
        error: error.message
      };
    }
  }

  // Graceful shutdown
  async close() {
    try {
      await this.pool.end();
      await this.redis.quit();
      console.log('Database connections closed gracefully');
    } catch (error) {
      console.error('Error closing database connections:', error);
    }
  }
}

// User management methods
class UserService {
  constructor(db) {
    this.db = db;
  }

  async createUser(lineUserData) {
    const query = `
      INSERT INTO users (line_user_id, display_name, picture_url, status_message, wallet_address)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (line_user_id)
      DO UPDATE SET
        display_name = EXCLUDED.display_name,
        picture_url = EXCLUDED.picture_url,
        status_message = EXCLUDED.status_message,
        wallet_address = COALESCE(EXCLUDED.wallet_address, users.wallet_address),
        last_seen = NOW(),
        updated_at = NOW()
      RETURNING *
    `;

    const values = [
      lineUserData.userId,
      lineUserData.displayName,
      lineUserData.pictureUrl || null,
      lineUserData.statusMessage || null,
      lineUserData.walletAddress || null
    ];

    const result = await this.db.query(query, values);
    return result.rows[0];
  }

  async getUserByLineId(lineUserId) {
    const cacheKey = `user:line:${lineUserId}`;

    // Try cache first
    let user = await this.db.get(cacheKey);
    if (user) return user;

    // Query database
    const query = 'SELECT * FROM users WHERE line_user_id = $1';
    const result = await this.db.query(query, [lineUserId]);

    if (result.rows.length > 0) {
      user = result.rows[0];
      await this.db.set(cacheKey, user, 600); // Cache for 10 minutes
    }

    return user;
  }

  async updateUserWallet(lineUserId, walletAddress) {
    const query = `
      UPDATE users
      SET wallet_address = $1, updated_at = NOW()
      WHERE line_user_id = $2
      RETURNING *
    `;

    const result = await this.db.query(query, [walletAddress, lineUserId]);

    // Invalidate cache
    await this.db.del(`user:line:${lineUserId}`);

    return result.rows[0];
  }

  async getUserStats(userId) {
    const cacheKey = `user:stats:${userId}`;

    let stats = await this.db.get(cacheKey);
    if (stats) return stats;

    const query = `
      SELECT
        us.*,
        COALESCE(COUNT(DISTINCT ud.strategy_id), 0) as active_strategies,
        COALESCE(SUM(ud.amount), 0) as current_deposited
      FROM user_stats us
      LEFT JOIN user_deposits ud ON us.user_id = ud.user_id AND ud.status = 'active'
      WHERE us.user_id = $1
      GROUP BY us.user_id, us.total_points, us.level, us.experience_points,
               us.streak_days, us.last_activity, us.total_deposited,
               us.total_rewards, us.successful_trades, us.referrals_count,
               us.social_sharing_count, us.updated_at
    `;

    const result = await this.db.query(query, [userId]);

    if (result.rows.length > 0) {
      stats = result.rows[0];
      await this.db.set(cacheKey, stats, 300); // Cache for 5 minutes
    }

    return stats;
  }
}

// Strategy management methods
class StrategyService {
  constructor(db) {
    this.db = db;
  }

  async getAllStrategies() {
    const cacheKey = 'strategies:all';

    let strategies = await this.db.get(cacheKey);
    if (strategies) return strategies;


    const query = `
      SELECT s.*, sa.avg_apy_30d, sa.total_deposits
      FROM strategies s
      LEFT JOIN strategy_analytics sa ON s.id = sa.id
      WHERE s.active = true
      ORDER BY s.id
    `;

    const result = await this.db.query(query);
    strategies = result.rows;

    await this.db.set(cacheKey, strategies, 300); // Cache for 5 minutes
    return strategies;
  }

  async updateStrategyAPY(strategyId, newAPY, source) {
    return await this.db.withTransaction(async (client) => {
      // Update strategy
      const updateQuery = `
        UPDATE strategies
        SET current_apy = $1, last_apy_update = NOW(), updated_at = NOW()
        WHERE id = $2
        RETURNING *
      `;
      const strategyResult = await client.query(updateQuery, [newAPY, strategyId]);

      // Record performance data
      const performanceQuery = `
        INSERT INTO strategy_performance (strategy_id, date, apy, tvl, users_count, deposits_count, withdrawals_count, volume, performance_data)
        VALUES ($1, CURRENT_DATE, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (strategy_id, date)
        DO UPDATE SET
          apy = EXCLUDED.apy,
          performance_data = EXCLUDED.performance_data
      `;

      const performanceData = {
        source,
        update_time: new Date().toISOString(),
        previous_apy: strategyResult.rows[0].current_apy
      };

      await client.query(performanceQuery, [
        strategyId,
        newAPY,
        0, // TVL - would be calculated from actual deposits
        0, // Users count
        0, // Deposits count
        0, // Withdrawals count
        0, // Volume
        JSON.stringify(performanceData)
      ]);

      // Invalidate cache
      await this.db.del('strategies:all');

      return strategyResult.rows[0];
    });
  }
}

// Create singleton instance
const db = new DatabaseConnection();
const userService = new UserService(db);
const strategyService = new StrategyService(db);

module.exports = {
  db,
  userService,
  strategyService,
  DatabaseConnection,
  UserService,
  StrategyService
};