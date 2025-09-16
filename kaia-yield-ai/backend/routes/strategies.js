const express = require('express');
const router = express.Router();
const BlockchainService = require('../services/blockchain');
const DeFiIntegrationService = require('../services/defi');
const { db, strategyService } = require('../database/connection');
const Joi = require('joi');

const blockchainService = new BlockchainService();
const defiService = new DeFiIntegrationService();

const addressSchema = Joi.object({
  address: Joi.string().pattern(/^0x[a-fA-F0-9]{40}$/).required()
});

router.get('/', async (req, res) => {
  try {
    // Get strategies from database with real-time APY updates
    const strategies = await strategyService.getAllStrategies();

    // Update APYs with real DeFi protocol data
    const realTimeAPYs = await defiService.getRealTimeStrategyAPYs();

    const enrichedStrategies = strategies.map(strategy => {
      const strategyKey = strategy.name.toLowerCase().replace(/\s+/g, '');
      const realAPY = realTimeAPYs[strategyKey]?.apy || strategy.current_apy;

      return {
        ...strategy,
        apy: realAPY,
        current_apy: realAPY,
        apyFormatted: `${(realAPY / 100).toFixed(2)}%`,
        riskLevel: getRiskLevelText(strategy.risk_level),
        category: getStrategyCategory(realAPY, strategy.risk_level),
        source: realTimeAPYs[strategyKey]?.source || 'Contract',
        liquidity: realTimeAPYs[strategyKey]?.liquidity || 'Unknown',
        lastUpdate: new Date().toISOString()
      };
    });

    res.json({
      success: true,
      data: enrichedStrategies,
      count: enrichedStrategies.length,
      marketData: await defiService.getMarketData()
    });
  } catch (error) {
    console.error('Strategies fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch strategies',
      message: error.message
    });
  }
});

router.get('/optimal/:address', async (req, res) => {
  try {
    const { error } = addressSchema.validate({ address: req.params.address });
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Invalid address format'
      });
    }

    const [optimalStrategy, allStrategies, userRiskTolerance] = await Promise.all([
      blockchainService.getOptimalStrategy(req.params.address),
      blockchainService.getAllStrategies(),
      blockchainService.getUserRiskTolerance(req.params.address)
    ]);

    const strategy = allStrategies.find(s => s.id === optimalStrategy.strategyId);
    
    if (!strategy) {
      return res.json({
        success: true,
        data: null,
        message: 'No optimal strategy found'
      });
    }

    res.json({
      success: true,
      data: {
        strategy: {
          ...strategy,
          apyFormatted: `${(strategy.apy / 100).toFixed(2)}%`,
          riskLevel: getRiskLevelText(strategy.riskLevel)
        },
        confidence: optimalStrategy.confidence,
        userRiskTolerance,
        recommendation: generateRecommendationText(strategy, optimalStrategy.confidence)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get optimal strategy',
      message: error.message
    });
  }
});

router.get('/risk-analysis/:address', async (req, res) => {
  try {
    const { error } = addressSchema.validate({ address: req.params.address });
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Invalid address format'
      });
    }

    const [userDeposits, strategies, userRiskTolerance] = await Promise.all([
      blockchainService.getUserDeposits(req.params.address),
      blockchainService.getAllStrategies(),
      blockchainService.getUserRiskTolerance(req.params.address)
    ]);

    const analysis = analyzeUserRiskProfile(userDeposits, strategies, userRiskTolerance);

    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to analyze risk profile',
      message: error.message
    });
  }
});

router.get('/performance', async (req, res) => {
  try {
    const strategies = await blockchainService.getAllStrategies();
    const metrics = await blockchainService.getProtocolMetrics();

    const performanceData = strategies.map(strategy => ({
      id: strategy.id,
      name: strategy.name,
      apy: strategy.apy,
      riskLevel: strategy.riskLevel,
      performance: calculatePerformanceScore(strategy.apy, strategy.riskLevel),
      category: getStrategyCategory(strategy.apy, strategy.riskLevel),
      active: strategy.active
    }));

    performanceData.sort((a, b) => b.performance - a.performance);

    res.json({
      success: true,
      data: {
        strategies: performanceData,
        metrics: {
          averageApy: metrics.averageApy,
          totalStrategies: metrics.totalStrategies,
          bestPerformer: performanceData[0],
          riskDistribution: calculateRiskDistribution(strategies)
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch performance data',
      message: error.message
    });
  }
});

function getRiskLevelText(riskLevel) {
  if (riskLevel <= 3) return 'Low Risk';
  if (riskLevel <= 6) return 'Medium Risk';
  return 'High Risk';
}

function getStrategyCategory(apy, riskLevel) {
  if (apy < 800 && riskLevel <= 3) return 'Conservative';
  if (apy >= 800 && apy < 1500 && riskLevel <= 6) return 'Balanced';
  if (apy >= 1500) return 'Aggressive';
  return 'Custom';
}

function generateRecommendationText(strategy, confidence) {
  const confidenceText = confidence >= 80 ? 'Highly recommended' : 
                        confidence >= 60 ? 'Recommended' : 'Consider with caution';
  
  return `${confidenceText}: ${strategy.name} offers ${(strategy.apy / 100).toFixed(2)}% APY with ${getRiskLevelText(strategy.riskLevel).toLowerCase()}.`;
}

function analyzeUserRiskProfile(deposits, strategies, userRiskTolerance) {
  if (deposits.length === 0) {
    return {
      riskProfile: 'No data',
      riskTolerance: userRiskTolerance || 0,
      recommendations: ['Start with a low-risk strategy to build experience'],
      diversification: 0,
      averageRisk: 0
    };
  }

  const activeDeposits = deposits.filter(d => parseFloat(d.amount) > 0);
  const strategiesUsed = activeDeposits.map(d => strategies.find(s => s.id === d.strategyId));
  const totalAmount = activeDeposits.reduce((sum, d) => sum + parseFloat(d.amount), 0);
  
  const weightedRisk = strategiesUsed.reduce((sum, strategy, index) => {
    const weight = parseFloat(activeDeposits[index].amount) / totalAmount;
    return sum + (strategy?.riskLevel || 0) * weight;
  }, 0);

  const uniqueStrategies = new Set(activeDeposits.map(d => d.strategyId));
  const diversification = Math.min((uniqueStrategies.size / strategies.length) * 100, 100);

  return {
    riskProfile: getRiskLevelText(Math.round(weightedRisk)),
    riskTolerance: userRiskTolerance || 0,
    averageRisk: Math.round(weightedRisk * 100) / 100,
    diversification: Math.round(diversification),
    strategiesUsed: uniqueStrategies.size,
    totalDeposited: totalAmount.toFixed(2),
    recommendations: generateRiskRecommendations(weightedRisk, diversification, userRiskTolerance)
  };
}

function generateRiskRecommendations(avgRisk, diversification, riskTolerance) {
  const recommendations = [];
  
  if (diversification < 30) {
    recommendations.push('Consider diversifying across more strategies to reduce risk');
  }
  
  if (riskTolerance > 0 && avgRisk > riskTolerance) {
    recommendations.push('Your current portfolio exceeds your risk tolerance');
  }
  
  if (avgRisk < 3) {
    recommendations.push('You might benefit from slightly higher-yield strategies');
  } else if (avgRisk > 7) {
    recommendations.push('Consider balancing with some lower-risk strategies');
  }
  
  return recommendations.length > 0 ? recommendations : ['Your portfolio is well-balanced'];
}

function calculatePerformanceScore(apy, riskLevel) {
  return Math.round((apy / riskLevel) * 10) / 10;
}

function calculateRiskDistribution(strategies) {
  const distribution = { low: 0, medium: 0, high: 0 };
  
  strategies.forEach(strategy => {
    if (strategy.riskLevel <= 3) distribution.low++;
    else if (strategy.riskLevel <= 6) distribution.medium++;
    else distribution.high++;
  });
  
  return distribution;
}

module.exports = router;