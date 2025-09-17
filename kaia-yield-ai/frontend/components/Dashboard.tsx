import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  DollarSign,
  Users,
  Activity,
  Brain,
  Trophy,
  Target,
  Zap,
  Sparkles,
  ArrowUpRight,
  RefreshCw
} from 'lucide-react';
import { kaiaAPI, ProtocolMetrics, UserPortfolio, UserStats } from '../services/api';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';

interface DashboardProps {
  userAddress?: string;
}

const Dashboard: React.FC<DashboardProps> = ({ userAddress }) => {
  const [protocolMetrics, setProtocolMetrics] = useState<ProtocolMetrics | null>(null);
  const [userPortfolio, setUserPortfolio] = useState<UserPortfolio | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Mock performance data for charts
  const performanceData = [
    { name: 'Jan', portfolio: 1000, market: 1000 },
    { name: 'Feb', portfolio: 1045, market: 1020 },
    { name: 'Mar', portfolio: 1098, market: 1035 },
    { name: 'Apr', portfolio: 1156, market: 1048 },
    { name: 'May', portfolio: 1220, market: 1065 },
    { name: 'Jun', portfolio: 1289, market: 1078 },
  ];

  const strategyDistribution = [
    { name: 'Stable Earn', value: 35, color: '#10B981' },
    { name: 'Growth Plus', value: 45, color: '#3B82F6' },
    { name: 'High Yield Pro', value: 20, color: '#F59E0B' },
  ];

  const yieldHistory = [
    { day: '1d', yield: 5.2 },
    { day: '2d', yield: 5.8 },
    { day: '3d', yield: 6.1 },
    { day: '4d', yield: 5.9 },
    { day: '5d', yield: 6.4 },
    { day: '6d', yield: 6.8 },
    { day: '7d', yield: 7.2 },
  ];

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch real protocol metrics using API service
      const protocolData = await kaiaAPI.analytics.getProtocolMetrics();
      setProtocolMetrics(protocolData);

      // Fetch user-specific data if userAddress is provided
      if (userAddress) {
        const [portfolioData, statsData] = await Promise.all([
          kaiaAPI.yield.getUserPortfolio(userAddress),
          kaiaAPI.game.getUserStats(userAddress)
        ]);

        setUserPortfolio(portfolioData);
        setUserStats(statsData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      // Keep current state on error, don't reset to mock data
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchData();

    // Initialize WebSocket connection for real-time updates
    kaiaAPI.initializeRealTimeUpdates();

    // Set up event listeners for real-time updates
    const handleStrategyUpdate = () => {
      if (protocolMetrics) fetchData(); // Refresh data when strategies update
    };

    const handleNewDeposit = () => {
      if (userAddress) fetchData(); // Refresh user data on new deposits
    };

    const handleMissionCompleted = () => {
      if (userAddress) fetchData(); // Refresh user stats on mission completion
    };

    window.addEventListener('strategy-apy-update', handleStrategyUpdate);
    window.addEventListener('new-deposit', handleNewDeposit);
    window.addEventListener('mission-completed', handleMissionCompleted);

    const interval = setInterval(fetchData, 30000); // Refresh every 30 seconds

    return () => {
      clearInterval(interval);
      window.removeEventListener('strategy-apy-update', handleStrategyUpdate);
      window.removeEventListener('new-deposit', handleNewDeposit);
      window.removeEventListener('mission-completed', handleMissionCompleted);
      kaiaAPI.disconnect();
    };
  }, [userAddress]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-lg border-b border-white/10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                  KAIA YIELD AI
                </h1>
                <p className="text-gray-300 text-sm">AI-Powered DeFi Optimizer</p>
              </div>
            </div>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={refreshData}
              disabled={refreshing}
              className="p-2 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 hover:bg-white/20 transition-colors"
            >
              <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            </motion.button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Protocol Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <div className="bg-black/30 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="w-8 h-8 text-green-400" />
              <span className="text-2xl">💰</span>
            </div>
            <div className="text-2xl font-bold">${protocolMetrics?.protocol?.tvl?.toLocaleString() || '0'}</div>
            <div className="text-gray-400 text-sm">Total Value Locked</div>
            <div className="flex items-center mt-2 text-green-400 text-sm">
              <ArrowUpRight className="w-4 h-4 mr-1" />
              +12.5% from yesterday
            </div>
          </div>

          <div className="bg-black/30 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-8 h-8 text-blue-400" />
              <span className="text-2xl">📈</span>
            </div>
            <div className="text-2xl font-bold">{((protocolMetrics?.protocol?.averageApy || 0) / 100).toFixed(1)}%</div>
            <div className="text-gray-400 text-sm">Average APY</div>
            <div className="flex items-center mt-2 text-blue-400 text-sm">
              <Activity className="w-4 h-4 mr-1" />
              Live rates
            </div>
          </div>

          <div className="bg-black/30 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-8 h-8 text-purple-400" />
              <span className="text-2xl">👥</span>
            </div>
            <div className="text-2xl font-bold">{protocolMetrics?.protocol?.totalUsers?.toLocaleString() || '0'}</div>
            <div className="text-gray-400 text-sm">Active Users</div>
            <div className="flex items-center mt-2 text-purple-400 text-sm">
              <Zap className="w-4 h-4 mr-1" />
              +{Math.floor(Math.random() * 10) + 1} today
            </div>
          </div>

          <div className="bg-black/30 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <Target className="w-8 h-8 text-yellow-400" />
              <span className="text-2xl">🎯</span>
            </div>
            <div className="text-2xl font-bold">{protocolMetrics?.protocol?.totalStrategies || '0'}</div>
            <div className="text-gray-400 text-sm">Active Strategies</div>
            <div className="flex items-center mt-2 text-yellow-400 text-sm">
              <Brain className="w-4 h-4 mr-1" />
              AI Optimized
            </div>
          </div>
        </motion.div>

        {/* User Portfolio Section */}
        {userAddress && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-black/30 backdrop-blur-lg rounded-2xl p-6 border border-white/10"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold flex items-center">
                <Trophy className="w-6 h-6 mr-2 text-yellow-400" />
                Your Portfolio
              </h2>
              <div className="flex items-center space-x-2">
                <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full px-3 py-1 text-sm font-bold text-black">
                  Level {userStats?.gaming?.level || 1}
                </div>
                <div className="text-yellow-400 font-bold">{userStats?.gaming?.points || 0} pts</div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Portfolio Stats */}
              <div className="space-y-4">
                <div className="bg-green-500/20 border border-green-500/30 rounded-xl p-4">
                  <div className="text-green-400 text-sm mb-1">Total Deposited</div>
                  <div className="text-2xl font-bold">${userPortfolio?.summary?.totalDeposited || '0.00'}</div>
                </div>

                <div className="bg-blue-500/20 border border-blue-500/30 rounded-xl p-4">
                  <div className="text-blue-400 text-sm mb-1">Total Rewards</div>
                  <div className="text-2xl font-bold">${userPortfolio?.summary?.totalRewards || '0.00'}</div>
                </div>

                <div className="bg-purple-500/20 border border-purple-500/30 rounded-xl p-4">
                  <div className="text-purple-400 text-sm mb-1">Active Positions</div>
                  <div className="text-2xl font-bold">{userPortfolio?.summary?.activePositions || 0}</div>
                </div>
              </div>

              {/* Portfolio Performance Chart */}
              <div className="lg:col-span-2">
                <h3 className="text-lg font-semibold mb-4">Portfolio vs Market Performance</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={performanceData}>
                    <defs>
                      <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0.1}/>
                      </linearGradient>
                      <linearGradient id="marketGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6B7280" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#6B7280" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="name" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '8px',
                        color: 'white'
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="portfolio"
                      stroke="#10B981"
                      fillOpacity={1}
                      fill="url(#portfolioGradient)"
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="market"
                      stroke="#6B7280"
                      fillOpacity={1}
                      fill="url(#marketGradient)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </motion.div>
        )}

        {/* Charts Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          {/* Strategy Distribution */}
          <div className="bg-black/30 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Activity className="w-5 h-5 mr-2" />
              Strategy Distribution
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={strategyDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {strategyDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    color: 'white'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center space-x-4 mt-4">
              {strategyDistribution.map((entry) => (
                <div key={entry.name} className="flex items-center">
                  <div
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-sm text-gray-300">{entry.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Yield History */}
          <div className="bg-black/30 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" />
              7-Day Yield History
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={yieldHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="day" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    color: 'white'
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="yield"
                  stroke="#F59E0B"
                  strokeWidth={3}
                  dot={{ fill: '#F59E0B', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#F59E0B', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* AI Recommendations Preview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 backdrop-blur-lg rounded-2xl p-6 border border-purple-500/30"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center">
              <Brain className="w-6 h-6 mr-2 text-purple-400" />
              AI Recommendations
            </h3>
            <div className="flex items-center text-purple-400 text-sm">
              <Sparkles className="w-4 h-4 mr-1" />
              Powered by ML
            </div>
          </div>

          <div className="text-center py-8">
            <div className="text-4xl mb-4">🤖</div>
            <p className="text-gray-300 mb-4">Get personalized yield strategies powered by AI</p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-200"
            >
              View AI Recommendations
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;