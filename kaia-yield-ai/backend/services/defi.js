const axios = require('axios');
require('dotenv').config();

class DeFiIntegrationService {
  constructor() {
    this.coingeckoApi = 'https://api.coingecko.com/api/v3';
    this.defiLlamaApi = 'https://api.llama.fi';
    this.kaiaRpc = process.env.KAIA_MAINNET_RPC;

    // Cache for API responses (5 minute cache)
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  async getCachedData(key, fetcher) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      const data = await fetcher();
      this.cache.set(key, { data, timestamp: Date.now() });
      return data;
    } catch (error) {
      console.error(`Error fetching ${key}:`, error);
      return cached ? cached.data : null;
    }
  }

  async getRealTimeStrategyAPYs() {
    return this.getCachedData('strategy-apys', async () => {
      const [compoundApy, curveApy, uniswapApy] = await Promise.all([
        this.getCompoundAPY(),
        this.getCurveAPY(),
        this.getUniswapAPY()
      ]);

      return {
        stableearn: {
          apy: compoundApy || 520,
          source: 'Compound',
          liquidity: 'High',
          updated: new Date().toISOString()
        },
        growthplus: {
          apy: uniswapApy || 1180,
          source: 'Uniswap V3',
          liquidity: 'Medium',
          updated: new Date().toISOString()
        },
        highyieldpro: {
          apy: curveApy || 2650,
          source: 'Curve Finance',
          liquidity: 'Medium',
          updated: new Date().toISOString()
        }
      };
    });
  }

  async getCompoundAPY() {
    try {
      const response = await axios.get(`${this.defiLlamaApi}/pools`);
      const compoundPools = response.data.data.filter(pool =>
        pool.project === 'compound-v3' &&
        pool.symbol === 'USDC'
      );

      if (compoundPools.length > 0) {
        return Math.round(compoundPools[0].apy * 100);
      }
      return 520; // Fallback
    } catch (error) {
      console.error('Error fetching Compound APY:', error);
      return 520;
    }
  }

  async getCurveAPY() {
    try {
      const response = await axios.get(`${this.defiLlamaApi}/pools`);
      const curvePools = response.data.data.filter(pool =>
        pool.project === 'curve-dex' &&
        pool.symbol.includes('USDT')
      );

      if (curvePools.length > 0) {
        const avgApy = curvePools.reduce((sum, pool) => sum + pool.apy, 0) / curvePools.length;
        return Math.round(avgApy * 100);
      }
      return 2650; // Fallback
    } catch (error) {
      console.error('Error fetching Curve APY:', error);
      return 2650;
    }
  }

  async getUniswapAPY() {
    try {
      const response = await axios.get(`${this.defiLlamaApi}/pools`);
      const uniswapPools = response.data.data.filter(pool =>
        pool.project === 'uniswap-v3' &&
        pool.symbol.includes('USDT')
      );

      if (uniswapPools.length > 0) {
        const avgApy = uniswapPools.reduce((sum, pool) => sum + pool.apy, 0) / uniswapPools.length;
        return Math.round(avgApy * 100);
      }
      return 1180; // Fallback
    } catch (error) {
      console.error('Error fetching Uniswap APY:', error);
      return 1180;
    }
  }

  async getMarketData() {
    return this.getCachedData('market-data', async () => {
      try {
        const [priceData, globalData, defiData] = await Promise.all([
          this.getCryptoPrices(),
          this.getGlobalMarketData(),
          this.getDeFiTVL()
        ]);

        return {
          usdtPrice: priceData.usdt || 1.0,
          kaiaPrice: priceData.kaia || 0.15,
          totalMarketCap: globalData.total_market_cap?.usd || 2.1e12,
          defiTVL: defiData.tvl || 45e9,
          volatilityIndex: this.calculateVolatilityIndex(priceData),
          priceChange24h: {
            usdt: priceData.usdt_change_24h || 0,
            kaia: priceData.kaia_change_24h || 0
          },
          timestamp: new Date().toISOString()
        };
      } catch (error) {
        console.error('Error fetching market data:', error);
        return this.getFallbackMarketData();
      }
    });
  }

  async getCryptoPrices() {
    try {
      const response = await axios.get(`${this.coingeckoApi}/simple/price`, {
        params: {
          ids: 'tether,klaytn',
          vs_currencies: 'usd',
          include_24hr_change: true
        },
        headers: process.env.COINGECKO_API_KEY ? {
          'x-cg-demo-api-key': process.env.COINGECKO_API_KEY
        } : {}
      });

      return {
        usdt: response.data.tether?.usd || 1.0,
        kaia: response.data.klaytn?.usd || 0.15,
        usdt_change_24h: response.data.tether?.usd_24h_change || 0,
        kaia_change_24h: response.data.klaytn?.usd_24h_change || 0
      };
    } catch (error) {
      console.error('Error fetching crypto prices:', error);
      return { usdt: 1.0, kaia: 0.15, usdt_change_24h: 0, kaia_change_24h: 0 };
    }
  }

  async getGlobalMarketData() {
    try {
      const response = await axios.get(`${this.coingeckoApi}/global`, {
        headers: process.env.COINGECKO_API_KEY ? {
          'x-cg-demo-api-key': process.env.COINGECKO_API_KEY
        } : {}
      });

      return response.data.data || {};
    } catch (error) {
      console.error('Error fetching global market data:', error);
      return {};
    }
  }

  async getDeFiTVL() {
    try {
      const response = await axios.get(`${this.defiLlamaApi}/tvl`);
      return { tvl: response.data || 45e9 };
    } catch (error) {
      console.error('Error fetching DeFi TVL:', error);
      return { tvl: 45e9 };
    }
  }

  calculateVolatilityIndex(priceData) {
    const changes = [
      Math.abs(priceData.usdt_change_24h || 0),
      Math.abs(priceData.kaia_change_24h || 0)
    ];
    return Math.round(changes.reduce((sum, change) => sum + change, 0) / changes.length);
  }

  getFallbackMarketData() {
    return {
      usdtPrice: 1.0,
      kaiaPrice: 0.15,
      totalMarketCap: 2.1e12,
      defiTVL: 45e9,
      volatilityIndex: 25,
      priceChange24h: { usdt: 0, kaia: 0 },
      timestamp: new Date().toISOString()
    };
  }

  async assessRiskMetrics(strategyType) {
    return this.getCachedData(`risk-metrics-${strategyType}`, async () => {
      try {
        // Fetch real historical data to calculate risk metrics
        const historicalData = await this.getHistoricalData(strategyType);

        const metrics = {
          stable: this.calculateRiskMetrics(historicalData.stable || []),
          growth: this.calculateRiskMetrics(historicalData.growth || []),
          highyield: this.calculateRiskMetrics(historicalData.highyield || [])
        };

        return metrics[strategyType] || metrics.stable;
      } catch (error) {
        console.error('Error calculating risk metrics:', error);
        return this.getFallbackRiskMetrics()[strategyType] || this.getFallbackRiskMetrics().stable;
      }
    });
  }

  calculateRiskMetrics(data) {
    if (!data || data.length === 0) {
      return { volatility: 5.0, maxDrawdown: 2.0, sharpeRatio: 1.5 };
    }

    const returns = data.map((value, index) =>
      index > 0 ? (value - data[index - 1]) / data[index - 1] : 0
    ).slice(1);

    const avgReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / returns.length;
    const volatility = Math.sqrt(variance) * 100;

    let maxDrawdown = 0;
    let peak = data[0];
    for (const value of data) {
      if (value > peak) peak = value;
      const drawdown = (peak - value) / peak * 100;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    }

    const riskFreeRate = 0.02; // 2% risk-free rate
    const sharpeRatio = avgReturn > 0 ? (avgReturn - riskFreeRate) / Math.sqrt(variance) : 0;

    return {
      volatility: Math.round(volatility * 100) / 100,
      maxDrawdown: Math.round(maxDrawdown * 100) / 100,
      sharpeRatio: Math.round(sharpeRatio * 100) / 100
    };
  }

  getFallbackRiskMetrics() {
    return {
      stable: { volatility: 2.5, maxDrawdown: 1.0, sharpeRatio: 2.1 },
      growth: { volatility: 12.8, maxDrawdown: 8.5, sharpeRatio: 1.3 },
      highyield: { volatility: 28.5, maxDrawdown: 22.0, sharpeRatio: 0.9 }
    };
  }

  async getHistoricalData(strategyType) {
    try {
      // This would fetch real historical APY data from DeFiLlama or similar
      const response = await axios.get(`${this.defiLlamaApi}/charts`);
      // Process and return historical data based on strategy type
      return response.data;
    } catch (error) {
      console.error('Error fetching historical data:', error);
      return {};
    }
  }

  async getOptimalGasPrice() {
    return this.getCachedData('gas-price', async () => {
      try {
        // Kaia network gas prices (in peb - 10^18 peb = 1 KAIA)
        const response = await axios.post(this.kaiaRpc, {
          jsonrpc: '2.0',
          method: 'klay_gasPrice',
          params: [],
          id: 1
        });

        const currentGasPrice = parseInt(response.data.result, 16);

        return {
          slow: Math.round(currentGasPrice * 0.8),
          standard: currentGasPrice,
          fast: Math.round(currentGasPrice * 1.2),
          congestion: this.assessNetworkCongestion(currentGasPrice),
          timestamp: new Date().toISOString()
        };
      } catch (error) {
        console.error('Error fetching gas price:', error);
        return {
          slow: 600000000000,
          standard: 750000000000,
          fast: 900000000000,
          congestion: 'medium',
          timestamp: new Date().toISOString()
        };
      }
    });
  }

  assessNetworkCongestion(gasPrice) {
    const normalGasPrice = 750000000000; // 750 gwei normal for Kaia
    if (gasPrice > normalGasPrice * 1.5) return 'high';
    if (gasPrice > normalGasPrice * 1.2) return 'medium';
    return 'low';
  }

  async getProtocolAnalytics() {
    return this.getCachedData('protocol-analytics', async () => {
      try {
        const [marketData, apyData] = await Promise.all([
          this.getMarketData(),
          this.getRealTimeStrategyAPYs()
        ]);

        const strategies = Object.values(apyData);
        const avgApy = strategies.reduce((sum, strategy) => sum + strategy.apy, 0) / strategies.length;
        const totalLiquidity = strategies.reduce((sum, strategy) => {
          const liquidityMultiplier = strategy.liquidity === 'High' ? 3 : strategy.liquidity === 'Medium' ? 2 : 1;
          return sum + (strategy.apy * liquidityMultiplier);
        }, 0);

        return {
          totalStrategies: strategies.length,
          averageAPY: Math.round(avgApy),
          totalLiquidity: Math.round(totalLiquidity),
          bestPerformingStrategy: strategies.reduce((best, current) =>
            current.apy > best.apy ? current : best
          ),
          marketConditions: {
            bullish: avgApy > 1500,
            bearish: avgApy < 800,
            stable: avgApy >= 800 && avgApy <= 1500
          },
          riskProfile: {
            low: strategies.filter(s => s.apy < 1000).length,
            medium: strategies.filter(s => s.apy >= 1000 && s.apy < 2000).length,
            high: strategies.filter(s => s.apy >= 2000).length
          },
          lastUpdated: new Date().toISOString()
        };
      } catch (error) {
        console.error('Error fetching protocol analytics:', error);
        return null;
      }
    });
  }
}

module.exports = DeFiIntegrationService;