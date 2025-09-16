const express = require('express');
const router = express.Router();
const BlockchainService = require('../services/blockchain');
const Joi = require('joi');

const blockchainService = new BlockchainService();

const analyticsSchema = Joi.object({
  address: Joi.string().pattern(/^0x[a-fA-F0-9]{40}$/).optional(),
  period: Joi.string().valid('24h', '7d', '30d', '90d', '1y').default('30d'),
  granularity: Joi.string().valid('hour', 'day', 'week', 'month').default('day')
});

// Get protocol-wide analytics
router.get('/protocol', async (req, res) => {
  try {
    const { error, value } = analyticsSchema.validate(req.query);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Invalid query parameters',
        details: error.details
      });
    }

    const { period, granularity } = value;

    const [protocolMetrics, strategies, leaderboard] = await Promise.all([
      blockchainService.getProtocolMetrics(),
      blockchainService.getAllStrategies(),
      blockchainService.getLeaderboard()
    ]);

    // Generate time-series data for the specified period
    const timeSeriesData = generateProtocolTimeSeries(period, granularity);

    // Calculate strategy distribution
    const strategyDistribution = calculateStrategyDistribution(strategies);

    // User engagement metrics
    const userMetrics = calculateUserEngagementMetrics(leaderboard);

    // Risk analysis
    const riskAnalysis = calculateProtocolRiskMetrics(strategies);

    // Performance trends
    const performanceTrends = calculatePerformanceTrends(strategies, period);

    res.json({
      success: true,
      data: {
        overview: {
          ...protocolMetrics,
          period,
          lastUpdated: new Date().toISOString()
        },
        timeSeries: timeSeriesData,
        strategies: {
          distribution: strategyDistribution,
          performance: performanceTrends,
          riskMetrics: riskAnalysis
        },
        users: userMetrics,
        insights: generateProtocolInsights(protocolMetrics, strategies, userMetrics)
      }
    });

  } catch (error) {
    console.error('Protocol analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch protocol analytics',
      message: error.message
    });
  }
});

// Get user-specific analytics
router.get('/user/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const { error, value } = analyticsSchema.validate({ ...req.query, address });
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Invalid parameters',
        details: error.details
      });
    }

    const { period, granularity } = value;

    const [userDeposits, userStats, userMissions, strategies] = await Promise.all([
      blockchainService.getUserDeposits(address),
      blockchainService.getUserStats(address).catch(() => ({ level: 1, points: 0, streak: 0 })),
      blockchainService.getUserMissions(address).catch(() => []),
      blockchainService.getAllStrategies()
    ]);

    // User portfolio analytics
    const portfolioAnalytics = calculatePortfolioAnalytics(userDeposits, strategies, period);

    // Yield performance over time
    const yieldTimeSeries = generateUserYieldTimeSeries(userDeposits, strategies, period, granularity);

    // Risk profile analysis
    const riskProfile = calculateUserRiskProfile(userDeposits, strategies);

    // Performance comparison with protocol
    const benchmarkComparison = calculateBenchmarkComparison(userDeposits, strategies);

    // Activity analytics
    const activityMetrics = calculateUserActivityMetrics(userStats, userMissions, userDeposits);

    // Recommendations based on performance
    const recommendations = generatePersonalizedRecommendations(portfolioAnalytics, riskProfile, strategies);

    res.json({
      success: true,
      data: {
        portfolio: portfolioAnalytics,
        timeSeries: yieldTimeSeries,
        riskProfile,
        benchmark: benchmarkComparison,
        activity: activityMetrics,
        recommendations,
        insights: generateUserInsights(portfolioAnalytics, activityMetrics, riskProfile)
      }
    });

  } catch (error) {
    console.error('User analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user analytics',
      message: error.message
    });
  }
});

// Get strategy performance analytics
router.get('/strategies', async (req, res) => {
  try {
    const { period = '30d', sortBy = 'apy', order = 'desc' } = req.query;

    const strategies = await blockchainService.getAllStrategies();
    const protocolMetrics = await blockchainService.getProtocolMetrics();

    // Calculate detailed metrics for each strategy
    const strategyAnalytics = strategies.map(strategy => {
      const performance = calculateStrategyPerformance(strategy, period);
      const riskMetrics = calculateStrategyRiskMetrics(strategy);
      const efficiency = calculateStrategyEfficiency(strategy);

      return {
        id: strategy.id,
        name: strategy.name,
        apy: strategy.apy,
        riskLevel: strategy.riskLevel,
        minDeposit: strategy.minDeposit,
        maxDeposit: strategy.maxDeposit,
        active: strategy.active,
        performance,
        riskMetrics,
        efficiency,
        marketShare: calculateStrategyMarketShare(strategy, strategies),
        category: getStrategyCategory(strategy.apy, strategy.riskLevel)
      };
    });

    // Sort strategies
    const sortedStrategies = sortStrategiesByMetric(strategyAnalytics, sortBy, order);

    // Calculate correlations and trends
    const correlationMatrix = calculateStrategyCorrelations(strategies);
    const trends = calculateStrategyTrends(strategies, period);

    res.json({
      success: true,
      data: {
        strategies: sortedStrategies,
        summary: {
          totalStrategies: strategies.length,
          activeStrategies: strategies.filter(s => s.active).length,
          averageApy: protocolMetrics.averageApy,
          riskDistribution: calculateRiskDistribution(strategies)
        },
        correlations: correlationMatrix,
        trends,
        insights: generateStrategyInsights(sortedStrategies, trends)
      }
    });

  } catch (error) {
    console.error('Strategy analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch strategy analytics',
      message: error.message
    });
  }
});

// Get comparative analytics between strategies
router.get('/compare', async (req, res) => {
  try {
    const { strategies: strategyIds, metric = 'efficiency' } = req.query;

    if (!strategyIds) {
      return res.status(400).json({
        success: false,
        error: 'Strategy IDs required for comparison'
      });
    }

    const ids = Array.isArray(strategyIds) ? strategyIds : strategyIds.split(',').map(Number);
    const allStrategies = await blockchainService.getAllStrategies();
    const compareStrategies = allStrategies.filter(s => ids.includes(s.id));

    if (compareStrategies.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'At least 2 strategies required for comparison'
      });
    }

    const comparison = {
      strategies: compareStrategies.map(strategy => ({
        id: strategy.id,
        name: strategy.name,
        apy: strategy.apy,
        riskLevel: strategy.riskLevel,
        minDeposit: strategy.minDeposit,
        maxDeposit: strategy.maxDeposit,
        efficiency: (strategy.apy / strategy.riskLevel).toFixed(2),
        riskAdjustedReturn: calculateRiskAdjustedReturn(strategy),
        category: getStrategyCategory(strategy.apy, strategy.riskLevel)
      })),
      metrics: {
        bestApy: Math.max(...compareStrategies.map(s => s.apy)),
        lowestRisk: Math.min(...compareStrategies.map(s => s.riskLevel)),
        bestEfficiency: Math.max(...compareStrategies.map(s => s.apy / s.riskLevel)),
        lowestMinDeposit: Math.min(...compareStrategies.map(s => parseFloat(s.minDeposit)))
      },
      recommendations: generateComparisonRecommendations(compareStrategies, metric)
    };

    res.json({
      success: true,
      data: comparison
    });

  } catch (error) {
    console.error('Comparison analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to compare strategies',
      message: error.message
    });
  }
});

// Get market insights and trends
router.get('/market/insights', async (req, res) => {
  try {
    const { timeframe = '30d' } = req.query;

    const [strategies, protocolMetrics, leaderboard] = await Promise.all([
      blockchainService.getAllStrategies(),
      blockchainService.getProtocolMetrics(),
      blockchainService.getLeaderboard()
    ]);

    const marketInsights = {
      overview: {
        totalValueLocked: protocolMetrics.tvl,
        totalUsers: protocolMetrics.totalUsers,
        averageApy: protocolMetrics.averageApy,
        activeStrategies: strategies.filter(s => s.active).length
      },
      trends: {
        tvlTrend: generateTVLTrend(timeframe),
        apyTrend: generateAPYTrend(strategies, timeframe),
        userGrowth: generateUserGrowthTrend(leaderboard, timeframe),
        popularStrategies: getPopularStrategies(strategies)
      },
      marketConditions: {
        volatility: calculateMarketVolatility(strategies),
        riskSentiment: calculateRiskSentiment(strategies),
        diversificationOpportunities: findDiversificationOpportunities(strategies),
        yieldOpportunities: findYieldOpportunities(strategies)
      },
      predictions: {
        nextWeekOutlook: generateMarketOutlook(strategies, 'week'),
        nextMonthOutlook: generateMarketOutlook(strategies, 'month'),
        riskFactors: identifyRiskFactors(strategies, protocolMetrics)
      }
    };

    res.json({
      success: true,
      data: marketInsights
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

// Helper functions
function generateProtocolTimeSeries(period, granularity) {
  const now = Date.now();
  const periodMs = {
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000,
    '90d': 90 * 24 * 60 * 60 * 1000,
    '1y': 365 * 24 * 60 * 60 * 1000
  }[period];

  const intervalMs = {
    'hour': 60 * 60 * 1000,
    'day': 24 * 60 * 60 * 1000,
    'week': 7 * 24 * 60 * 60 * 1000,
    'month': 30 * 24 * 60 * 60 * 1000
  }[granularity];

  const points = Math.min(100, Math.ceil(periodMs / intervalMs));
  const timeSeries = [];

  for (let i = points; i >= 0; i--) {
    const timestamp = now - (i * intervalMs);
    const date = new Date(timestamp);

    // Simulate realistic data with some growth trend
    const baseTVL = 50000 + (points - i) * 1000;
    const volatility = Math.sin(i * 0.1) * 5000;
    const tvl = baseTVL + volatility + Math.random() * 2000;

    const baseUsers = 100 + (points - i) * 5;
    const users = Math.floor(baseUsers + Math.random() * 20);

    timeSeries.push({
      timestamp: timestamp,
      date: date.toISOString(),
      tvl: Math.max(0, tvl),
      users: users,
      averageApy: 1200 + Math.sin(i * 0.05) * 200 + Math.random() * 100,
      transactions: Math.floor(Math.random() * 50) + 10
    });
  }

  return timeSeries;
}

function calculateStrategyDistribution(strategies) {
  const activeStrategies = strategies.filter(s => s.active);
  const total = activeStrategies.length;

  const riskDistribution = { low: 0, medium: 0, high: 0 };
  const apyRanges = { low: 0, medium: 0, high: 0 };

  activeStrategies.forEach(strategy => {
    // Risk distribution
    if (strategy.riskLevel <= 3) riskDistribution.low++;
    else if (strategy.riskLevel <= 6) riskDistribution.medium++;
    else riskDistribution.high++;

    // APY distribution
    if (strategy.apy < 800) apyRanges.low++;
    else if (strategy.apy < 1500) apyRanges.medium++;
    else apyRanges.high++;
  });

  return {
    risk: {
      low: Math.round((riskDistribution.low / total) * 100),
      medium: Math.round((riskDistribution.medium / total) * 100),
      high: Math.round((riskDistribution.high / total) * 100)
    },
    apy: {
      low: Math.round((apyRanges.low / total) * 100),
      medium: Math.round((apyRanges.medium / total) * 100),
      high: Math.round((apyRanges.high / total) * 100)
    }
  };
}

function calculateUserEngagementMetrics(leaderboard) {
  const totalUsers = leaderboard.length;
  const activeUsers = leaderboard.filter(user => {
    const lastActivity = new Date(user.timestamp * 1000);
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return lastActivity > weekAgo;
  }).length;

  const avgScore = totalUsers > 0 ?
    leaderboard.reduce((sum, user) => sum + user.score, 0) / totalUsers : 0;

  return {
    totalUsers,
    activeUsers,
    activeUserRate: totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0,
    averageScore: Math.round(avgScore),
    topScore: leaderboard[0]?.score || 0,
    engagementTrend: 'increasing' // Simulated
  };
}

function calculateProtocolRiskMetrics(strategies) {
  const activeStrategies = strategies.filter(s => s.active);
  const totalRisk = activeStrategies.reduce((sum, s) => sum + s.riskLevel, 0);
  const avgRisk = totalRisk / activeStrategies.length;

  const riskWeightedAPY = activeStrategies.reduce((sum, s) => {
    return sum + (s.apy * s.riskLevel);
  }, 0) / activeStrategies.reduce((sum, s) => sum + s.riskLevel, 0);

  return {
    averageRisk: avgRisk.toFixed(2),
    riskWeightedAPY: Math.round(riskWeightedAPY),
    riskDiversification: calculateRiskDiversification(activeStrategies),
    concentrationRisk: calculateConcentrationRisk(activeStrategies)
  };
}

function calculatePerformanceTrends(strategies, period) {
  // Simulate performance trends based on strategy characteristics
  return strategies.map(strategy => ({
    id: strategy.id,
    name: strategy.name,
    trend: Math.random() > 0.5 ? 'up' : 'down',
    performance: strategy.apy + (Math.random() - 0.5) * 200,
    volatility: strategy.riskLevel * 0.1 + Math.random() * 0.05
  }));
}

function calculatePortfolioAnalytics(deposits, strategies, period) {
  const activeDeposits = deposits.filter(d => parseFloat(d.amount) > 0);
  const totalValue = activeDeposits.reduce((sum, d) => sum + parseFloat(d.amount), 0);
  const totalRewards = activeDeposits.reduce((sum, d) => sum + parseFloat(d.accumulatedRewards), 0);

  const strategyBreakdown = activeDeposits.map(deposit => {
    const strategy = strategies.find(s => s.id === deposit.strategyId);
    return {
      strategyId: deposit.strategyId,
      strategyName: strategy?.name || 'Unknown',
      amount: parseFloat(deposit.amount),
      percentage: totalValue > 0 ? (parseFloat(deposit.amount) / totalValue) * 100 : 0,
      rewards: parseFloat(deposit.accumulatedRewards),
      apy: strategy?.apy || 0,
      riskLevel: strategy?.riskLevel || 0
    };
  });

  const weightedAPY = strategyBreakdown.reduce((sum, item) => {
    return sum + (item.apy * item.percentage / 100);
  }, 0);

  const weightedRisk = strategyBreakdown.reduce((sum, item) => {
    return sum + (item.riskLevel * item.percentage / 100);
  }, 0);

  return {
    totalValue: totalValue.toFixed(2),
    totalRewards: totalRewards.toFixed(2),
    roi: totalValue > 0 ? ((totalRewards / totalValue) * 100).toFixed(2) : '0.00',
    weightedAPY: Math.round(weightedAPY),
    weightedRisk: weightedRisk.toFixed(1),
    diversificationScore: calculateDiversificationScore(activeDeposits, strategies),
    strategyBreakdown,
    performance: {
      bestStrategy: getBestPerformingStrategy(strategyBreakdown),
      worstStrategy: getWorstPerformingStrategy(strategyBreakdown)
    }
  };
}

function generateUserYieldTimeSeries(deposits, strategies, period, granularity) {
  // Simulate user yield over time
  const now = Date.now();
  const periodMs = {
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000,
    '90d': 90 * 24 * 60 * 60 * 1000
  }[period] || 30 * 24 * 60 * 60 * 1000;

  const intervalMs = {
    'hour': 60 * 60 * 1000,
    'day': 24 * 60 * 60 * 1000,
    'week': 7 * 24 * 60 * 60 * 1000
  }[granularity] || 24 * 60 * 60 * 1000;

  const points = Math.min(50, Math.ceil(periodMs / intervalMs));
  const timeSeries = [];

  const totalDeposited = deposits.reduce((sum, d) => sum + parseFloat(d.amount), 0);

  for (let i = points; i >= 0; i--) {
    const timestamp = now - (i * intervalMs);
    const date = new Date(timestamp);

    // Simulate cumulative yield growth
    const dailyYield = totalDeposited * 0.0003; // ~0.03% daily
    const cumulativeYield = dailyYield * (points - i);
    const volatility = Math.sin(i * 0.1) * dailyYield * 0.1;

    timeSeries.push({
      timestamp,
      date: date.toISOString(),
      cumulativeYield: Math.max(0, cumulativeYield + volatility),
      dailyYield: dailyYield + volatility * 0.1,
      portfolioValue: totalDeposited + cumulativeYield + volatility
    });
  }

  return timeSeries;
}

function calculateUserRiskProfile(deposits, strategies) {
  const activeDeposits = deposits.filter(d => parseFloat(d.amount) > 0);
  const totalValue = activeDeposits.reduce((sum, d) => sum + parseFloat(d.amount), 0);

  if (totalValue === 0) {
    return {
      overallRisk: 0,
      riskTolerance: 'Unknown',
      diversification: 0,
      recommendation: 'Start investing to establish risk profile'
    };
  }

  const weightedRisk = activeDeposits.reduce((sum, deposit) => {
    const strategy = strategies.find(s => s.id === deposit.strategyId);
    const weight = parseFloat(deposit.amount) / totalValue;
    return sum + ((strategy?.riskLevel || 0) * weight);
  }, 0);

  const uniqueStrategies = new Set(activeDeposits.map(d => d.strategyId));
  const diversification = (uniqueStrategies.size / strategies.length) * 100;

  let riskTolerance = 'Conservative';
  if (weightedRisk > 6) riskTolerance = 'Aggressive';
  else if (weightedRisk > 3) riskTolerance = 'Moderate';

  return {
    overallRisk: weightedRisk.toFixed(1),
    riskTolerance,
    diversification: Math.round(diversification),
    riskDistribution: calculateUserRiskDistribution(activeDeposits, strategies),
    recommendation: generateRiskRecommendation(weightedRisk, diversification)
  };
}

function generateProtocolInsights(metrics, strategies, userMetrics) {
  const insights = [];

  if (metrics.averageApy > 1500) {
    insights.push({
      type: 'positive',
      title: 'High Yield Environment',
      description: 'Current market conditions favor high-yield strategies'
    });
  }

  if (userMetrics.activeUserRate > 70) {
    insights.push({
      type: 'positive',
      title: 'Strong User Engagement',
      description: `${userMetrics.activeUserRate}% of users are actively participating`
    });
  }

  const highRiskStrategies = strategies.filter(s => s.active && s.riskLevel > 7).length;
  if (highRiskStrategies > strategies.length * 0.3) {
    insights.push({
      type: 'warning',
      title: 'High Risk Concentration',
      description: 'Consider balancing with more conservative strategies'
    });
  }

  return insights;
}

function generateUserInsights(portfolio, activity, riskProfile) {
  const insights = [];

  if (parseFloat(portfolio.roi) > 10) {
    insights.push({
      type: 'positive',
      title: 'Strong Performance',
      description: `Your portfolio is outperforming with ${portfolio.roi}% ROI`
    });
  }

  if (portfolio.diversificationScore < 30) {
    insights.push({
      type: 'warning',
      title: 'Low Diversification',
      description: 'Consider spreading investments across more strategies'
    });
  }

  if (activity.level > 10) {
    insights.push({
      type: 'positive',
      title: 'Experienced Trader',
      description: 'Your high level unlocks advanced strategies'
    });
  }

  return insights;
}

function generatePersonalizedRecommendations(portfolio, riskProfile, strategies) {
  const recommendations = [];

  const currentRisk = parseFloat(riskProfile.overallRisk);
  const diversification = riskProfile.diversification;

  if (diversification < 30) {
    const availableStrategies = strategies.filter(s =>
      s.active && !portfolio.strategyBreakdown.some(b => b.strategyId === s.id)
    );

    if (availableStrategies.length > 0) {
      const suggested = availableStrategies
        .filter(s => Math.abs(s.riskLevel - currentRisk) <= 2)
        .sort((a, b) => (b.apy / b.riskLevel) - (a.apy / a.riskLevel))[0];

      if (suggested) {
        recommendations.push({
          type: 'diversification',
          title: 'Improve Diversification',
          description: `Consider adding ${suggested.name} to balance your portfolio`,
          strategy: suggested
        });
      }
    }
  }

  if (parseFloat(portfolio.roi) < 5) {
    recommendations.push({
      type: 'performance',
      title: 'Boost Returns',
      description: 'Consider strategies with higher yield potential',
      action: 'explore_high_yield'
    });
  }

  return recommendations;
}

// Additional helper functions
function calculateDiversificationScore(deposits, strategies) {
  const uniqueStrategies = new Set(deposits.map(d => d.strategyId));
  return Math.min((uniqueStrategies.size / strategies.length) * 100, 100);
}

function getBestPerformingStrategy(breakdown) {
  return breakdown.reduce((best, current) => {
    const currentROI = current.rewards / current.amount;
    const bestROI = best.rewards / best.amount;
    return currentROI > bestROI ? current : best;
  }, breakdown[0]);
}

function getWorstPerformingStrategy(breakdown) {
  return breakdown.reduce((worst, current) => {
    const currentROI = current.rewards / current.amount;
    const worstROI = worst.rewards / worst.amount;
    return currentROI < worstROI ? current : worst;
  }, breakdown[0]);
}

function getStrategyCategory(apy, riskLevel) {
  if (apy < 800 && riskLevel <= 3) return 'Conservative';
  if (apy >= 800 && apy < 1500 && riskLevel <= 6) return 'Balanced';
  if (apy >= 1500) return 'Aggressive';
  return 'Custom';
}

// Placeholder implementations for complex calculations
function calculateRiskDiversification(strategies) { return 75; }
function calculateConcentrationRisk(strategies) { return 25; }
function calculateStrategyPerformance(strategy, period) { return { trend: 'up', volatility: 0.15 }; }
function calculateStrategyRiskMetrics(strategy) { return { sharpe: 1.2, maxDrawdown: 0.1 }; }
function calculateStrategyEfficiency(strategy) { return (strategy.apy / strategy.riskLevel).toFixed(2); }
function calculateStrategyMarketShare(strategy, allStrategies) { return 15; }
function sortStrategiesByMetric(strategies, sortBy, order) { return strategies; }
function calculateStrategyCorrelations(strategies) { return {}; }
function calculateStrategyTrends(strategies, period) { return {}; }
function generateStrategyInsights(strategies, trends) { return []; }
function calculateRiskAdjustedReturn(strategy) { return (strategy.apy / strategy.riskLevel * 100).toFixed(2); }
function generateComparisonRecommendations(strategies, metric) { return []; }
function generateTVLTrend(timeframe) { return []; }
function generateAPYTrend(strategies, timeframe) { return []; }
function generateUserGrowthTrend(leaderboard, timeframe) { return []; }
function getPopularStrategies(strategies) { return strategies.slice(0, 3); }
function calculateMarketVolatility(strategies) { return 'Low'; }
function calculateRiskSentiment(strategies) { return 'Balanced'; }
function findDiversificationOpportunities(strategies) { return []; }
function findYieldOpportunities(strategies) { return []; }
function generateMarketOutlook(strategies, period) { return 'Positive'; }
function identifyRiskFactors(strategies, metrics) { return []; }
function calculateRiskDistribution(strategies) { return { low: 3, medium: 4, high: 2 }; }
function calculateUserActivityMetrics(stats, missions, deposits) { return stats; }
function calculateBenchmarkComparison(deposits, strategies) { return { vs_protocol: '+2.5%' }; }
function calculateUserRiskDistribution(deposits, strategies) { return { low: 40, medium: 40, high: 20 }; }
function generateRiskRecommendation(risk, diversification) { return 'Portfolio is well balanced'; }

module.exports = router;