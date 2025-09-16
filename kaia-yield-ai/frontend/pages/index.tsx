import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  Shield, 
  Zap, 
  Users, 
  Trophy,
  ArrowRight,
  Bot
} from 'lucide-react';

import Layout from '../components/Layout';
import MetricsCard from '../components/MetricsCard';
import StrategyCard from '../components/StrategyCard';
import AIRecommendations from '../components/AIRecommendations';
import { useWalletStore } from '../store/wallet';
import { useProtocolStore } from '../store/protocol';
import { useLiffStore } from '../store/liff';

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(true);
  const { isConnected, address, connectWallet } = useWalletStore();
  const { metrics, strategies, loadProtocolData } = useProtocolStore();
  const { profile, isReady } = useLiffStore();

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
      window.location.href = '/portfolio';
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      </Layout>
    );
  }

  return (
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

        {/* Features Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.0 }}
          className="px-4 py-8"
        >
          <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">
            Why Choose KAIA YIELD AI?
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <Bot className="h-8 w-8 text-primary-500 mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">AI-Powered Optimization</h3>
              <p className="text-gray-600 text-sm">
                Our machine learning algorithms analyze market conditions and your preferences to recommend optimal yield strategies.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <Trophy className="h-8 w-8 text-secondary-500 mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Gamified Experience</h3>
              <p className="text-gray-600 text-sm">
                Complete missions, earn rewards, and level up while optimizing your DeFi portfolio.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <Shield className="h-8 w-8 text-success-500 mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Risk-Adjusted Returns</h3>
              <p className="text-gray-600 text-sm">
                Set your risk tolerance and let our AI find strategies that match your comfort level.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <Users className="h-8 w-8 text-purple-500 mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Social Trading</h3>
              <p className="text-gray-600 text-sm">
                Share strategies with LINE friends and earn bonuses for successful referrals.
              </p>
            </div>
          </div>
        </motion.div>

        {/* CTA Section */}
        {!isConnected && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.2 }}
            className="text-center py-8 px-4"
          >
            <div className="bg-gradient-to-r from-primary-500 to-secondary-500 rounded-lg p-6 text-white">
              <h3 className="text-xl font-bold mb-2">Ready to Start Earning?</h3>
              <p className="mb-4 opacity-90">
                Connect your wallet and start optimizing your USDT yields today
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={connectWallet}
                className="bg-white text-primary-600 px-6 py-2 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                Connect Wallet
              </motion.button>
            </div>
          </motion.div>
        )}
      </div>
    </Layout>
  );
}