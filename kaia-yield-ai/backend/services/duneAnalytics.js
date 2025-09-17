const axios = require('axios');
require('dotenv').config();

class DuneAnalyticsService {
  constructor() {
    this.apiKey = process.env.DUNE_API_KEY;
    this.baseUrl = 'https://api.dune.com/api/v1';
    this.headers = {
      'X-Dune-API-Key': this.apiKey,
      'Content-Type': 'application/json'
    };
    
    // Query IDs for our dashboard queries (will be created after uploading queries)
    this.queryIds = {
      protocolOverview: process.env.DUNE_PROTOCOL_OVERVIEW_QUERY_ID,
      strategyPerformance: process.env.DUNE_STRATEGY_PERFORMANCE_QUERY_ID,
      userEngagement: process.env.DUNE_USER_ENGAGEMENT_QUERY_ID,
      aiRecommendations: process.env.DUNE_AI_RECOMMENDATIONS_QUERY_ID,
      gamificationMetrics: process.env.DUNE_GAMIFICATION_METRICS_QUERY_ID,
      socialMetrics: process.env.DUNE_SOCIAL_METRICS_QUERY_ID
    };
    
    // Cache for query results
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  async createQuery(name, sqlQuery, description = '') {
    try {
      const response = await axios.post(`${this.baseUrl}/query`, {
        query_sql: sqlQuery,
        name: name,
        description: description,
        is_private: false
      }, { headers: this.headers });

      console.log(`✅ Created Dune query: ${name} (ID: ${response.data.query_id})`);
      return response.data.query_id;
    } catch (error) {
      console.error(`Error creating Dune query ${name}:`, error.response?.data || error.message);
      throw error;
    }
  }

  async executeQuery(queryId, parameters = {}) {
    try {
      // Start query execution
      const executeResponse = await axios.post(
        `${this.baseUrl}/query/${queryId}/execute`,
        { query_parameters: parameters },
        { headers: this.headers }
      );

      const executionId = executeResponse.data.execution_id;
      console.log(`🚀 Started query execution: ${executionId}`);

      // Poll for results
      return await this.waitForQueryCompletion(executionId);
    } catch (error) {
      console.error(`Error executing query ${queryId}:`, error.response?.data || error.message);
      throw error;
    }
  }

  async waitForQueryCompletion(executionId, maxWaitTime = 300000) { // 5 minutes max
    const startTime = Date.now();
    const pollInterval = 2000; // 2 seconds

    while (Date.now() - startTime < maxWaitTime) {
      try {
        const statusResponse = await axios.get(
          `${this.baseUrl}/execution/${executionId}/status`,
          { headers: this.headers }
        );

        const status = statusResponse.data.state;
        console.log(`Query execution status: ${status}`);

        if (status === 'QUERY_STATE_COMPLETED') {
          // Get results
          const resultsResponse = await axios.get(
            `${this.baseUrl}/execution/${executionId}/results`,
            { headers: this.headers }
          );
          return resultsResponse.data;
        } else if (status === 'QUERY_STATE_FAILED') {
          throw new Error('Query execution failed');
        }

        // Wait before next poll
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      } catch (error) {
        console.error('Error polling query status:', error.response?.data || error.message);
        throw error;
      }
    }

    throw new Error('Query execution timeout');
  }

  async getCachedQueryResult(queryId, parameters = {}, forceRefresh = false) {
    const cacheKey = `${queryId}_${JSON.stringify(parameters)}`;
    const cached = this.cache.get(cacheKey);

    if (!forceRefresh && cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      const result = await this.executeQuery(queryId, parameters);
      this.cache.set(cacheKey, { data: result, timestamp: Date.now() });
      return result;
    } catch (error) {
      // Return cached data if available, even if stale
      if (cached) {
        console.warn('Using stale cached data due to query error');
        return cached.data;
      }
      throw error;
    }
  }

  async getProtocolOverview(contractAddress) {
    if (!this.queryIds.protocolOverview) {
      console.warn('Protocol overview query ID not configured');
      return this.getMockProtocolOverview();
    }

    try {
      const result = await this.getCachedQueryResult(this.queryIds.protocolOverview, {
        contract_address: contractAddress
      });

      return this.formatProtocolOverview(result);
    } catch (error) {
      console.error('Error fetching protocol overview:', error);
      return this.getMockProtocolOverview();
    }
  }

  async getStrategyPerformance(contractAddress) {
    if (!this.queryIds.strategyPerformance) {
      console.warn('Strategy performance query ID not configured');
      return this.getMockStrategyPerformance();
    }

    try {
      const result = await this.getCachedQueryResult(this.queryIds.strategyPerformance, {
        contract_address: contractAddress
      });

      return this.formatStrategyPerformance(result);
    } catch (error) {
      console.error('Error fetching strategy performance:', error);
      return this.getMockStrategyPerformance();
    }
  }

  async getUserEngagementMetrics(contractAddress) {
    if (!this.queryIds.userEngagement) {
      console.warn('User engagement query ID not configured');
      return this.getMockUserEngagement();
    }

    try {
      const result = await this.getCachedQueryResult(this.queryIds.userEngagement, {
        contract_address: contractAddress
      });

      return this.formatUserEngagement(result);
    } catch (error) {
      console.error('Error fetching user engagement:', error);
      return this.getMockUserEngagement();
    }
  }

  async getAIRecommendationMetrics(contractAddress) {
    if (!this.queryIds.aiRecommendations) {
      console.warn('AI recommendations query ID not configured');
      return this.getMockAIMetrics();
    }

    try {
      const result = await this.getCachedQueryResult(this.queryIds.aiRecommendations, {
        contract_address: contractAddress
      });

      return this.formatAIMetrics(result);
    } catch (error) {
      console.error('Error fetching AI metrics:', error);
      return this.getMockAIMetrics();
    }
  }

  async getGamificationMetrics(gameRewardsAddress) {
    if (!this.queryIds.gamificationMetrics) {
      console.warn('Gamification metrics query ID not configured');
      return this.getMockGamificationMetrics();
    }

    try {
      const result = await this.getCachedQueryResult(this.queryIds.gamificationMetrics, {
        game_rewards_address: gameRewardsAddress
      });

      return this.formatGamificationMetrics(result);
    } catch (error) {
      console.error('Error fetching gamification metrics:', error);
      return this.getMockGamificationMetrics();
    }
  }

  async getSocialMetrics(contractAddress) {
    if (!this.queryIds.socialMetrics) {
      console.warn('Social metrics query ID not configured');
      return this.getMockSocialMetrics();
    }

    try {
      const result = await this.getCachedQueryResult(this.queryIds.socialMetrics, {
        contract_address: contractAddress
      });

      return this.formatSocialMetrics(result);
    } catch (error) {
      console.error('Error fetching social metrics:', error);
      return this.getMockSocialMetrics();
    }
  }

  async getComprehensiveDashboard(contractAddresses) {
    try {
      const [
        protocolOverview,
        strategyPerformance,
        userEngagement,
        aiMetrics,
        gamificationMetrics,
        socialMetrics
      ] = await Promise.all([
        this.getProtocolOverview(contractAddresses.yieldOptimizer),
        this.getStrategyPerformance(contractAddresses.yieldOptimizer),
        this.getUserEngagementMetrics(contractAddresses.yieldOptimizer),
        this.getAIRecommendationMetrics(contractAddresses.yieldOptimizer),
        this.getGamificationMetrics(contractAddresses.gameRewards),
        this.getSocialMetrics(contractAddresses.yieldOptimizer)
      ]);

      return {
        protocol: protocolOverview,
        strategies: strategyPerformance,
        engagement: userEngagement,
        ai: aiMetrics,
        gamification: gamificationMetrics,
        social: socialMetrics,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error fetching comprehensive dashboard:', error);
      throw error;
    }
  }

  // Format methods for each metric type
  formatProtocolOverview(result) {
    if (!result?.result?.rows?.length) return this.getMockProtocolOverview();

    const data = result.result.rows[0];
    return {
      totalValueLocked: parseFloat(data.current_tvl_usdt || 0),
      monthlyActiveUsers: parseInt(data.monthly_active_users || 0),
      averageDepositSize: parseFloat(data.avg_deposit_size_30d || 0),
      transactions24h: parseInt(data.transactions_24h || 0),
      tvlGrowth: parseFloat(data.tvl_change_pct || 0)
    };
  }

  formatStrategyPerformance(result) {
    if (!result?.result?.rows?.length) return this.getMockStrategyPerformance();

    return result.result.rows.map(row => ({
      strategyName: row.strategy_name,
      riskLevel: parseInt(row.risk_level),
      uniqueUsers: parseInt(row.unique_users || 0),
      totalDeposits: parseFloat(row.total_deposits_usdt || 0),
      totalRewards: parseFloat(row.total_rewards_paid || 0),
      actualAPY: parseFloat(row.actual_apy || 0),
      promisedAPY: parseFloat(row.promised_apy || 0),
      averageDepositSize: parseFloat(row.avg_deposit_size || 0)
    }));
  }

  formatUserEngagement(result) {
    if (!result?.result?.rows?.length) return this.getMockUserEngagement();

    return result.result.rows.map(row => ({
      date: row.date,
      dailyActiveUsers: parseInt(row.daily_active_users || 0),
      totalTransactions: parseInt(row.total_transactions || 0),
      deposits: parseInt(row.deposits || 0),
      withdrawals: parseInt(row.withdrawals || 0),
      aiRecommendations: parseInt(row.ai_recommendations || 0)
    }));
  }

  formatAIMetrics(result) {
    if (!result?.result?.rows?.length) return this.getMockAIMetrics();

    return result.result.rows.map(row => ({
      strategyId: parseInt(row.recommended_strategy_id),
      averageConfidence: parseFloat(row.avg_confidence || 0),
      totalRecommendations: parseInt(row.total_recommendations || 0),
      followedRecommendations: parseInt(row.followed_recommendations || 0),
      exactMatches: parseInt(row.exact_matches || 0),
      accuracyRate: parseFloat(row.accuracy_rate || 0),
      averageHoursToAct: parseFloat(row.avg_hours_to_act || 0),
      totalVolumeInfluenced: parseFloat(row.total_volume_influenced_usdt || 0)
    }));
  }

  formatGamificationMetrics(result) {
    if (!result?.result?.rows?.length) return this.getMockGamificationMetrics();

    return result.result.rows.map(row => ({
      missionName: row.mission_name,
      difficulty: parseInt(row.difficulty),
      rewardPoints: parseInt(row.reward_points || 0),
      completions: parseInt(row.completions || 0),
      totalRewardsDistributed: parseInt(row.total_rewards_distributed || 0),
      averageCompletionTime: parseFloat(row.avg_completion_time_hours || 0)
    }));
  }

  formatSocialMetrics(result) {
    if (!result?.result?.rows?.length) return this.getMockSocialMetrics();

    return result.result.rows.map(row => ({
      date: row.date,
      lineConnectedUsers: parseInt(row.line_connected_users || 0),
      totalUsers: parseInt(row.total_users || 0),
      lineIntegrationRate: parseFloat(row.line_integration_rate || 0)
    }));
  }

  // Mock data methods for fallback
  getMockProtocolOverview() {
    return {
      totalValueLocked: 2547892.45,
      monthlyActiveUsers: 1247,
      averageDepositSize: 847.23,
      transactions24h: 156,
      tvlGrowth: 12.34
    };
  }

  getMockStrategyPerformance() {
    return [
      {
        strategyName: 'Stable Earn',
        riskLevel: 2,
        uniqueUsers: 523,
        totalDeposits: 1234567.89,
        totalRewards: 64219.47,
        actualAPY: 5.2,
        promisedAPY: 5.0,
        averageDepositSize: 2361.45
      },
      {
        strategyName: 'Growth Plus',
        riskLevel: 5,
        uniqueUsers: 389,
        totalDeposits: 987654.32,
        totalRewards: 116545.21,
        actualAPY: 11.8,
        promisedAPY: 12.0,
        averageDepositSize: 2537.68
      },
      {
        strategyName: 'High Yield Pro',
        riskLevel: 8,
        uniqueUsers: 156,
        totalDeposits: 345678.90,
        totalRewards: 91629.84,
        actualAPY: 26.5,
        promisedAPY: 25.0,
        averageDepositSize: 2216.52
      }
    ];
  }

  getMockUserEngagement() {
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      last7Days.push({
        date: date.toISOString().split('T')[0],
        dailyActiveUsers: Math.floor(Math.random() * 200) + 800,
        totalTransactions: Math.floor(Math.random() * 300) + 500,
        deposits: Math.floor(Math.random() * 150) + 200,
        withdrawals: Math.floor(Math.random() * 50) + 30,
        aiRecommendations: Math.floor(Math.random() * 100) + 150
      });
    }
    return last7Days;
  }

  getMockAIMetrics() {
    return [
      {
        strategyId: 1,
        averageConfidence: 87.5,
        totalRecommendations: 1247,
        followedRecommendations: 1089,
        exactMatches: 946,
        accuracyRate: 86.9,
        averageHoursToAct: 2.3,
        totalVolumeInfluenced: 543219.76
      },
      {
        strategyId: 2,
        averageConfidence: 82.1,
        totalRecommendations: 892,
        followedRecommendations: 723,
        exactMatches: 587,
        accuracyRate: 81.2,
        averageHoursToAct: 3.7,
        totalVolumeInfluenced: 387654.21
      },
      {
        strategyId: 3,
        averageConfidence: 91.3,
        totalRecommendations: 234,
        followedRecommendations: 198,
        exactMatches: 181,
        accuracyRate: 91.4,
        averageHoursToAct: 1.8,
        totalVolumeInfluenced: 234567.89
      }
    ];
  }

  getMockGamificationMetrics() {
    return [
      {
        missionName: 'First Deposit',
        difficulty: 1,
        rewardPoints: 100,
        completions: 523,
        totalRewardsDistributed: 52300,
        averageCompletionTime: 0.5
      },
      {
        missionName: 'Yield Explorer',
        difficulty: 2,
        rewardPoints: 250,
        completions: 234,
        totalRewardsDistributed: 58500,
        averageCompletionTime: 72.3
      },
      {
        missionName: 'Social Butterfly',
        difficulty: 3,
        rewardPoints: 500,
        completions: 89,
        totalRewardsDistributed: 44500,
        averageCompletionTime: 168.7
      }
    ];
  }

  getMockSocialMetrics() {
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const totalUsers = Math.floor(Math.random() * 100) + 900;
      const lineUsers = Math.floor(totalUsers * (0.6 + Math.random() * 0.3));
      last7Days.push({
        date: date.toISOString().split('T')[0],
        lineConnectedUsers: lineUsers,
        totalUsers: totalUsers,
        lineIntegrationRate: (lineUsers / totalUsers) * 100
      });
    }
    return last7Days;
  }

  async initializeQueries() {
    console.log('🚀 Initializing Dune Analytics queries...');
    
    const queries = [
      {
        name: 'KAIA YIELD AI - Protocol Overview',
        file: 'protocol-overview.sql',
        description: 'Core protocol metrics including TVL, users, and growth'
      },
      {
        name: 'KAIA YIELD AI - Strategy Performance',
        file: 'strategy-performance.sql', 
        description: 'Performance metrics for each yield strategy'
      },
      {
        name: 'KAIA YIELD AI - User Engagement',
        file: 'user-engagement.sql',
        description: 'Daily active users and transaction metrics'
      },
      {
        name: 'KAIA YIELD AI - AI Recommendations',
        file: 'ai-recommendations.sql',
        description: 'AI recommendation accuracy and performance'
      },
      {
        name: 'KAIA YIELD AI - Gamification',
        file: 'gamification-metrics.sql',
        description: 'Mission completions and rewards distributed'
      },
      {
        name: 'KAIA YIELD AI - Social Features',
        file: 'social-metrics.sql',
        description: 'LINE integration and social engagement metrics'
      }
    ];

    // This would be used to programmatically create all queries
    // For the hackathon, we'll create them manually in the Dune interface
    console.log('📝 Queries to create manually in Dune:');
    queries.forEach(query => {
      console.log(`- ${query.name}: ${query.description}`);
    });
    
    return queries;
  }
}

module.exports = DuneAnalyticsService;