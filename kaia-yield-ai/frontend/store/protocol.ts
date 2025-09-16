import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface Strategy {
  id: number;
  name: string;
  apy: number;
  riskLevel: number;
  minDeposit: string;
  maxDeposit: string;
  active: boolean;
  category?: string;
  performance?: {
    trend: 'up' | 'down' | 'stable';
    change: number;
  };
}

interface ProtocolMetrics {
  tvl: number;
  totalStrategies: number;
  totalUsers: number;
  averageApy: number;
  topUsers?: Array<{
    user: string;
    score: number;
    timestamp: number;
  }>;
}

interface UserDeposit {
  amount: string;
  strategyId: number;
  depositTime: number;
  lastRewardTime: number;
  accumulatedRewards: string;
}

interface ProtocolState {
  // Data
  strategies: Strategy[];
  metrics: ProtocolMetrics | null;
  userDeposits: UserDeposit[];

  // Loading states
  isLoading: boolean;
  isLoadingStrategies: boolean;
  isLoadingMetrics: boolean;
  isLoadingUserData: boolean;

  // Error states
  error: string | null;
  strategiesError: string | null;
  metricsError: string | null;
  userDataError: string | null;

  // Last update timestamps
  lastUpdated: number | null;
  lastStrategiesUpdate: number | null;
  lastMetricsUpdate: number | null;
  lastUserDataUpdate: number | null;

  // Actions
  loadProtocolData: () => Promise<void>;
  loadStrategies: () => Promise<void>;
  loadMetrics: () => Promise<void>;
  loadUserData: (address: string) => Promise<void>;
  refreshAll: () => Promise<void>;
  clearUserData: () => void;
  clearErrors: () => void;

  // Getters
  getStrategyById: (id: number) => Strategy | undefined;
  getActiveStrategies: () => Strategy[];
  getUserDepositsByStrategy: (strategyId: number) => UserDeposit[];
  getTotalUserDeposited: () => number;
  getTotalUserRewards: () => number;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export const useProtocolStore = create<ProtocolState>()(
  devtools(
    (set, get) => ({
      // Initial state
      strategies: [],
      metrics: null,
      userDeposits: [],

      isLoading: false,
      isLoadingStrategies: false,
      isLoadingMetrics: false,
      isLoadingUserData: false,

      error: null,
      strategiesError: null,
      metricsError: null,
      userDataError: null,

      lastUpdated: null,
      lastStrategiesUpdate: null,
      lastMetricsUpdate: null,
      lastUserDataUpdate: null,

      // Actions
      loadProtocolData: async () => {
        const { loadStrategies, loadMetrics } = get();

        set({ isLoading: true, error: null });

        try {
          await Promise.all([
            loadStrategies(),
            loadMetrics()
          ]);

          set({
            lastUpdated: Date.now(),
            isLoading: false,
            error: null
          });
        } catch (error) {
          console.error('Failed to load protocol data:', error);
          set({
            error: error instanceof Error ? error.message : 'Failed to load protocol data',
            isLoading: false
          });
        }
      },

      loadStrategies: async () => {
        set({ isLoadingStrategies: true, strategiesError: null });

        try {
          const response = await fetch(`${API_BASE_URL}/strategies`);

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const data = await response.json();

          if (data.success) {
            // Enrich strategies with performance data (simulated for now)
            const enrichedStrategies = data.data.map((strategy: Strategy) => ({
              ...strategy,
              category: getStrategyCategory(strategy.apy, strategy.riskLevel),
              performance: generatePerformanceData(strategy)
            }));

            set({
              strategies: enrichedStrategies,
              lastStrategiesUpdate: Date.now(),
              isLoadingStrategies: false,
              strategiesError: null
            });
          } else {
            throw new Error(data.error || 'Failed to fetch strategies');
          }
        } catch (error) {
          console.error('Failed to load strategies:', error);
          set({
            strategiesError: error instanceof Error ? error.message : 'Failed to load strategies',
            isLoadingStrategies: false
          });
        }
      },

      loadMetrics: async () => {
        set({ isLoadingMetrics: true, metricsError: null });

        try {
          // Try to fetch real metrics from backend
          const response = await fetch(`${API_BASE_URL}/analytics/protocol`);

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const data = await response.json();

          if (data.success) {
            set({
              metrics: data.data.overview,
              lastMetricsUpdate: Date.now(),
              isLoadingMetrics: false,
              metricsError: null
            });
          } else {
            throw new Error(data.error || 'Failed to fetch metrics');
          }
        } catch (error) {
          console.error('Failed to load metrics:', error);
          set({
            metricsError: error instanceof Error ? error.message : 'Failed to load metrics',
            isLoadingMetrics: false
          });
        }
      },

      loadUserData: async (address: string) => {
        if (!address) {
          set({ userDeposits: [], userDataError: null });
          return;
        }

        set({ isLoadingUserData: true, userDataError: null });

        try {
          const response = await fetch(`${API_BASE_URL}/yield/portfolio/${address}`);

          if (!response.ok) {
            if (response.status === 404) {
              // User has no deposits yet
              set({
                userDeposits: [],
                lastUserDataUpdate: Date.now(),
                isLoadingUserData: false,
                userDataError: null
              });
              return;
            }
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const data = await response.json();

          if (data.success) {
            set({
              userDeposits: data.data.deposits || [],
              lastUserDataUpdate: Date.now(),
              isLoadingUserData: false,
              userDataError: null
            });
          } else {
            throw new Error(data.error || 'Failed to fetch user data');
          }
        } catch (error) {
          console.error('Failed to load user data:', error);
          set({
            userDataError: error instanceof Error ? error.message : 'Failed to load user data',
            isLoadingUserData: false
          });
        }
      },

      refreshAll: async () => {
        const { loadProtocolData } = get();
        await loadProtocolData();
      },

      clearUserData: () => {
        set({
          userDeposits: [],
          userDataError: null,
          lastUserDataUpdate: null
        });
      },

      clearErrors: () => {
        set({
          error: null,
          strategiesError: null,
          metricsError: null,
          userDataError: null
        });
      },

      // Getters
      getStrategyById: (id: number) => {
        const { strategies } = get();
        return strategies.find(strategy => strategy.id === id);
      },

      getActiveStrategies: () => {
        const { strategies } = get();
        return strategies.filter(strategy => strategy.active);
      },

      getUserDepositsByStrategy: (strategyId: number) => {
        const { userDeposits } = get();
        return userDeposits.filter(deposit => deposit.strategyId === strategyId);
      },

      getTotalUserDeposited: () => {
        const { userDeposits } = get();
        return userDeposits.reduce((total, deposit) => {
          return total + parseFloat(deposit.amount);
        }, 0);
      },

      getTotalUserRewards: () => {
        const { userDeposits } = get();
        return userDeposits.reduce((total, deposit) => {
          return total + parseFloat(deposit.accumulatedRewards);
        }, 0);
      }
    }),
    {
      name: 'protocol-store',
      partialize: (state) => ({
        strategies: state.strategies,
        metrics: state.metrics,
        lastUpdated: state.lastUpdated,
        lastStrategiesUpdate: state.lastStrategiesUpdate,
        lastMetricsUpdate: state.lastMetricsUpdate
      })
    }
  )
);

// Helper functions
function getStrategyCategory(apy: number, riskLevel: number): string {
  if (apy < 800 && riskLevel <= 3) return 'Conservative';
  if (apy >= 800 && apy < 1500 && riskLevel <= 6) return 'Balanced';
  if (apy >= 1500) return 'Aggressive';
  return 'Custom';
}

function generatePerformanceData(strategy: Strategy) {
  const trends = ['up', 'down', 'stable'] as const;
  const trend = trends[Math.floor(Math.random() * trends.length)];
  const change = trend === 'stable' ?
    (Math.random() - 0.5) * 2 : // -1% to +1%
    trend === 'up' ?
      Math.random() * 10 + 1 : // +1% to +11%
      -(Math.random() * 10 + 1); // -1% to -11%

  return {
    trend,
    change: Math.round(change * 100) / 100
  };
}

function generateTopUsers() {
  const users = [];
  for (let i = 0; i < 10; i++) {
    users.push({
      user: `0x${Math.random().toString(16).substring(2, 42)}`,
      score: Math.floor(Math.random() * 5000) + 1000,
      timestamp: Date.now() - Math.floor(Math.random() * 86400000) // Random time in last 24h
    });
  }
  return users.sort((a, b) => b.score - a.score);
}

// Hook for easy access to computed values
export const useProtocolData = () => {
  const store = useProtocolStore();

  return {
    ...store,
    hasData: store.strategies.length > 0 || store.metrics !== null,
    isAnyLoading: store.isLoading || store.isLoadingStrategies || store.isLoadingMetrics || store.isLoadingUserData,
    hasAnyError: !!(store.error || store.strategiesError || store.metricsError || store.userDataError),
    totalPortfolioValue: store.getTotalUserDeposited() + store.getTotalUserRewards(),
    activeStrategiesCount: store.getActiveStrategies().length
  };
};