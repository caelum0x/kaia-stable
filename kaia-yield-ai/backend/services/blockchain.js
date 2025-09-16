const { ethers } = require('ethers');
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console()
  ]
});

class BlockchainService {
  constructor() {
    this.provider = new ethers.JsonRpcProvider(
      process.env.KAIA_RPC_URL || 'https://api.baobab.klaytn.net:8651'
    );
    
    this.yieldOptimizerAddress = process.env.YIELD_OPTIMIZER_ADDRESS;
    this.gameRewardsAddress = process.env.GAME_REWARDS_ADDRESS;
    
    this.yieldOptimizerABI = [
      "function getAllStrategies() view returns (tuple(uint256 id, string name, address strategy, uint256 apy, uint256 riskLevel, uint256 minDeposit, uint256 maxDeposit, bool active)[])",
      "function getOptimalStrategy(address user) view returns (uint256, uint256)",
      "function getUserDeposits(address user) view returns (tuple(uint256 amount, uint256 strategyId, uint256 depositTime, uint256 lastRewardTime, uint256 accumulatedRewards)[])",
      "function calculateRewards(address user, uint256 depositIndex) view returns (uint256)",
      "function totalValueLocked() view returns (uint256)",
      "function userRiskTolerance(address user) view returns (uint256)",
      "function deposit(uint256 amount, uint256 strategyId)",
      "function withdraw(uint256 depositIndex)",
      "function setUserRiskTolerance(uint256 riskLevel)"
    ];
    
    this.gameRewardsABI = [
      "function getActiveMissions() view returns (tuple(uint256 id, string name, string description, uint256 reward, uint256 difficulty, uint256 duration, bool active)[])",
      "function getUserMissions(address user) view returns (tuple(uint256 missionId, uint256 progress, uint256 startTime, bool completed, bool claimed)[])",
      "function getUserStats(address user) view returns (uint256 points, uint256 level, uint256 streak, bool hasSocialBonus)",
      "function getLeaderboard() view returns (tuple(address user, uint256 score, uint256 timestamp)[])",
      "function startMission(uint256 missionId)",
      "function claimMissionReward(uint256 missionId)"
    ];
    
    this.yieldOptimizerContract = new ethers.Contract(
      this.yieldOptimizerAddress,
      this.yieldOptimizerABI,
      this.provider
    );
    
    this.gameRewardsContract = new ethers.Contract(
      this.gameRewardsAddress,
      this.gameRewardsABI,
      this.provider
    );
  }

  async getAllStrategies() {
    try {
      const strategies = await this.yieldOptimizerContract.getAllStrategies();
      return strategies.map(strategy => ({
        id: Number(strategy.id),
        name: strategy.name,
        strategy: strategy.strategy,
        apy: Number(strategy.apy),
        riskLevel: Number(strategy.riskLevel),
        minDeposit: ethers.formatUnits(strategy.minDeposit, 6),
        maxDeposit: ethers.formatUnits(strategy.maxDeposit, 6),
        active: strategy.active
      }));
    } catch (error) {
      logger.error('Error fetching strategies:', error);
      throw error;
    }
  }

  async getOptimalStrategy(userAddress) {
    try {
      const [strategyId, confidence] = await this.yieldOptimizerContract.getOptimalStrategy(userAddress);
      return {
        strategyId: Number(strategyId),
        confidence: Number(confidence)
      };
    } catch (error) {
      logger.error('Error getting optimal strategy:', error);
      throw error;
    }
  }

  async getUserDeposits(userAddress) {
    try {
      const deposits = await this.yieldOptimizerContract.getUserDeposits(userAddress);
      return deposits.map(deposit => ({
        amount: ethers.formatUnits(deposit.amount, 6),
        strategyId: Number(deposit.strategyId),
        depositTime: Number(deposit.depositTime),
        lastRewardTime: Number(deposit.lastRewardTime),
        accumulatedRewards: ethers.formatUnits(deposit.accumulatedRewards, 6)
      }));
    } catch (error) {
      logger.error('Error fetching user deposits:', error);
      throw error;
    }
  }

  async calculateRewards(userAddress, depositIndex) {
    try {
      const rewards = await this.yieldOptimizerContract.calculateRewards(userAddress, depositIndex);
      return ethers.formatUnits(rewards, 6);
    } catch (error) {
      logger.error('Error calculating rewards:', error);
      throw error;
    }
  }

  async getTotalValueLocked() {
    try {
      const tvl = await this.yieldOptimizerContract.totalValueLocked();
      return ethers.formatUnits(tvl, 6);
    } catch (error) {
      logger.error('Error fetching TVL:', error);
      throw error;
    }
  }

  async getUserRiskTolerance(userAddress) {
    try {
      const riskTolerance = await this.yieldOptimizerContract.userRiskTolerance(userAddress);
      return Number(riskTolerance);
    } catch (error) {
      logger.error('Error fetching user risk tolerance:', error);
      throw error;
    }
  }

  async getActiveMissions() {
    try {
      const missions = await this.gameRewardsContract.getActiveMissions();
      return missions.map(mission => ({
        id: Number(mission.id),
        name: mission.name,
        description: mission.description,
        reward: Number(mission.reward),
        difficulty: Number(mission.difficulty),
        duration: Number(mission.duration),
        active: mission.active
      }));
    } catch (error) {
      logger.error('Error fetching active missions:', error);
      throw error;
    }
  }

  async getUserMissions(userAddress) {
    try {
      const missions = await this.gameRewardsContract.getUserMissions(userAddress);
      return missions.map(mission => ({
        missionId: Number(mission.missionId),
        progress: Number(mission.progress),
        startTime: Number(mission.startTime),
        completed: mission.completed,
        claimed: mission.claimed
      }));
    } catch (error) {
      logger.error('Error fetching user missions:', error);
      throw error;
    }
  }

  async getUserStats(userAddress) {
    try {
      const [points, level, streak, hasSocialBonus] = await this.gameRewardsContract.getUserStats(userAddress);
      return {
        points: Number(points),
        level: Number(level),
        streak: Number(streak),
        hasSocialBonus
      };
    } catch (error) {
      logger.error('Error fetching user stats:', error);
      throw error;
    }
  }

  async getLeaderboard() {
    try {
      const leaderboard = await this.gameRewardsContract.getLeaderboard();
      return leaderboard.map(entry => ({
        user: entry.user,
        score: Number(entry.score),
        timestamp: Number(entry.timestamp)
      }));
    } catch (error) {
      logger.error('Error fetching leaderboard:', error);
      throw error;
    }
  }

  async getProtocolMetrics() {
    try {
      const [tvl, strategies, leaderboard] = await Promise.all([
        this.getTotalValueLocked(),
        this.getAllStrategies(),
        this.getLeaderboard()
      ]);

      const activeStrategies = strategies.filter(s => s.active);
      const totalUsers = leaderboard.length;
      const avgApy = activeStrategies.reduce((sum, s) => sum + s.apy, 0) / activeStrategies.length;

      return {
        tvl: parseFloat(tvl),
        totalStrategies: activeStrategies.length,
        totalUsers,
        averageApy: Math.round(avgApy),
        topUsers: leaderboard.slice(0, 10)
      };
    } catch (error) {
      logger.error('Error fetching protocol metrics:', error);
      throw error;
    }
  }

  getContractWithSigner(privateKey) {
    const wallet = new ethers.Wallet(privateKey, this.provider);
    return {
      yieldOptimizer: new ethers.Contract(
        this.yieldOptimizerAddress,
        this.yieldOptimizerABI,
        wallet
      ),
      gameRewards: new ethers.Contract(
        this.gameRewardsAddress,
        this.gameRewardsABI,
        wallet
      )
    };
  }
}

module.exports = BlockchainService;