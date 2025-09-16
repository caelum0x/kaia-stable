// Mock blockchain service for MVP
class BlockchainService {
  constructor() {
    console.log('🔗 Using mock blockchain service for MVP');
  }

  async getAllStrategies() {
    return [
      {
        id: 1,
        name: 'Stable Earn',
        strategy: '0x1234567890123456789012345678901234567890',
        apy: 520,
        riskLevel: 2,
        minDeposit: '10.000000',
        maxDeposit: '10000.000000',
        active: true
      },
      {
        id: 2,
        name: 'Growth Plus',
        strategy: '0x2345678901234567890123456789012345678901',
        apy: 1180,
        riskLevel: 5,
        minDeposit: '50.000000',
        maxDeposit: '50000.000000',
        active: true
      },
      {
        id: 3,
        name: 'High Yield Pro',
        strategy: '0x3456789012345678901234567890123456789012',
        apy: 2650,
        riskLevel: 8,
        minDeposit: '100.000000',
        maxDeposit: '100000.000000',
        active: true
      }
    ];
  }

  async getOptimalStrategy(userAddress) {
    return {
      strategyId: 2,
      confidence: 85
    };
  }

  async getUserDeposits(userAddress) {
    return [
      {
        amount: '1000.000000',
        strategyId: 2,
        depositTime: Math.floor(Date.now() / 1000) - 86400,
        lastRewardTime: Math.floor(Date.now() / 1000) - 3600,
        accumulatedRewards: '5.234567'
      }
    ];
  }

  async calculateRewards(userAddress, depositIndex) {
    return '2.456789';
  }

  async getTotalValueLocked() {
    return '1234567.890123';
  }

  async getUserRiskTolerance(userAddress) {
    return 5;
  }

  async getActiveMissions() {
    return [
      {
        id: 1,
        name: 'First Deposit',
        description: 'Make your first USDT deposit',
        reward: 100,
        difficulty: 1,
        duration: 86400,
        active: true
      },
      {
        id: 2,
        name: 'Yield Explorer',
        description: 'Try 3 different yield strategies',
        reward: 250,
        difficulty: 2,
        duration: 604800,
        active: true
      }
    ];
  }

  async getUserMissions(userAddress) {
    return [
      {
        missionId: 1,
        progress: 100,
        startTime: Math.floor(Date.now() / 1000) - 3600,
        completed: true,
        claimed: false
      },
      {
        missionId: 2,
        progress: 33,
        startTime: Math.floor(Date.now() / 1000) - 86400,
        completed: false,
        claimed: false
      }
    ];
  }

  async getUserStats(userAddress) {
    return {
      points: 150,
      level: 2,
      streak: 5,
      hasSocialBonus: false
    };
  }

  async getLeaderboard() {
    return [
      {
        user: '0x1111111111111111111111111111111111111111',
        score: 1500,
        timestamp: Math.floor(Date.now() / 1000)
      },
      {
        user: '0x2222222222222222222222222222222222222222',
        score: 1200,
        timestamp: Math.floor(Date.now() / 1000)
      }
    ];
  }

  async getProtocolMetrics() {
    const strategies = await this.getAllStrategies();
    const leaderboard = await this.getLeaderboard();
    const tvl = parseFloat(await this.getTotalValueLocked());

    const activeStrategies = strategies.filter(s => s.active);
    const totalUsers = leaderboard.length;
    const avgApy = activeStrategies.reduce((sum, s) => sum + s.apy, 0) / activeStrategies.length;

    return {
      tvl,
      totalStrategies: activeStrategies.length,
      totalUsers,
      averageApy: Math.round(avgApy),
      topUsers: leaderboard.slice(0, 10)
    };
  }

  async getStrategy(strategyId) {
    const strategies = await this.getAllStrategies();
    return strategies.find(s => s.id === strategyId);
  }

  async getStrategyCurrentAPY(strategyAddress) {
    // Mock APY based on strategy address
    const apyMap = {
      '0x1234567890123456789012345678901234567890': 520,
      '0x2345678901234567890123456789012345678901': 1180,
      '0x3456789012345678901234567890123456789012': 2650
    };
    return apyMap[strategyAddress] || 1000;
  }

  async getTransactionReceipt(txHash) {
    // Mock transaction receipt
    return {
      status: 1,
      blockNumber: 12345678,
      gasUsed: 150000
    };
  }
}

module.exports = BlockchainService;