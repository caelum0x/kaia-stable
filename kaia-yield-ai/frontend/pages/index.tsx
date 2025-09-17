import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  Shield,
  Zap,
  Users,
  Trophy,
  ArrowRight,
  Bot,
  Sparkles,
  Star,
  Brain,
  Smartphone,
  Play,
  Pause,
  BarChart3,
  Heart,
  Target,
  Crown,
  Gamepad2,
  Percent
} from 'lucide-react';

// Import our enhanced components
import { MainApp, MetricDisplay, RealTimeDataViz } from '../components';

// Legacy imports for backward compatibility
import Layout from '../components/Layout';
import MetricsCard from '../components/MetricsCard';
import StrategyCard from '../components/StrategyCard';
import AIRecommendations from '../components/AIRecommendations';
import { useWalletStore } from '../store/wallet';
import { useProtocolStore } from '../store/protocol';
import { useLiffStore } from '../store/liff';

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [showLegacyMode, setShowLegacyMode] = useState(false);
  const [showDemo, setShowDemo] = useState(true);
  const { isConnected, address, connectWallet } = useWalletStore();
  const { metrics, strategies, loadProtocolData } = useProtocolStore();
  const { profile, isReady } = useLiffStore();

  // Mock real-time metrics for demo
  const realTimeMetrics: MetricDisplay[] = [
    {
      id: 'tvl',
      title: 'Total Value Locked',
      value: 1234567.89,
      prevValue: 1200000,
      format: 'currency',
      color: 'text-green-400',
      icon: TrendingUp,
      chartData: Array.from({ length: 30 }, (_, i) => ({
        timestamp: Date.now() - (29 - i) * 60000,
        value: 1000000 + Math.random() * 500000 + i * 10000,
        label: `${29 - i}m ago`
      })),
      chartConfig: {
        title: 'TVL Trend',
        type: 'area',
        dataKey: 'value',
        color: '#10B981',
        showGrid: true,
        showTooltip: true,
        animated: true,
        realTime: true
      }
    },
    {
      id: 'apy',
      title: 'Average APY',
      value: 12.47,
      prevValue: 12.15,
      format: 'apy',
      color: 'text-blue-400',
      icon: Percent,
      chartData: Array.from({ length: 30 }, (_, i) => ({
        timestamp: Date.now() - (29 - i) * 60000,
        value: 10 + Math.random() * 5,
        label: `${29 - i}m ago`
      })),
      chartConfig: {
        title: 'APY History',
        type: 'line',
        dataKey: 'value',
        color: '#3B82F6',
        showGrid: true,
        showTooltip: true,
        animated: true,
        realTime: true
      }
    },
    {
      id: 'users',
      title: 'Active Users',
      value: 2847,
      prevValue: 2756,
      format: 'number',
      color: 'text-purple-400',
      icon: Users,
      chartData: Array.from({ length: 30 }, (_, i) => ({
        timestamp: Date.now() - (29 - i) * 60000,
        value: 2000 + Math.random() * 1000 + i * 50,
        label: `${29 - i}m ago`
      })),
      chartConfig: {
        title: 'User Growth',
        type: 'bar',
        dataKey: 'value',
        color: '#8B5CF6',
        showGrid: true,
        showTooltip: true,
        animated: true,
        realTime: true
      }
    },
    {
      id: 'social_volume',
      title: 'Social Volume',
      value: 456789.12,
      prevValue: 445000,
      format: 'currency',
      color: 'text-yellow-400',
      icon: Heart,
      chartData: Array.from({ length: 30 }, (_, i) => ({
        timestamp: Date.now() - (29 - i) * 60000,
        value: 300000 + Math.random() * 200000,
        label: `${29 - i}m ago`
      })),
      chartConfig: {
        title: 'Social Trading Volume',
        type: 'area',
        dataKey: 'value',
        color: '#F59E0B',
        showGrid: true,
        showTooltip: true,
        animated: true,
        realTime: true
      }
    }
  ];

  useEffect(() => {
    const loadData = async () => {
      if (isReady) {
        await loadProtocolData();
        setIsLoading(false);
      }
    };

    loadData();
  }, [isReady, loadProtocolData]);

  const handleGetStarted = async () => {
    if (!isConnected) {
      await connectWallet();
    } else {
      setShowDemo(false);
    }
  };

  // If user wants to see the new app and is connected, show MainApp
  if (!showDemo && isConnected) {
    return <MainApp />;
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <motion.div className="text-center text-white">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-purple-400 border-t-transparent rounded-full mx-auto mb-4"
          />
          <div className="text-xl font-bold mb-2">Loading KAIA YIELD AI...</div>
          <div className="text-sm opacity-80">Initializing AI-powered DeFi experience</div>
        </motion.div>
      </div>
    );
  }

  // Enhanced Landing Page
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-white/10 rounded-full"
            initial={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
            }}
            animate={{
              y: [null, -100],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: Math.random() * 3 + 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      <div className="relative z-10">
        {/* Mode Toggle */}
        <div className="absolute top-4 right-4 z-50">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowLegacyMode(!showLegacyMode)}
            className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl px-4 py-2 text-sm font-medium hover:bg-white/20 transition-colors"
          >
            {showLegacyMode ? 'Enhanced Mode' : 'Legacy Mode'}
          </motion.button>
        </div>

        <AnimatePresence mode="wait">
          {showLegacyMode ? (
            // Legacy Mode
            <motion.div
              key="legacy"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Layout>
                <div className="space-y-6">
                  {/* Hero Section */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-center py-8 px-4"
                  >
                    <div className="flex items-center justify-center mb-4">
                      <Bot className="h-12 w-12 text-primary-500 mr-3" />
                      <h1 className="text-3xl font-bold text-gray-900">KAIA YIELD AI</h1>
                    </div>
                    <p className="text-lg text-gray-600 mb-6 max-w-2xl mx-auto">
                      Maximize your USDT returns with AI-powered yield optimization and gamified DeFi experiences
                    </p>

                    {profile && (
                      <div className="bg-primary-50 rounded-lg p-4 mb-6">
                        <p className="text-primary-700">
                          Welcome back, <span className="font-semibold">{profile.displayName}</span>! 👋
                        </p>
                      </div>
                    )}

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleGetStarted}
                      className="bg-primary-600 text-white px-8 py-3 rounded-lg font-semibold flex items-center mx-auto hover:bg-primary-700 transition-colors"
                    >
                      {isConnected ? 'Go to Portfolio' : 'Get Started'}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </motion.button>
                  </motion.div>

                  {/* Protocol Metrics */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="grid grid-cols-2 lg:grid-cols-4 gap-4 px-4"
                  >
                    <MetricsCard
                      title="Total Value Locked"
                      value={`$${metrics?.tvl?.toLocaleString() || '0'}`}
                      icon={TrendingUp}
                      color="text-success-600"
                    />
                    <MetricsCard
                      title="Active Strategies"
                      value={metrics?.totalStrategies?.toString() || '0'}
                      icon={Shield}
                      color="text-primary-600"
                    />
                    <MetricsCard
                      title="Average APY"
                      value={`${(metrics?.averageApy / 100)?.toFixed(1) || '0'}%`}
                      icon={Zap}
                      color="text-secondary-600"
                    />
                    <MetricsCard
                      title="Active Users"
                      value={metrics?.totalUsers?.toString() || '0'}
                      icon={Users}
                      color="text-purple-600"
                    />
                  </motion.div>

                  {/* AI Recommendations Section */}
                  {isConnected && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.4 }}
                      className="px-4"
                    >
                      <AIRecommendations userAddress={address} />
                    </motion.div>
                  )}

                  {/* Featured Strategies */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.6 }}
                    className="px-4"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-bold text-gray-900">Featured Strategies</h2>
                      <button className="text-primary-600 font-medium hover:text-primary-700">
                        View All
                      </button>
                    </div>

                    <div className="space-y-3">
                      {strategies?.slice(0, 3).map((strategy, index) => (
                        <motion.div
                          key={strategy.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.4, delay: 0.8 + index * 0.1 }}
                        >
                          <StrategyCard strategy={strategy} />
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                </div>
              </Layout>
            </motion.div>
          ) : (
            // Enhanced Mode
            <motion.div
              key="enhanced"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="min-h-screen"
            >
              {/* Hero Section */}
              <div className="container mx-auto px-4 py-12">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                  className="text-center mb-16"
                >
                  <div className="flex items-center justify-center mb-6">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                      className="w-20 h-20 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-3xl flex items-center justify-center mr-4"
                    >
                      <Sparkles className="w-12 h-12 text-white" />
                    </motion.div>
                    <div>
                      <h1 className="text-5xl lg:text-7xl font-bold bg-gradient-to-r from-yellow-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
                        KAIA YIELD AI
                      </h1>
                      <p className="text-xl text-gray-300 mt-2">Next-Gen AI-Powered DeFi Platform</p>
                    </div>
                  </div>

                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                    className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed"
                  >
                    Experience the future of DeFi with AI-powered yield optimization, social trading,
                    gamified missions, and seamless LINE integration. Maximize your returns while having fun!
                  </motion.p>

                  {profile && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.6, delay: 0.5 }}
                      className="bg-green-500/20 border border-green-500/30 rounded-2xl p-6 mb-8 max-w-md mx-auto"
                    >
                      <div className="flex items-center justify-center space-x-3">
                        <div className="text-3xl">👋</div>
                        <div>
                          <p className="text-green-400 font-semibold">Welcome back!</p>
                          <p className="text-white">{profile.displayName}</p>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleGetStarted}
                      className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-4 rounded-xl font-bold text-lg flex items-center hover:shadow-lg transition-all duration-200"
                    >
                      {isConnected ? (
                        <>
                          <Crown className="mr-2 h-6 w-6" />
                          Enter DeFi Universe
                        </>
                      ) : (
                        <>
                          <Zap className="mr-2 h-6 w-6" />
                          Connect & Start Earning
                        </>
                      )}
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="bg-white/10 backdrop-blur-lg border border-white/20 text-white px-8 py-4 rounded-xl font-bold text-lg flex items-center hover:bg-white/20 transition-all duration-200"
                    >
                      <Play className="mr-2 h-5 w-5" />
                      Watch Demo
                    </motion.button>
                  </div>
                </motion.div>

                {/* Real-Time Metrics Dashboard */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.6 }}
                  className="mb-16"
                >
                  <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold mb-4 flex items-center justify-center">
                      <BarChart3 className="w-8 h-8 mr-3 text-blue-400" />
                      Live Protocol Metrics
                    </h2>
                    <p className="text-gray-300">Real-time data visualization powered by our AI engine</p>
                  </div>

                  <RealTimeDataViz
                    metrics={realTimeMetrics}
                    updateInterval={3000}
                    layout="grid"
                    theme="dark"
                    interactive={true}
                  />
                </motion.div>

                {/* Feature Showcase */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.8 }}
                  className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6 mb-16"
                >
                  {[
                    {
                      icon: Brain,
                      title: 'AI Optimizer',
                      description: 'ML-powered yield recommendations',
                      color: 'from-purple-500 to-pink-500',
                      emoji: '🤖'
                    },
                    {
                      icon: Users,
                      title: 'Social Trading',
                      description: 'Copy strategies, share wins',
                      color: 'from-blue-500 to-cyan-500',
                      emoji: '👥'
                    },
                    {
                      icon: Gamepad2,
                      title: 'Gamified Missions',
                      description: 'Earn rewards, level up',
                      color: 'from-green-500 to-emerald-500',
                      emoji: '🎮'
                    },
                    {
                      icon: Smartphone,
                      title: 'LINE Integration',
                      description: 'Seamless mobile experience',
                      color: 'from-yellow-500 to-orange-500',
                      emoji: '📱'
                    }
                  ].map((feature, index) => (
                    <motion.div
                      key={feature.title}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 1.0 + index * 0.2 }}
                      whileHover={{ scale: 1.05, y: -5 }}
                      className="bg-black/30 backdrop-blur-lg rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all duration-300"
                    >
                      <div className={`w-16 h-16 bg-gradient-to-r ${feature.color} rounded-2xl flex items-center justify-center mb-4`}>
                        <span className="text-3xl">{feature.emoji}</span>
                      </div>
                      <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                      <p className="text-gray-300">{feature.description}</p>
                    </motion.div>
                  ))}
                </motion.div>

                {/* Call to Action */}
                {!isConnected && (
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 1.4 }}
                    className="text-center"
                  >
                    <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 backdrop-blur-lg rounded-3xl p-8 border border-white/10">
                      <div className="text-6xl mb-6">🚀</div>
                      <h3 className="text-3xl font-bold mb-4">Ready to Transform Your DeFi Experience?</h3>
                      <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                        Join thousands of users already earning optimized yields with our AI-powered platform
                      </p>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={connectWallet}
                        className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-12 py-4 rounded-xl font-bold text-xl hover:shadow-lg transition-all duration-200"
                      >
                        Connect Wallet & Start Now
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}