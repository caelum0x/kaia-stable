const express = require('express');
const router = express.Router();
const BlockchainService = require('../services/blockchain');
const DeFiIntegrationService = require('../services/defi');
const { db } = require('../database/connection');
const Joi = require('joi');

const blockchainService = new BlockchainService();
const defiService = new DeFiIntegrationService();

// Validation schemas
const addressSchema = Joi.object({
  address: Joi.string().pattern(/^0x[a-fA-F0-9]{40}$/).required()
});

const calculateSchema = Joi.object({
  amount: Joi.number().positive().required(),
  strategyId: Joi.number().integer().positive().required(),
  duration: Joi.number().integer().positive().default(30)
});

const depositSchema = Joi.object({
  userAddress: Joi.string().pattern(/^0x[a-fA-F0-9]{40}$/).required(),
  strategyId: Joi.number().integer().positive().required(),
  amount: Joi.string().required(), // USDT amount in wei string
  transactionHash: Joi.string().pattern(/^0x[a-fA-F0-9]{64}$/).required()
});

// Get user portfolio with real blockchain data
router.get('/portfolio/:address', async (req, res) => {
  try {
    const { error } = addressSchema.validate({ address: req.params.address });
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Invalid wallet address format'
      });
    }

    const userAddress = req.params.address;

    // Get user deposits from blockchain
    const [userDeposits, userStats, strategies] = await Promise.all([
      blockchainService.getUserDeposits(userAddress),
      blockchainService.getUserStats(userAddress),
      blockchainService.getAllStrategies()
    ]);

    // Calculate portfolio summary
    let totalDeposited = 0;
    let totalRewards = 0;
    const activePositions = userDeposits.length;

    const positions = await Promise.all(userDeposits.map(async (deposit) => {
      const strategy = strategies.find(s => s.id === deposit.strategyId);
      const currentRewards = await blockchainService.calculateRewards(userAddress, deposit.strategyId);

      const depositAmount = parseFloat(deposit.amount);
      const rewardAmount = parseFloat(currentRewards);

      totalDeposited += depositAmount;
      totalRewards += rewardAmount;

      return {
        id: `${userAddress}-${deposit.strategyId}`,
        strategyId: deposit.strategyId,
        strategyName: strategy?.name || 'Unknown Strategy',
        amount: deposit.amount,
        amountFormatted: `${depositAmount.toFixed(2)} USDT`,
        rewards: currentRewards,
        rewardsFormatted: `${rewardAmount.toFixed(6)} USDT`,
        apy: strategy?.apy || 0,
        apyFormatted: `${((strategy?.apy || 0) / 100).toFixed(2)}%`,
        depositTime: deposit.depositTime,
        lastRewardTime: deposit.lastRewardTime,
        daysActive: Math.floor((Date.now() / 1000 - deposit.depositTime) / 86400),
        performanceScore: rewardAmount > 0 ? ((rewardAmount / depositAmount) * 365 * 100).toFixed(2) : '0.00'
      };
    }));

    // Get user analytics from database
    const dbUser = await db.query(
      'SELECT * FROM users WHERE address = $1',
      [userAddress]
    );

    const portfolio = {
      summary: {
        totalDeposited: totalDeposited.toFixed(2),
        totalRewards: totalRewards.toFixed(6),
        activePositions,
        totalValue: (totalDeposited + totalRewards).toFixed(2),
        averageAPY: positions.length > 0
          ? (positions.reduce((sum, p) => sum + p.apy, 0) / positions.length / 100).toFixed(2)
          : '0.00',
        portfolioGrowth: totalDeposited > 0
          ? ((totalRewards / totalDeposited) * 100).toFixed(2)
          : '0.00'
      },
      positions,
      userStats: {
        level: userStats.level || 1,
        points: userStats.points || 0,
        streak: userStats.streak || 0,
        riskTolerance: dbUser.rows[0]?.risk_tolerance || 5
      },
      lastUpdated: new Date().toISOString()
    };

    res.json({
      success: true,
      data: portfolio
    });

  } catch (error) {
    console.error('Portfolio fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch portfolio data',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Calculate projected yields for a strategy
router.post('/calculate', async (req, res) => {
  try {
    const { error, value } = calculateSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    const { amount, strategyId, duration } = value;

    // Get strategy details
    const strategy = await blockchainService.getStrategy(strategyId);
    if (!strategy) {
      return res.status(404).json({
        success: false,
        error: 'Strategy not found'
      });
    }

    // Get real-time APY
    const currentAPY = await blockchainService.getStrategyCurrentAPY(strategy.strategy);

    // Calculate projections
    const dailyRate = currentAPY / 100 / 365;
    const projectedRewards = amount * dailyRate * duration;
    const compoundedRewards = amount * (Math.pow(1 + dailyRate, duration) - 1);

    // Risk assessment
    const riskMetrics = await defiService.assessRiskMetrics(strategy.name.toLowerCase());

    // Get market conditions
    const marketData = await defiService.getMarketData();

    const calculation = {
      strategy: {
        id: strategyId,
        name: strategy.name,
        currentAPY: currentAPY / 100,
        riskLevel: strategy.riskLevel,
        protocol: strategy.name.includes('Stable') ? 'Compound' :
                 strategy.name.includes('Growth') ? 'Uniswap' : 'Curve'
      },
      inputs: {
        amount,
        duration,
        currency: 'USDT'
      },
      projections: {
        simpleRewards: projectedRewards.toFixed(6),
        compoundedRewards: compoundedRewards.toFixed(6),
        dailyEarnings: (projectedRewards / duration).toFixed(6),
        totalValue: (amount + compoundedRewards).toFixed(2),
        effectiveAPY: duration >= 365 ? currentAPY / 100 :
                     ((compoundedRewards / amount) * (365 / duration)).toFixed(4)
      },
      riskAnalysis: {
        volatility: riskMetrics.volatility,
        maxDrawdown: riskMetrics.maxDrawdown,
        sharpeRatio: riskMetrics.sharpeRatio || 1.2,
        riskScore: strategy.riskLevel,
        riskCategory: strategy.riskLevel <= 3 ? 'Conservative' :
                     strategy.riskLevel <= 6 ? 'Moderate' : 'Aggressive'
      },
      marketConditions: {
        volatilityIndex: marketData.volatilityIndex,
        recommendation: marketData.volatilityIndex < 20 ? 'Favorable' :
                       marketData.volatilityIndex < 40 ? 'Caution' : 'High Risk',
        lastUpdate: new Date().toISOString()
      }
    };

    res.json({
      success: true,
      data: calculation
    });

  } catch (error) {
    console.error('Yield calculation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate yield projections',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Record a deposit transaction
router.post('/deposit', async (req, res) => {
  try {
    const { error, value } = depositSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    const { userAddress, strategyId, amount, transactionHash } = value;

    // Verify transaction on blockchain
    const txReceipt = await blockchainService.getTransactionReceipt(transactionHash);
    if (!txReceipt || txReceipt.status !== 1) {
      return res.status(400).json({
        success: false,
        error: 'Transaction not found or failed'
      });
    }

    // Record in database
    const deposit = await db.query(`
      INSERT INTO user_deposits (user_id, strategy_id, amount, transaction_hash, block_number, deposit_time)
      VALUES (
        (SELECT id FROM users WHERE address = $1),
        $2, $3, $4, $5, NOW()
      )
      RETURNING *
    `, [userAddress, strategyId, amount, transactionHash, txReceipt.blockNumber]);

    // Update user stats
    await db.query(`
      UPDATE user_stats
      SET total_deposited = total_deposited + $1,
          last_activity = NOW()
      WHERE user_id = (SELECT id FROM users WHERE address = $2)
    `, [amount, userAddress]);

    res.json({
      success: true,
      data: {
        depositId: deposit.rows[0].id,
        message: 'Deposit recorded successfully',
        transactionHash,
        blockNumber: txReceipt.blockNumber
      }
    });

  } catch (error) {
    console.error('Deposit recording error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to record deposit',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get yield history for a user
router.get('/history/:address', async (req, res) => {
  try {
    const { error } = addressSchema.validate({ address: req.params.address });
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Invalid wallet address format'
      });
    }

    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const history = await db.query(`
      SELECT
        dh.*,
        s.name as strategy_name,
        s.current_apy
      FROM deposit_history dh
      JOIN yield_strategies s ON dh.strategy_id = s.id
      WHERE dh.user_id = (SELECT id FROM users WHERE address = $1)
      ORDER BY dh.timestamp DESC
      LIMIT $2 OFFSET $3
    `, [req.params.address, limit, offset]);

    const total = await db.query(`
      SELECT COUNT(*) FROM deposit_history
      WHERE user_id = (SELECT id FROM users WHERE address = $1)
    `, [req.params.address]);

    res.json({
      success: true,
      data: {
        history: history.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: parseInt(total.rows[0].count),
          pages: Math.ceil(total.rows[0].count / limit)
        }
      }
    });

  } catch (error) {
    console.error('History fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch yield history',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get optimal strategy recommendation for user
router.get('/recommend/:address', async (req, res) => {
  try {
    const { error } = addressSchema.validate({ address: req.params.address });
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Invalid wallet address format'
      });
    }

    const userAddress = req.params.address;

    // Get AI recommendation from blockchain
    const recommendation = await blockchainService.getOptimalStrategy(userAddress);
    const strategy = await blockchainService.getStrategy(recommendation.strategyId);

    // Get user risk tolerance
    const userRisk = await blockchainService.getUserRiskTolerance(userAddress);

    // Get market conditions
    const marketData = await defiService.getMarketData();

    const aiRecommendation = {
      recommendedStrategy: {
        id: recommendation.strategyId,
        name: strategy?.name || 'Unknown',
        apy: strategy?.apy || 0,
        riskLevel: strategy?.riskLevel || 5,
        confidence: recommendation.confidence
      },
      reasoning: [
        `Based on your risk tolerance (${userRisk}/10)`,
        `Current market volatility: ${marketData.volatilityIndex}%`,
        `Strategy performance: ${((strategy?.apy || 0) / 100).toFixed(2)}% APY`,
        'AI confidence: ' + recommendation.confidence + '%'
      ],
      alternatives: await blockchainService.getAllStrategies(),
      marketInsights: {
        condition: marketData.volatilityIndex < 25 ? 'Stable' : 'Volatile',
        recommendation: marketData.volatilityIndex < 25 ?
          'Good time for higher yield strategies' :
          'Consider conservative approaches',
        trends: {
          usdtPrice: marketData.usdtPrice,
          kaiaPrice: marketData.kaiaPrice,
          defiTVL: `$${(marketData.defiTVL / 1e9).toFixed(1)}B`
        }
      },
      lastUpdated: new Date().toISOString()
    };

    res.json({
      success: true,
      data: aiRecommendation
    });

  } catch (error) {
    console.error('Recommendation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate recommendation',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;