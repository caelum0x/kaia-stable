const express = require('express');
const router = express.Router();
const BlockchainService = require('../services/blockchain');
const Joi = require('joi');

const blockchainService = new BlockchainService();

const depositSchema = Joi.object({
  amount: Joi.number().min(0.01).required(),
  strategyId: Joi.number().min(1).required(),
  userAddress: Joi.string().pattern(/^0x[a-fA-F0-9]{40}$/).required()
});

const withdrawSchema = Joi.object({
  depositIndex: Joi.number().min(0).required(),
  userAddress: Joi.string().pattern(/^0x[a-fA-F0-9]{40}$/).required()
});

// Get user portfolio summary
router.get('/portfolio/:address', async (req, res) => {
  try {
    const { address } = req.params;

    if (!address.match(/^0x[a-fA-F0-9]{40}$/)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid address format'
      });
    }

    const [deposits, strategies, protocolMetrics] = await Promise.all([
      blockchainService.getUserDeposits(address),
      blockchainService.getAllStrategies(),
      blockchainService.getProtocolMetrics()
    ]);

    const activeDeposits = deposits.filter(d => parseFloat(d.amount) > 0);
    const totalDeposited = activeDeposits.reduce((sum, d) => sum + parseFloat(d.amount), 0);
    const totalRewards = activeDeposits.reduce((sum, d) => sum + parseFloat(d.accumulatedRewards), 0);

    // Calculate current yield for each deposit
    const enrichedDeposits = await Promise.all(
      activeDeposits.map(async (deposit, index) => {
        const strategy = strategies.find(s => s.id === deposit.strategyId);
        const currentRewards = await blockchainService.calculateRewards(address, index).catch(() => '0');

        return {
          ...deposit,
          strategy: strategy ? {
            name: strategy.name,
            apy: strategy.apy,
            riskLevel: strategy.riskLevel
          } : null,
          currentRewards: parseFloat(currentRewards),
          totalValue: parseFloat(deposit.amount) + parseFloat(currentRewards)
        };
      })
    );

    const portfolioValue = enrichedDeposits.reduce((sum, d) => sum + d.totalValue, 0);
    const totalYield = totalRewards + enrichedDeposits.reduce((sum, d) => sum + d.currentRewards, 0);
    const roi = totalDeposited > 0 ? ((totalYield / totalDeposited) * 100) : 0;

    // Calculate portfolio risk
    const weightedRisk = enrichedDeposits.reduce((sum, deposit) => {
      const weight = deposit.totalValue / portfolioValue;
      const risk = deposit.strategy?.riskLevel || 0;
      return sum + (risk * weight);
    }, 0);

    res.json({
      success: true,
      data: {
        portfolio: {
          totalDeposited: totalDeposited.toFixed(2),
          totalRewards: totalRewards.toFixed(2),
          currentYield: totalYield.toFixed(2),
          portfolioValue: portfolioValue.toFixed(2),
          roi: roi.toFixed(2),
          averageRisk: weightedRisk.toFixed(1),
          activePositions: enrichedDeposits.length
        },
        deposits: enrichedDeposits,
        insights: {
          bestPerformer: getBestPerformingDeposit(enrichedDeposits),
          diversificationScore: calculateDiversificationScore(enrichedDeposits, strategies),
          nextRecommendation: await getNextRecommendation(address, enrichedDeposits)
        }
      }
    });

  } catch (error) {
    console.error('Portfolio fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch portfolio',
      message: error.message
    });
  }
});

// Get yield history and analytics
router.get('/analytics/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const { period = '30d' } = req.query;

    if (!address.match(/^0x[a-fA-F0-9]{40}$/)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid address format'
      });
    }

    const [deposits, strategies] = await Promise.all([
      blockchainService.getUserDeposits(address),
      blockchainService.getAllStrategies()
    ]);

    const analytics = generateYieldAnalytics(deposits, strategies, period);

    res.json({
      success: true,
      data: analytics
    });

  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate analytics',
      message: error.message
    });
  }
});

// Simulate deposit before actual transaction
router.post('/simulate-deposit', async (req, res) => {
  try {
    const { error, value } = depositSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: error.details
      });
    }

    const { amount, strategyId, userAddress } = value;

    const [strategy, userDeposits, userRisk] = await Promise.all([
      blockchainService.getAllStrategies().then(strategies =>
        strategies.find(s => s.id === strategyId)
      ),
      blockchainService.getUserDeposits(userAddress),
      blockchainService.getUserRiskTolerance(userAddress)
    ]);

    if (!strategy || !strategy.active) {
      return res.status(404).json({
        success: false,
        error: 'Strategy not found or inactive'
      });
    }

    // Validate deposit constraints
    if (amount < parseFloat(strategy.minDeposit)) {
      return res.status(400).json({
        success: false,
        error: `Minimum deposit is ${strategy.minDeposit} USDT`
      });
    }

    if (amount > parseFloat(strategy.maxDeposit)) {
      return res.status(400).json({
        success: false,
        error: `Maximum deposit is ${strategy.maxDeposit} USDT`
      });
    }

    if (userRisk > 0 && strategy.riskLevel > userRisk) {
      return res.status(400).json({
        success: false,
        error: 'Strategy exceeds your risk tolerance'
      });
    }

    // Calculate projections
    const projections = calculateDepositProjections(amount, strategy, userDeposits);

    res.json({
      success: true,
      data: {
        strategy: {
          id: strategy.id,
          name: strategy.name,
          apy: strategy.apy,
          riskLevel: strategy.riskLevel
        },
        projections,
        riskAssessment: assessDepositRisk(amount, strategy, userDeposits),
        canProceed: true
      }
    });

  } catch (error) {
    console.error('Deposit simulation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to simulate deposit',
      message: error.message
    });
  }
});

// Get yield opportunities based on user profile
router.get('/opportunities/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const { minAmount = 10, maxRisk = 10 } = req.query;

    if (!address.match(/^0x[a-fA-F0-9]{40}$/)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid address format'
      });
    }

    const [strategies, userDeposits, userRisk] = await Promise.all([
      blockchainService.getAllStrategies(),
      blockchainService.getUserDeposits(address),
      blockchainService.getUserRiskTolerance(address)
    ]);

    const effectiveRisk = userRisk || maxRisk;
    const opportunities = strategies
      .filter(strategy =>
        strategy.active &&
        strategy.riskLevel <= effectiveRisk &&
        parseFloat(strategy.minDeposit) <= parseFloat(minAmount)
      )
      .map(strategy => ({
        ...strategy,
        score: calculateOpportunityScore(strategy, userDeposits, effectiveRisk),
        projectedYield: calculateYieldProjection(minAmount, strategy),
        riskAdjustedReturn: (strategy.apy / strategy.riskLevel).toFixed(1)
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    res.json({
      success: true,
      data: {
        opportunities,
        userProfile: {
          riskTolerance: effectiveRisk,
          totalDeposited: userDeposits.reduce((sum, d) => sum + parseFloat(d.amount), 0),
          diversificationLevel: calculateDiversificationScore(userDeposits, strategies)
        },
        recommendations: generateOpportunityRecommendations(opportunities, userDeposits)
      }
    });

  } catch (error) {
    console.error('Opportunities error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch opportunities',
      message: error.message
    });
  }
});

// Helper functions
function getBestPerformingDeposit(deposits) {
  if (deposits.length === 0) return null;

  return deposits.reduce((best, current) => {
    const currentRoi = current.totalValue / parseFloat(current.amount);
    const bestRoi = best.totalValue / parseFloat(best.amount);
    return currentRoi > bestRoi ? current : best;
  });
}

function calculateDiversificationScore(deposits, strategies) {
  const uniqueStrategies = new Set(deposits.map(d => d.strategyId));
  return Math.min((uniqueStrategies.size / strategies.length) * 100, 100);
}

async function getNextRecommendation(address, deposits) {
  if (deposits.length === 0) {
    return "Start with a low-risk strategy to build your portfolio";
  }

  const uniqueStrategies = new Set(deposits.map(d => d.strategyId));
  if (uniqueStrategies.size === 1) {
    return "Consider diversifying with a different risk-level strategy";
  }

  return "Your portfolio is well diversified. Consider increasing allocation to top performers";
}

function generateYieldAnalytics(deposits, strategies, period) {
  const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
  const now = Math.floor(Date.now() / 1000);
  const periodStart = now - (days * 24 * 60 * 60);

  const relevantDeposits = deposits.filter(d => d.depositTime >= periodStart);

  return {
    period: period,
    totalYield: relevantDeposits.reduce((sum, d) => sum + parseFloat(d.accumulatedRewards), 0),
    averageApy: calculateAverageApy(relevantDeposits, strategies),
    yieldHistory: generateYieldHistory(relevantDeposits, days),
    strategyPerformance: generateStrategyPerformance(relevantDeposits, strategies),
    insights: {
      bestPeriod: findBestYieldPeriod(relevantDeposits),
      recommendation: generateYieldRecommendation(relevantDeposits, strategies)
    }
  };
}

function calculateDepositProjections(amount, strategy, existingDeposits) {
  const annual = (amount * strategy.apy) / 10000;
  const monthly = annual / 12;
  const weekly = annual / 52;
  const daily = annual / 365;

  return {
    daily: daily.toFixed(4),
    weekly: weekly.toFixed(2),
    monthly: monthly.toFixed(2),
    annual: annual.toFixed(2),
    roi: {
      '30d': ((monthly / amount) * 100).toFixed(2),
      '90d': ((monthly * 3 / amount) * 100).toFixed(2),
      '1y': ((annual / amount) * 100).toFixed(2)
    }
  };
}

function assessDepositRisk(amount, strategy, existingDeposits) {
  const totalExposure = existingDeposits
    .filter(d => d.strategyId === strategy.id)
    .reduce((sum, d) => sum + parseFloat(d.amount), 0) + amount;

  const totalPortfolio = existingDeposits
    .reduce((sum, d) => sum + parseFloat(d.amount), 0) + amount;

  const concentrationRisk = (totalExposure / totalPortfolio) * 100;

  return {
    strategyRisk: strategy.riskLevel,
    concentrationRisk: concentrationRisk.toFixed(1),
    riskLevel: concentrationRisk > 50 ? 'High' : concentrationRisk > 25 ? 'Medium' : 'Low',
    recommendation: concentrationRisk > 50 ?
      'Consider diversifying to reduce concentration risk' :
      'Acceptable risk level for this deposit'
  };
}

function calculateOpportunityScore(strategy, userDeposits, userRisk) {
  const riskMatch = Math.max(0, 100 - Math.abs(strategy.riskLevel - userRisk) * 10);
  const yieldScore = Math.min(strategy.apy / 30, 100);
  const diversificationBonus = userDeposits.some(d => d.strategyId === strategy.id) ? 0 : 20;

  return Math.round(riskMatch * 0.4 + yieldScore * 0.4 + diversificationBonus * 0.2);
}

function calculateYieldProjection(amount, strategy) {
  const annualYield = (amount * strategy.apy) / 10000;
  return {
    monthly: (annualYield / 12).toFixed(2),
    annual: annualYield.toFixed(2)
  };
}

function generateOpportunityRecommendations(opportunities, deposits) {
  const recommendations = [];

  if (opportunities.length === 0) {
    recommendations.push("No suitable opportunities found for your risk profile");
    return recommendations;
  }

  const topOpportunity = opportunities[0];
  recommendations.push(`Top opportunity: ${topOpportunity.name} with ${(topOpportunity.apy/100).toFixed(1)}% APY`);

  if (deposits.length === 0) {
    recommendations.push("Start with the highest-scored strategy to build your portfolio");
  } else if (deposits.length === 1) {
    recommendations.push("Consider diversifying with a different risk-level strategy");
  }

  return recommendations;
}

function calculateAverageApy(deposits, strategies) {
  if (deposits.length === 0) return 0;

  const totalWeightedApy = deposits.reduce((sum, deposit) => {
    const strategy = strategies.find(s => s.id === deposit.strategyId);
    return sum + (strategy?.apy || 0) * parseFloat(deposit.amount);
  }, 0);

  const totalAmount = deposits.reduce((sum, d) => sum + parseFloat(d.amount), 0);
  return totalAmount > 0 ? Math.round(totalWeightedApy / totalAmount) : 0;
}

function generateYieldHistory(deposits, days) {
  // Simulate daily yield history
  const history = [];
  const now = Date.now();

  for (let i = days; i >= 0; i--) {
    const date = new Date(now - (i * 24 * 60 * 60 * 1000));
    const dailyYield = deposits.reduce((sum, deposit) => {
      const strategy = { apy: 1000 }; // Fallback APY
      return sum + (parseFloat(deposit.amount) * strategy.apy / 10000 / 365);
    }, 0);

    history.push({
      date: date.toISOString().split('T')[0],
      yield: dailyYield.toFixed(4),
      cumulative: (dailyYield * (days - i)).toFixed(2)
    });
  }

  return history;
}

function generateStrategyPerformance(deposits, strategies) {
  const performance = {};

  deposits.forEach(deposit => {
    const strategy = strategies.find(s => s.id === deposit.strategyId);
    if (!strategy) return;

    if (!performance[strategy.name]) {
      performance[strategy.name] = {
        totalDeposited: 0,
        totalRewards: 0,
        count: 0,
        apy: strategy.apy
      };
    }

    performance[strategy.name].totalDeposited += parseFloat(deposit.amount);
    performance[strategy.name].totalRewards += parseFloat(deposit.accumulatedRewards);
    performance[strategy.name].count += 1;
  });

  return Object.entries(performance).map(([name, data]) => ({
    name,
    ...data,
    roi: data.totalDeposited > 0 ? ((data.totalRewards / data.totalDeposited) * 100).toFixed(2) : '0.00'
  }));
}

function findBestYieldPeriod(deposits) {
  // Simple implementation - find deposit with highest accumulated rewards
  const best = deposits.reduce((max, current) => {
    return parseFloat(current.accumulatedRewards) > parseFloat(max.accumulatedRewards) ? current : max;
  }, deposits[0] || { accumulatedRewards: '0' });

  return {
    period: "Recent deposits",
    yield: parseFloat(best.accumulatedRewards).toFixed(2)
  };
}

function generateYieldRecommendation(deposits, strategies) {
  if (deposits.length === 0) return "Start depositing to generate yield";

  const totalYield = deposits.reduce((sum, d) => sum + parseFloat(d.accumulatedRewards), 0);
  if (totalYield < 1) {
    return "Consider higher-yield strategies to increase returns";
  }

  return "Your yield generation is on track. Consider compounding your rewards";
}

module.exports = router;