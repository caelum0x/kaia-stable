import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  Brain,
  Users,
  Trophy,
  Smartphone,
  Settings,
  Menu,
  X,
  Bell,
  Search,
  TrendingUp,
  DollarSign,
  Target,
  Zap,
  Sparkles,
  Activity,
  BarChart3,
  PieChart,
  LineChart,
  Wallet,
  Crown,
  Gift,
  Heart,
  Gamepad2,
  Star
} from 'lucide-react';

// Import our components
import Dashboard from './Dashboard';
import AIRecommendationsEnhanced from './AIRecommendationsEnhanced';
import SocialTrading from './SocialTrading';
import GameSystem from './GameSystem';
import LIFFIntegration from './LIFFIntegration';

type TabType = 'dashboard' | 'ai' | 'social' | 'gaming' | 'profile';

interface NavigationItem {
  id: TabType;
  label: string;
  icon: any;
  color: string;
  gradient: string;
  badge?: number;
}

interface QuickStat {
  label: string;
  value: string;
  change: string;
  icon: any;
  color: string;
}

const MainApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState(3);
  const [userConnected, setUserConnected] = useState(true);

  const navigationItems: NavigationItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: Home,
      color: 'text-blue-400',
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      id: 'ai',
      label: 'AI Optimizer',
      icon: Brain,
      color: 'text-purple-400',
      gradient: 'from-purple-500 to-pink-500'
    },
    {
      id: 'social',
      label: 'Social Trading',
      icon: Users,
      color: 'text-green-400',
      gradient: 'from-green-500 to-emerald-500'
    },
    {
      id: 'gaming',
      label: 'Missions',
      icon: Trophy,
      color: 'text-yellow-400',
      gradient: 'from-yellow-500 to-orange-500',
      badge: 2
    },
    {
      id: 'profile',
      label: 'LINE Profile',
      icon: Smartphone,
      color: 'text-indigo-400',
      gradient: 'from-indigo-500 to-purple-500'
    }
  ];

  const quickStats: QuickStat[] = [
    {
      label: 'Portfolio Value',
      value: '$12,547',
      change: '+8.5%',
      icon: DollarSign,
      color: 'text-green-400'
    },
    {
      label: 'AI Score',
      value: '92.3',
      change: '+2.1',
      icon: Brain,
      color: 'text-purple-400'
    },
    {
      label: 'Social Rank',
      value: '#47',
      change: '+5',
      icon: Crown,
      color: 'text-yellow-400'
    },
    {
      label: 'Game Points',
      value: '1,547',
      change: '+150',
      icon: Star,
      color: 'text-blue-400'
    }
  ];

  // Close sidebar when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setSidebarOpen(false);
    };

    if (sidebarOpen) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [sidebarOpen]);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard userAddress={userConnected ? '0x1234...5678' : undefined} />;
      case 'ai':
        return <AIRecommendationsEnhanced userAddress={userConnected ? '0x1234...5678' : undefined} />;
      case 'social':
        return <SocialTrading />;
      case 'gaming':
        return <GameSystem />;
      case 'profile':
        return <LIFFIntegration />;
      default:
        return <Dashboard />;
    }
  };

  const getActiveGradient = () => {
    const activeItem = navigationItems.find(item => item.id === activeTab);
    return activeItem?.gradient || 'from-blue-500 to-purple-500';
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col lg:flex-row">
      {/* Mobile Header */}
      <div className="lg:hidden bg-black/90 backdrop-blur-lg border-b border-gray-800 px-4 py-3 relative z-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.stopPropagation();
                setSidebarOpen(!sidebarOpen);
              }}
              className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <Menu className="w-6 h-6" />
            </motion.button>

            <div className={`w-8 h-8 bg-gradient-to-r ${getActiveGradient()} rounded-lg flex items-center justify-center`}>
              <Sparkles className="w-5 h-5 text-white" />
            </div>

            <div>
              <h1 className="text-lg font-bold text-white">KAIA YIELD AI</h1>
              <p className="text-xs text-gray-400">
                {navigationItems.find(item => item.id === activeTab)?.label}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <motion.button
              whileTap={{ scale: 0.95 }}
              className="relative p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <Bell className="w-5 h-5" />
              {notifications > 0 && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-xs text-white font-bold">{notifications}</span>
                </div>
              )}
            </motion.button>

            <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-blue-400 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">U</span>
            </div>
          </div>
        </div>

        {/* Quick Stats Bar - Mobile */}
        <div className="mt-3 grid grid-cols-4 gap-2">
          {quickStats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white/5 backdrop-blur-sm rounded-lg p-2 text-center"
            >
              <stat.icon className={`w-3 h-3 ${stat.color} mx-auto mb-1`} />
              <div className="text-white text-xs font-bold">{stat.value}</div>
              <div className={`text-xs ${stat.color}`}>{stat.change}</div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Sidebar */}
      <AnimatePresence>
        {(sidebarOpen || window.innerWidth >= 1024) && (
          <motion.div
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed lg:static inset-y-0 left-0 z-40 w-80 bg-black/95 backdrop-blur-xl border-r border-gray-800 lg:w-80"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sidebar Header */}
            <div className="p-6 border-b border-gray-800">
              <div className="flex items-center justify-between lg:justify-center">
                <div className="flex items-center space-x-3">
                  <div className={`w-12 h-12 bg-gradient-to-r ${getActiveGradient()} rounded-2xl flex items-center justify-center shadow-lg`}>
                    <Sparkles className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                      KAIA YIELD AI
                    </h1>
                    <p className="text-gray-400 text-sm">AI-Powered DeFi</p>
                  </div>
                </div>

                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSidebarOpen(false)}
                  className="lg:hidden p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>

              {/* User Status - Desktop */}
              <div className="hidden lg:block mt-6 p-4 bg-gradient-to-r from-white/5 to-white/10 rounded-xl border border-white/10">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-blue-400 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">U</span>
                  </div>
                  <div className="flex-1">
                    <div className="text-white font-semibold text-sm">Connected</div>
                    <div className="text-gray-400 text-xs">Level 8 • 1,547 pts</div>
                  </div>
                  <div className="relative">
                    <Bell className="w-5 h-5 text-gray-400" />
                    {notifications > 0 && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                        <span className="text-xs text-white font-bold">{notifications}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className="p-6 space-y-2">
              {navigationItems.map((item) => (
                <motion.button
                  key={item.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setActiveTab(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 p-4 rounded-xl transition-all duration-200 ${
                    activeTab === item.id
                      ? `bg-gradient-to-r ${item.gradient} text-white shadow-lg`
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-semibold">{item.label}</span>
                  {item.badge && (
                    <div className="ml-auto w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                      <span className="text-xs text-white font-bold">{item.badge}</span>
                    </div>
                  )}
                </motion.button>
              ))}
            </div>

            {/* Quick Stats - Desktop */}
            <div className="hidden lg:block px-6 py-4">
              <h3 className="text-gray-400 text-sm font-semibold mb-3">Quick Stats</h3>
              <div className="space-y-3">
                {quickStats.map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <stat.icon className={`w-4 h-4 ${stat.color}`} />
                      <div>
                        <div className="text-white text-sm font-semibold">{stat.value}</div>
                        <div className="text-gray-400 text-xs">{stat.label}</div>
                      </div>
                    </div>
                    <div className={`text-sm font-semibold ${stat.color}`}>
                      {stat.change}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Sidebar Footer */}
            <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-gray-800">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full flex items-center space-x-3 p-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              >
                <Settings className="w-5 h-5" />
                <span>Settings</span>
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overlay for mobile */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 bg-black/50 z-30"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Desktop Header */}
        <div className="hidden lg:block bg-black/50 backdrop-blur-lg border-b border-gray-800 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h2 className="text-2xl font-bold text-white">
                {navigationItems.find(item => item.id === activeTab)?.label}
              </h2>
              <div className="flex items-center space-x-2 text-sm text-gray-400">
                <Activity className="w-4 h-4" />
                <span>Real-time data</span>
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="bg-white/5 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
                />
              </div>

              <motion.button
                whileTap={{ scale: 0.95 }}
                className="relative p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <Bell className="w-5 h-5" />
                {notifications > 0 && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-xs text-white font-bold">{notifications}</span>
                  </div>
                )}
              </motion.button>

              <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-blue-400 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">U</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-xl border-t border-gray-800 px-4 py-2 safe-area-pb z-40">
        <div className="flex items-center justify-around">
          {navigationItems.map((item) => (
            <motion.button
              key={item.id}
              whileTap={{ scale: 0.9 }}
              onClick={() => setActiveTab(item.id)}
              className={`relative flex flex-col items-center p-2 rounded-lg transition-colors ${
                activeTab === item.id ? 'text-white' : 'text-gray-500'
              }`}
            >
              <div className={`relative ${activeTab === item.id ? `text-white` : ''}`}>
                <item.icon className="w-5 h-5" />
                {item.badge && (
                  <div className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-xs text-white font-bold">{item.badge}</span>
                  </div>
                )}
              </div>
              <span className="text-xs font-medium mt-1 truncate max-w-16">
                {item.label.split(' ')[0]}
              </span>
              {activeTab === item.id && (
                <motion.div
                  layoutId="mobile-indicator"
                  className={`absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1 w-1 h-1 bg-gradient-to-r ${item.gradient} rounded-full`}
                />
              )}
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MainApp;