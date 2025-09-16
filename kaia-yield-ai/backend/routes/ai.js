const express = require('express');
const router = express.Router();
const { spawn } = require('child_process');
const path = require('path');
const BlockchainService = require('../services/blockchain');
const Joi = require('joi');

const blockchainService = new BlockchainService();

const recommendationSchema = Joi.object({
  address: Joi.string().pattern(/^0x[a-fA-F0-9]{40}$/).required(),
  riskTolerance: Joi.number().min(1).max(10).optional(),
  investmentAmount: Joi.number().min(1).optional(),
  preferences: Joi.object({
    maxRisk: Joi.number().min(1).max(10).optional(),
    minApy: Joi.number().min(0).optional(),
    diversification: Joi.boolean().optional()
  }).optional()
});

router.post('/recommendations', async (req, res) => {
  try {
    const { error, value } = recommendationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: error.details
      });
    }

    const { address, riskTolerance, investmentAmount, preferences } = value;

    const [userDeposits, strategies, userStats, userRisk] = await Promise.all([
      blockchainService.getUserDeposits(address),
      blockchainService.getAllStrategies(),
      blockchainService.getUserStats(address).catch(() => ({ level: 1, points: 0 })),
      blockchainService.getUserRiskTolerance(address)
    ]);

    const userData = buildUserProfile(
      userDeposits, 
      userStats, 
      userRisk || riskTolerance || 5,
      investmentAmount || 100
    );

    const recommendations = await getAIRecommendations(userData, strategies);
    
    const enhancedRecommendations = await enhanceWithRealTimeData(recommendations, strategies);

    res.json({
      success: true,
      data: {
        recommendations: enhancedRecommendations,
        userProfile: {
          riskTolerance: userData.risk_tolerance,
          experienceLevel: getUserExperienceLevel(userStats.level),
          portfolioDiversification: userData.portfolio_diversification,
          totalDeposited: userDeposits.reduce((sum, d) => sum + parseFloat(d.amount), 0)
        },
        metadata: {
          timestamp: new Date().toISOString(),
          modelVersion: '1.0.0',
          strategiesAnalyzed: strategies.filter(s => s.active).length
        }
      }
    });

  } catch (error) {
    console.error('AI recommendation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate AI recommendations',
      message: error.message
    });
  }
});

router.post('/analyze-portfolio', async (req, res) => {
  try {
    const { error } = Joi.object({
      address: Joi.string().pattern(/^0x[a-fA-F0-9]{40}$/).required()
    }).validate(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Invalid address format'
      });
    }

    const { address } = req.body;

    const [userDeposits, strategies, userStats] = await Promise.all([
      blockchainService.getUserDeposits(address),
      blockchainService.getAllStrategies(),
      blockchainService.getUserStats(address).catch(() => ({ level: 1, points: 0 }))
    ]);

    const analysis = await analyzePortfolio(userDeposits, strategies);
    const riskAnalysis = calculateRiskMetrics(userDeposits, strategies);
    const performanceAnalysis = await calculatePerformanceMetrics(userDeposits, strategies);

    res.json({
      success: true,
      data: {
        portfolio: analysis,
        risk: riskAnalysis,
        performance: performanceAnalysis,
        recommendations: generatePortfolioRecommendations(analysis, riskAnalysis)
      }
    });

  } catch (error) {
    console.error('Portfolio analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze portfolio',
      message: error.message
    });
  }
});

router.get('/market-insights', async (req, res) => {
  try {
    const strategies = await blockchainService.getAllStrategies();
    const metrics = await blockchainService.getProtocolMetrics();

    const insights = generateMarketInsights(strategies, metrics);

    res.json({
      success: true,
      data: insights
    });

  } catch (error) {
    console.error('Market insights error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate market insights',
      message: error.message
    });
  }
});

router.post('/train-model', async (req, res) => {
  try {
    const pythonProcess = spawn('python', [
      path.join(__dirname, '../ai/recommendation_engine.py'),
      'train'
    ]);

    let output = '';
    let error = '';

    pythonProcess.stdout.on('data', (data) => {
      output += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      error += data.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code === 0) {
        res.json({
          success: true,
          message: 'Model training completed successfully',
          output
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Model training failed',
          details: error
        });
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to start model training',
      message: error.message
    });
  }
});

function buildUserProfile(deposits, stats, riskTolerance, investmentAmount) {
  const activeDeposits = deposits.filter(d => parseFloat(d.amount) > 0);
  const uniqueStrategies = new Set(activeDeposits.map(d => d.strategyId));
  const totalAmount = activeDeposits.reduce((sum, d) => sum + parseFloat(d.amount), 0);
  
  const daysSinceLastDeposit = activeDeposits.length > 0 
    ? Math.floor((Date.now() / 1000 - Math.max(...activeDeposits.map(d => d.depositTime))) / 86400)
    : 30;

  return {
    risk_tolerance: riskTolerance,
    investment_amount: investmentAmount,
    user_level: stats.level || 1,
    days_since_last_deposit: Math.max(1, daysSinceLastDeposit),
    portfolio_diversification: totalAmount > 0 ? uniqueStrategies.size / Math.max(1, activeDeposits.length) : 0,
    market_volatility: 0.25,
    days_since_start: 30
  };
}

async function getAIRecommendations(userData, strategies) {
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn('python', [
      path.join(__dirname, '../ai/recommendation_engine.py')
    ]);

    const input = JSON.stringify({
      user_data: userData,
      strategies: strategies.filter(s => s.active).map(s => ({
        id: s.id,
        name: s.name,
        apy: s.apy,
        risk_level: s.riskLevel,
        min_deposit: parseFloat(s.minDeposit),
        active: s.active
      }))
    });

    pythonProcess.stdin.write(input);
    pythonProcess.stdin.end();

    let output = '';
    let error = '';

    pythonProcess.stdout.on('data', (data) => {
      output += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      error += data.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code === 0) {
        try {
          const result = JSON.parse(output);
          resolve(result);
        } catch (parseError) {
          resolve(getFallbackRecommendations(userData, strategies));
        }
      } else {
        resolve(getFallbackRecommendations(userData, strategies));
      }
    });
  });
}

function getFallbackRecommendations(userData, strategies) {
  const activeStrategies = strategies.filter(s => s.active);
  const userRisk = userData.risk_tolerance;

  return activeStrategies
    .filter(s => s.riskLevel <= userRisk + 2)
    .map(s => ({
      strategy_id: s.id,
      strategy_name: s.name,
      score: calculateFallbackScore(s, userData),
      confidence: 'Medium',
      explanation: `This strategy offers ${(s.apy / 100).toFixed(1)}% APY with ${getRiskText(s.riskLevel)} risk level.`,
      expected_return: (userData.investment_amount * s.apy / 10000).toFixed(2)
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

function calculateFallbackScore(strategy, userData) {
  const riskMatch = Math.max(0, 100 - Math.abs(strategy.riskLevel - userData.risk_tolerance) * 10);
  const apyScore = Math.min(strategy.apy / 30, 100);
  const affordability = userData.investment_amount >= parseFloat(strategy.minDeposit) ? 100 : 50;
  
  return Math.round((riskMatch * 0.4 + apyScore * 0.4 + affordability * 0.2) * 0.8);
}

function getRiskText(riskLevel) {
  if (riskLevel <= 3) return 'low';
  if (riskLevel <= 6) return 'medium';
  return 'high';
}

async function enhanceWithRealTimeData(recommendations, strategies) {
  return recommendations.map(rec => {
    const strategy = strategies.find(s => s.id === rec.strategy_id);
    return {
      ...rec,
      strategy: {
        id: strategy.id,
        name: strategy.name,
        apy: strategy.apy,
        apyFormatted: `${(strategy.apy / 100).toFixed(2)}%`,
        riskLevel: strategy.riskLevel,
        riskText: getRiskText(strategy.riskLevel),
        minDeposit: strategy.minDeposit,
        maxDeposit: strategy.maxDeposit
      },
      marketConditions: {
        volatility: 'Low',
        trend: 'Stable',
        outlook: 'Positive'
      }
    };
  });
}

function getUserExperienceLevel(level) {
  if (level <= 5) return 'Beginner';
  if (level <= 15) return 'Intermediate';
  return 'Advanced';
}

async function analyzePortfolio(deposits, strategies) {
  const activeDeposits = deposits.filter(d => parseFloat(d.amount) > 0);
  const totalValue = activeDeposits.reduce((sum, d) => sum + parseFloat(d.amount), 0);
  
  if (totalValue === 0) {
    return {
      totalValue: 0,
      assetAllocation: [],
      diversificationScore: 0,
      recommendations: ['Start investing to build your portfolio']
    };
  }

  const allocation = activeDeposits.map(deposit => {
    const strategy = strategies.find(s => s.id === deposit.strategyId);
    return {
      strategyId: deposit.strategyId,
      strategyName: strategy?.name || 'Unknown',
      amount: parseFloat(deposit.amount),
      percentage: (parseFloat(deposit.amount) / totalValue) * 100,
      riskLevel: strategy?.riskLevel || 0
    };
  });

  const uniqueStrategies = new Set(activeDeposits.map(d => d.strategyId));
  const diversificationScore = Math.min((uniqueStrategies.size / strategies.length) * 100, 100);

  return {
    totalValue: totalValue.toFixed(2),
    assetAllocation: allocation,
    diversificationScore: Math.round(diversificationScore),
    strategiesCount: uniqueStrategies.size
  };
}

function calculateRiskMetrics(deposits, strategies) {
  const activeDeposits = deposits.filter(d => parseFloat(d.amount) > 0);
  const totalValue = activeDeposits.reduce((sum, d) => sum + parseFloat(d.amount), 0);
  
  if (totalValue === 0) {
    return { overallRisk: 0, riskDistribution: {}, volatility: 0 };
  }

  let weightedRisk = 0;
  const riskDistribution = { low: 0, medium: 0, high: 0 };

  activeDeposits.forEach(deposit => {
    const strategy = strategies.find(s => s.id === deposit.strategyId);
    const weight = parseFloat(deposit.amount) / totalValue;
    const risk = strategy?.riskLevel || 0;
    
    weightedRisk += risk * weight;
    
    if (risk <= 3) riskDistribution.low += weight;
    else if (risk <= 6) riskDistribution.medium += weight;
    else riskDistribution.high += weight;
  });

  return {
    overallRisk: Math.round(weightedRisk * 100) / 100,
    riskDistribution: {
      low: Math.round(riskDistribution.low * 100),
      medium: Math.round(riskDistribution.medium * 100),
      high: Math.round(riskDistribution.high * 100)
    },
    volatility: Math.round(weightedRisk * 10) / 100
  };
}

async function calculatePerformanceMetrics(deposits, strategies) {
  const activeDeposits = deposits.filter(d => parseFloat(d.amount) > 0);
  
  if (activeDeposits.length === 0) {
    return { totalReturns: 0, averageApy: 0, bestPerformer: null };
  }

  let totalReturns = 0;
  let weightedApy = 0;
  let totalValue = 0;
  let bestStrategy = null;
  let bestReturn = 0;

  for (const deposit of activeDeposits) {
    const strategy = strategies.find(s => s.id === deposit.strategyId);
    const amount = parseFloat(deposit.amount);
    const returns = parseFloat(deposit.accumulatedRewards);
    
    totalReturns += returns;
    totalValue += amount;
    weightedApy += (strategy?.apy || 0) * amount;
    
    if (returns > bestReturn) {
      bestReturn = returns;
      bestStrategy = strategy?.name;
    }
  }

  return {
    totalReturns: totalReturns.toFixed(2),
    averageApy: totalValue > 0 ? Math.round(weightedApy / totalValue) : 0,
    bestPerformer: bestStrategy,
    roi: totalValue > 0 ? ((totalReturns / totalValue) * 100).toFixed(2) : '0.00'
  };
}

function generatePortfolioRecommendations(portfolio, risk) {
  const recommendations = [];
  
  if (portfolio.diversificationScore < 30) {
    recommendations.push({
      type: 'diversification',
      message: 'Consider diversifying across more strategies to reduce risk',
      priority: 'high'
    });
  }
  
  if (risk.riskDistribution.high > 70) {
    recommendations.push({
      type: 'risk',
      message: 'Your portfolio has high risk concentration. Consider balancing with lower-risk strategies',
      priority: 'medium'
    });
  }
  
  if (portfolio.strategiesCount < 2 && parseFloat(portfolio.totalValue) > 100) {
    recommendations.push({
      type: 'growth',
      message: 'With your current balance, you could benefit from exploring additional strategies',
      priority: 'low'
    });
  }
  
  return recommendations;
}

function generateMarketInsights(strategies, metrics) {
  const activeStrategies = strategies.filter(s => s.active);
  const apyRange = {
    min: Math.min(...activeStrategies.map(s => s.apy)),
    max: Math.max(...activeStrategies.map(s => s.apy)),
    avg: metrics.averageApy
  };

  return {
    overview: {
      totalStrategies: activeStrategies.length,
      tvl: parseFloat(metrics.tvl),
      averageApy: apyRange.avg,
      activeUsers: metrics.totalUsers
    },
    trends: {
      apyRange: {
        min: (apyRange.min / 100).toFixed(2) + '%',
        max: (apyRange.max / 100).toFixed(2) + '%',
        avg: (apyRange.avg / 100).toFixed(2) + '%'
      },
      riskDistribution: calculateStrategyRiskDistribution(activeStrategies),
      recommendation: generateMarketRecommendation(apyRange, activeStrategies)
    },
    topPerformers: activeStrategies
      .sort((a, b) => (b.apy / b.riskLevel) - (a.apy / a.riskLevel))
      .slice(0, 3)
      .map(s => ({
        name: s.name,
        apy: s.apy,
        riskLevel: s.riskLevel,
        efficiency: Math.round((s.apy / s.riskLevel) * 10) / 10
      }))
  };
}

function calculateStrategyRiskDistribution(strategies) {
  const distribution = { low: 0, medium: 0, high: 0 };
  
  strategies.forEach(strategy => {
    if (strategy.riskLevel <= 3) distribution.low++;
    else if (strategy.riskLevel <= 6) distribution.medium++;
    else distribution.high++;
  });
  
  const total = strategies.length;
  return {
    low: Math.round((distribution.low / total) * 100),
    medium: Math.round((distribution.medium / total) * 100),
    high: Math.round((distribution.high / total) * 100)
  };
}

function generateMarketRecommendation(apyRange, strategies) {
  if (apyRange.avg > 1500) {
    return 'Market conditions favor higher yields. Consider exploring growth strategies.';
  } else if (apyRange.avg < 800) {
    return 'Conservative market conditions. Focus on stable, lower-risk strategies.';
  } else {
    return 'Balanced market conditions. Diversification across risk levels recommended.';
  }
}

module.exports = router;