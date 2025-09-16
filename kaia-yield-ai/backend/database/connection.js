// Mock database for MVP - no PostgreSQL required
class DatabaseConnection {
  constructor() {
    this.mockData = new Map();
    this.initMockData();
    console.log('🔗 Using mock database for MVP');
  }

  initMockData() {
    // Mock strategies data
    this.mockData.set('strategies', [
      {
        id: 1,
        contract_id: 1,
        name: 'Stable Earn',
        description: 'Low-risk stable yield strategy',
        contract_address: '0x1234567890123456789012345678901234567890',
        base_apy: 500,
        current_apy: 520,
        risk_level: 2,
        min_deposit: 10000000, // 10 USDT
        max_deposit: 10000000000, // 10K USDT
        active: true
      },
      {
        id: 2,
        contract_id: 2,
        name: 'Growth Plus',
        description: 'Medium-risk growth strategy',
        contract_address: '0x2345678901234567890123456789012345678901',
        base_apy: 1200,
        current_apy: 1180,
        risk_level: 5,
        min_deposit: 50000000, // 50 USDT
        max_deposit: 50000000000, // 50K USDT
        active: true
      },
      {
        id: 3,
        contract_id: 3,
        name: 'High Yield Pro',
        description: 'High-risk high-reward strategy',
        contract_address: '0x3456789012345678901234567890123456789012',
        base_apy: 2500,
        current_apy: 2650,
        risk_level: 8,
        min_deposit: 100000000, // 100 USDT
        max_deposit: 100000000000, // 100K USDT
        active: true
      }
    ]);
  }

  async query(text, params) {
    // Mock query implementation
    console.log('Mock query:', text);
    return { rows: [] };
  }

  async healthCheck() {
    return {
      database: true,
      cache: true,
      overall: true
    };
  }

  async close() {
    console.log('Mock database closed');
  }

  async get(key) {
    return this.mockData.get(key);
  }

  async set(key, value, ttl = 300) {
    this.mockData.set(key, value);
    return true;
  }

  async del(key) {
    return this.mockData.delete(key);
  }
}

class UserService {
  constructor(db) {
    this.db = db;
  }

  async getUserByAddress(address) {
    return {
      id: 1,
      address,
      line_user_id: 'test_user',
      display_name: 'Test User',
      risk_tolerance: 5,
      level: 1
    };
  }

  async createOrUpdateUser(userData) {
    return {
      id: 1,
      ...userData
    };
  }
}

class StrategyService {
  constructor(db) {
    this.db = db;
  }

  async getAllStrategies() {
    return this.db.get('strategies') || [];
  }

  async getStrategyById(id) {
    const strategies = await this.getAllStrategies();
    return strategies.find(s => s.id === id);
  }

  async updateStrategyAPY(strategyId, newAPY, source) {
    const strategies = await this.getAllStrategies();
    const strategy = strategies.find(s => s.id === strategyId);
    if (strategy) {
      strategy.current_apy = newAPY;
    }
    return strategy;
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