import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion';
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
  Star,
  Loader2,
  Wifi,
  WifiOff,
  RefreshCw,
  Sun,
  Moon,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2
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
  const [isLoading, setIsLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const smoothMouseX = useSpring(mouseX, { damping: 25, stiffness: 100 });
  const smoothMouseY = useSpring(mouseY, { damping: 25, stiffness: 100 });

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

  // Enhanced effects for better UX
  useEffect(() => {
    // Close sidebar when clicking outside
    const handleClickOutside = () => {
      setSidebarOpen(false);
    };

    // Mouse tracking for interactive background
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        setMousePosition({ x, y });
        mouseX.set(x);
        mouseY.set(y);
      }
    };

    // Online/offline detection
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    // Time updates
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // Keyboard shortcuts
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case '1':
            e.preventDefault();
            setActiveTab('dashboard');
            break;
          case '2':
            e.preventDefault();
            setActiveTab('ai');
            break;
          case '3':
            e.preventDefault();
            setActiveTab('social');
            break;
          case '4':
            e.preventDefault();
            setActiveTab('gaming');
            break;
          case '5':
            e.preventDefault();
            setActiveTab('profile');
            break;
          case 'm':
            e.preventDefault();
            setSidebarOpen(!sidebarOpen);
            break;
        }
      }
    };

    if (sidebarOpen) {
      document.addEventListener('click', handleClickOutside);
    }

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('keydown', handleKeyPress);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('keydown', handleKeyPress);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(timeInterval);
    };
  }, [sidebarOpen, mouseX, mouseY]);

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

  const getCurrentTimeGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    if (hour < 21) return 'Good evening';
    return 'Good night';
  };

  const handleTabChange = async (newTab: TabType) => {
    if (soundEnabled) {
      // Play subtle sound effect (you'd implement this with Web Audio API)
      console.log('Tab change sound');
    }

    setIsLoading(true);

    // Simulate loading for smooth transition
    setTimeout(() => {
      setActiveTab(newTab);
      setIsLoading(false);
      setSidebarOpen(false);
    }, 150);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`min-h-screen relative overflow-hidden flex flex-col lg:flex-row transition-all duration-500 ${
        darkMode
          ? 'bg-gradient-to-br from-gray-900 via-purple-900/20 to-blue-900/20'
          : 'bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50'
      }`}
    >
      {/* Interactive Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Floating particles */}
        {Array.from({ length: 30 }).map((_, i) => (
          <motion.div
            key={i}
            className={`absolute w-1 h-1 rounded-full ${
              darkMode ? 'bg-white/20' : 'bg-purple-500/20'
            }`}
            initial={{
              x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000),
              y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 1000),
            }}
            animate={{
              y: [null, -100],
              opacity: [0, 1, 0],
              scale: [0, 1, 0],
            }}
            transition={{
              duration: Math.random() * 4 + 3,
              repeat: Infinity,
              delay: Math.random() * 2,
              ease: "easeInOut",
            }}
          />
        ))}

        {/* Mouse follow gradient */}
        <motion.div
          className="absolute w-96 h-96 rounded-full opacity-30 blur-3xl"
          style={{
            background: darkMode
              ? 'radial-gradient(circle, rgba(147, 51, 234, 0.3) 0%, transparent 70%)'
              : 'radial-gradient(circle, rgba(59, 130, 246, 0.3) 0%, transparent 70%)',
            left: smoothMouseX,
            top: smoothMouseY,
            transform: 'translate(-50%, -50%)',
          }}
        />
      </div>
      {/* Enhanced Mobile Header */}
      <div className={`lg:hidden backdrop-blur-xl border-b px-4 py-3 relative z-50 ${
        darkMode
          ? 'bg-black/90 border-gray-800'
          : 'bg-white/90 border-gray-200'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.stopPropagation();
                setSidebarOpen(!sidebarOpen);
              }}
              className={`p-2 rounded-xl transition-all duration-200 ${
                darkMode
                  ? 'text-white hover:bg-white/10 hover:shadow-lg'
                  : 'text-gray-700 hover:bg-gray-100 hover:shadow-md'
              }`}
            >
              <motion.div
                animate={{ rotate: sidebarOpen ? 90 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <Menu className="w-6 h-6" />
              </motion.div>
            </motion.button>

            <motion.div
              className={`w-10 h-10 bg-gradient-to-r ${getActiveGradient()} rounded-2xl flex items-center justify-center shadow-lg`}
              animate={{
                rotate: [0, 360],
                scale: [1, 1.1, 1]
              }}
              transition={{
                rotate: { duration: 8, repeat: Infinity, ease: "linear" },
                scale: { duration: 2, repeat: Infinity }
              }}
            >
              <Sparkles className="w-6 h-6 text-white" />
            </motion.div>

            <div>
              <h1 className={`text-lg font-bold ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}>
                KAIA YIELD AI
              </h1>
              <div className="flex items-center space-x-2">
                <p className={`text-xs ${
                  darkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  {navigationItems.find(item => item.id === activeTab)?.label}
                </p>
                <div className="flex items-center space-x-1">
                  {isOnline ? (
                    <Wifi className="w-3 h-3 text-green-400" />
                  ) : (
                    <WifiOff className="w-3 h-3 text-red-400" />
                  )}
                  <span className={`text-xs ${
                    darkMode ? 'text-gray-500' : 'text-gray-400'
                  }`}>
                    {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <motion.button
              whileHover={{ scale: 1.1, rotate: 15 }}
              whileTap={{ scale: 0.9 }}
              className={`relative p-2 rounded-xl transition-all duration-200 ${
                darkMode
                  ? 'text-white hover:bg-white/10'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <motion.div
                animate={{
                  rotate: notifications > 0 ? [0, -10, 10, -10, 0] : 0
                }}
                transition={{
                  duration: 0.5,
                  repeat: notifications > 0 ? Infinity : 0,
                  repeatDelay: 3
                }}
              >
                <Bell className="w-5 h-5" />
              </motion.div>
              {notifications > 0 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg"
                >
                  <span className="text-xs text-white font-bold">{notifications}</span>
                </motion.div>
              )}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-xl transition-all duration-200 ${
                darkMode
                  ? 'text-white hover:bg-white/10'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <motion.div
                animate={{ rotate: darkMode ? 0 : 180 }}
                transition={{ duration: 0.5 }}
              >
                {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </motion.div>
            </motion.button>

            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="w-10 h-10 bg-gradient-to-r from-green-400 via-blue-400 to-purple-400 rounded-full flex items-center justify-center shadow-lg cursor-pointer"
            >
              <span className="text-white font-bold text-sm">U</span>
            </motion.div>
          </div>
        </div>

        {/* Enhanced Quick Stats Bar - Mobile */}
        <div className="mt-4 grid grid-cols-4 gap-3">
          {quickStats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{
                delay: index * 0.1,
                type: "spring",
                stiffness: 200,
                damping: 15
              }}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className={`backdrop-blur-lg rounded-2xl p-3 text-center border transition-all duration-300 ${
                darkMode
                  ? 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                  : 'bg-white/80 border-gray-200 hover:bg-white hover:border-gray-300'
              }`}
            >
              <motion.div
                animate={{
                  rotate: [0, 5, -5, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: index * 0.5
                }}
              >
                <stat.icon className={`w-4 h-4 ${stat.color} mx-auto mb-2`} />
              </motion.div>
              <div className={`text-sm font-bold ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}>{stat.value}</div>
              <div className={`text-xs ${stat.color} font-semibold`}>{stat.change}</div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Enhanced Sidebar */}
      <AnimatePresence>
        {(sidebarOpen || (typeof window !== 'undefined' && window.innerWidth >= 1024)) && (
          <motion.div
            initial={{ x: -320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -320, opacity: 0 }}
            transition={{
              type: "spring",
              damping: 25,
              stiffness: 200,
              opacity: { duration: 0.2 }
            }}
            className={`fixed lg:static inset-y-0 left-0 z-40 w-80 backdrop-blur-2xl border-r lg:w-80 ${
              darkMode
                ? 'bg-black/95 border-gray-800'
                : 'bg-white/95 border-gray-200'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Enhanced Sidebar Header */}
            <div className={`p-6 border-b ${
              darkMode ? 'border-gray-800' : 'border-gray-200'
            }`}>
              <div className="flex items-center justify-between lg:justify-center">
                <div className="flex items-center space-x-4">
                  <motion.div
                    className={`w-14 h-14 bg-gradient-to-r ${getActiveGradient()} rounded-3xl flex items-center justify-center shadow-2xl relative overflow-hidden`}
                    whileHover={{ scale: 1.05, rotate: 5 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <motion.div
                      animate={{
                        rotate: [0, 360],
                        scale: [1, 1.2, 1]
                      }}
                      transition={{
                        rotate: { duration: 10, repeat: Infinity, ease: "linear" },
                        scale: { duration: 3, repeat: Infinity }
                      }}
                    >
                      <Sparkles className="w-8 h-8 text-white" />
                    </motion.div>
                    <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-50" />
                  </motion.div>
                  <div>
                    <motion.h1
                      className={`text-xl font-bold bg-gradient-to-r bg-clip-text text-transparent ${
                        darkMode
                          ? 'from-white via-purple-200 to-blue-200'
                          : 'from-gray-900 via-purple-700 to-blue-700'
                      }`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      KAIA YIELD AI
                    </motion.h1>
                    <p className={`text-sm ${
                      darkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      AI-Powered DeFi Platform
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                      <span className={`text-xs ${
                        darkMode ? 'text-gray-500' : 'text-gray-500'
                      }`}>
                        Live Data
                      </span>
                    </div>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setSidebarOpen(false)}
                  className={`lg:hidden p-2 rounded-xl transition-all duration-200 ${
                    darkMode
                      ? 'text-gray-400 hover:text-white hover:bg-white/10'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>

              {/* Enhanced User Status - Desktop */}
              <motion.div
                className={`hidden lg:block mt-6 p-5 rounded-2xl border backdrop-blur-lg ${
                  darkMode
                    ? 'bg-gradient-to-r from-white/5 to-white/10 border-white/10'
                    : 'bg-gradient-to-r from-gray-50 to-white border-gray-200'
                }`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                whileHover={{ scale: 1.02, y: -2 }}
              >
                <div className="flex items-center space-x-4">
                  <motion.div
                    className="w-12 h-12 bg-gradient-to-r from-green-400 via-blue-400 to-purple-400 rounded-full flex items-center justify-center shadow-lg relative"
                    whileHover={{ scale: 1.1, rotate: 10 }}
                  >
                    <span className="text-white font-bold text-lg">U</span>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
                  </motion.div>
                  <div className="flex-1">
                    <div className={`font-semibold ${
                      darkMode ? 'text-white' : 'text-gray-900'
                    }`}>Connected Wallet</div>
                    <div className={`text-xs flex items-center space-x-2 ${
                      darkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      <Crown className="w-3 h-3 text-yellow-400" />
                      <span>Level 8 • 1,547 pts</span>
                    </div>
                    <div className="flex items-center space-x-1 mt-1">
                      <div className="w-1 h-1 bg-green-400 rounded-full" />
                      <span className={`text-xs ${
                        darkMode ? 'text-gray-500' : 'text-gray-500'
                      }`}>
                        Online
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-center space-y-2">
                    <motion.div
                      className="relative"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Bell className={`w-5 h-5 ${
                        darkMode ? 'text-gray-400' : 'text-gray-600'
                      }`} />
                      {notifications > 0 && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute -top-2 -right-2 w-5 h-5 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg"
                        >
                          <span className="text-xs text-white font-bold">{notifications}</span>
                        </motion.div>
                      )}
                    </motion.div>
                    <div className="flex space-x-1">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setSoundEnabled(!soundEnabled)}
                        className={`p-1 rounded-lg transition-colors ${
                          darkMode
                            ? 'text-gray-400 hover:text-white hover:bg-white/10'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                        }`}
                      >
                        {soundEnabled ? <Volume2 className="w-3 h-3" /> : <VolumeX className="w-3 h-3" />}
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={toggleFullscreen}
                        className={`p-1 rounded-lg transition-colors ${
                          darkMode
                            ? 'text-gray-400 hover:text-white hover:bg-white/10'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                        }`}
                      >
                        {isFullscreen ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
                      </motion.button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Enhanced Navigation */}
            <div className="p-6 space-y-3">
              <div className={`text-xs font-semibold uppercase tracking-wider mb-4 ${
                darkMode ? 'text-gray-500' : 'text-gray-600'
              }`}>
                Navigation
              </div>
              {navigationItems.map((item, index) => (
                <motion.button
                  key={item.id}
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleTabChange(item.id)}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`w-full flex items-center space-x-4 p-4 rounded-2xl transition-all duration-300 relative overflow-hidden group ${
                    activeTab === item.id
                      ? `bg-gradient-to-r ${item.gradient} text-white shadow-xl`
                      : darkMode
                        ? 'text-gray-400 hover:text-white hover:bg-white/10'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  {/* Background animation */}
                  <motion.div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{
                      background: `linear-gradient(90deg, ${item.gradient.split(' ')[1]}, ${item.gradient.split(' ')[3]})`
                    }}
                    initial={{ x: '-100%' }}
                    whileHover={{ x: '0%' }}
                    transition={{ duration: 0.3 }}
                  />

                  <motion.div
                    className="relative z-10"
                    animate={{
                      rotate: activeTab === item.id ? [0, 5, -5, 0] : 0,
                      scale: activeTab === item.id ? [1, 1.1, 1] : 1
                    }}
                    transition={{
                      duration: 0.5,
                      repeat: activeTab === item.id ? Infinity : 0,
                      repeatDelay: 2
                    }}
                  >
                    <item.icon className="w-6 h-6" />
                  </motion.div>

                  <span className="font-semibold relative z-10">{item.label}</span>

                  {item.badge && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="ml-auto w-6 h-6 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg relative z-10"
                    >
                      <span className="text-xs text-white font-bold">{item.badge}</span>
                    </motion.div>
                  )}

                  {/* Keyboard shortcut hint */}
                  <div className={`ml-auto text-xs opacity-50 relative z-10 ${
                    activeTab === item.id ? 'text-white' : darkMode ? 'text-gray-500' : 'text-gray-400'
                  }`}>
                    ⌘{index + 1}
                  </div>
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
        {/* Enhanced Desktop Header */}
        <div className={`hidden lg:block backdrop-blur-xl border-b px-6 py-5 ${
          darkMode
            ? 'bg-black/50 border-gray-800'
            : 'bg-white/50 border-gray-200'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-4">
                <motion.div
                  className={`w-2 h-8 bg-gradient-to-b ${getActiveGradient()} rounded-full`}
                  animate={{ scaleY: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <div>
                  <motion.h2
                    className={`text-3xl font-bold ${
                      darkMode ? 'text-white' : 'text-gray-900'
                    }`}
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {navigationItems.find(item => item.id === activeTab)?.label}
                  </motion.h2>
                  <p className={`text-sm ${
                    darkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    {getCurrentTimeGreeting()} • {currentTime.toLocaleDateString()}
                  </p>
                </div>
              </div>

              <motion.div
                className={`flex items-center space-x-3 px-4 py-2 rounded-full border ${
                  darkMode
                    ? 'bg-white/5 border-white/10'
                    : 'bg-gray-50 border-gray-200'
                }`}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <Activity className="w-4 h-4 text-green-400" />
                <span className={`text-sm font-medium ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Live Data
                </span>
                <motion.div
                  className="w-2 h-2 bg-green-400 rounded-full"
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [1, 0.5, 1]
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity
                  }}
                />
              </motion.div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Enhanced Search */}
              <motion.div
                className="relative"
                whileFocus={{ scale: 1.02 }}
                initial={{ width: 200 }}
                whileFocus={{ width: 280 }}
              >
                <Search className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
                  darkMode ? 'text-gray-400' : 'text-gray-500'
                }`} />
                <input
                  type="text"
                  placeholder="Search strategies, users..."
                  className={`w-full pl-12 pr-4 py-3 rounded-2xl border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    darkMode
                      ? 'bg-white/5 border-gray-700 text-white placeholder-gray-400'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
                />
              </motion.div>

              {/* Refresh Button */}
              <motion.button
                whileHover={{ scale: 1.05, rotate: 180 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setIsLoading(true);
                  setTimeout(() => setIsLoading(false), 1000);
                }}
                className={`p-3 rounded-2xl transition-all duration-200 ${
                  darkMode
                    ? 'text-gray-400 hover:text-white hover:bg-white/10'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
              </motion.button>

              {/* Notifications */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`relative p-3 rounded-2xl transition-all duration-200 ${
                  darkMode
                    ? 'text-gray-400 hover:text-white hover:bg-white/10'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <motion.div
                  animate={{
                    rotate: notifications > 0 ? [0, -10, 10, -10, 0] : 0
                  }}
                  transition={{
                    duration: 0.5,
                    repeat: notifications > 0 ? Infinity : 0,
                    repeatDelay: 3
                  }}
                >
                  <Bell className="w-5 h-5" />
                </motion.div>
                {notifications > 0 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg"
                  >
                    <span className="text-xs text-white font-bold">{notifications}</span>
                  </motion.div>
                )}
              </motion.button>

              {/* User Avatar */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-10 h-10 bg-gradient-to-r from-green-400 via-blue-400 to-purple-400 rounded-full flex items-center justify-center shadow-lg cursor-pointer relative"
              >
                <span className="text-white font-bold">U</span>
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
              </motion.div>
            </div>
          </div>
        </div>

        {/* Enhanced Content Area */}
        <div className="flex-1 overflow-auto relative">
          {/* Loading Overlay */}
          <AnimatePresence>
            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={`absolute inset-0 z-50 flex items-center justify-center backdrop-blur-sm ${
                  darkMode ? 'bg-black/50' : 'bg-white/50'
                }`}
              >
                <motion.div
                  className={`p-6 rounded-2xl border shadow-xl ${
                    darkMode
                      ? 'bg-black/90 border-gray-800'
                      : 'bg-white/90 border-gray-200'
                  }`}
                  initial={{ scale: 0.8, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.8, y: 20 }}
                >
                  <div className="flex items-center space-x-4">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <Loader2 className="w-6 h-6 text-blue-500" />
                    </motion.div>
                    <div>
                      <h3 className={`font-semibold ${
                        darkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        Loading {navigationItems.find(item => item.id === activeTab)?.label}...
                      </h3>
                      <p className={`text-sm ${
                        darkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        Fetching latest data
                      </p>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -30, scale: 0.95 }}
              transition={{
                duration: 0.4,
                type: "spring",
                stiffness: 200,
                damping: 25
              }}
              className="h-full"
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Enhanced Mobile Bottom Navigation */}
      <div className={`lg:hidden fixed bottom-0 left-0 right-0 backdrop-blur-2xl border-t px-2 py-3 safe-area-pb z-40 ${
        darkMode
          ? 'bg-black/95 border-gray-800'
          : 'bg-white/95 border-gray-200'
      }`}>
        <div className="flex items-center justify-around">
          {navigationItems.map((item, index) => (
            <motion.button
              key={item.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => handleTabChange(item.id)}
              className={`relative flex flex-col items-center p-3 rounded-2xl transition-all duration-300 ${
                activeTab === item.id
                  ? 'text-white'
                  : darkMode
                    ? 'text-gray-500 hover:text-gray-300'
                    : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              {/* Background for active tab */}
              {activeTab === item.id && (
                <motion.div
                  layoutId="mobile-bg"
                  className={`absolute inset-0 bg-gradient-to-r ${item.gradient} rounded-2xl shadow-lg`}
                  transition={{ type: "spring", stiffness: 200, damping: 25 }}
                />
              )}

              <div className="relative z-10">
                <motion.div
                  animate={{
                    rotate: activeTab === item.id ? [0, 5, -5, 0] : 0,
                    scale: activeTab === item.id ? [1, 1.1, 1] : 1
                  }}
                  transition={{
                    duration: 0.5,
                    repeat: activeTab === item.id ? Infinity : 0,
                    repeatDelay: 2
                  }}
                >
                  <item.icon className="w-6 h-6" />
                </motion.div>
                {item.badge && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg"
                  >
                    <span className="text-xs text-white font-bold">{item.badge}</span>
                  </motion.div>
                )}
              </div>

              <span className="text-xs font-medium mt-1 truncate max-w-20 relative z-10">
                {item.label.split(' ')[0]}
              </span>

              {/* Active indicator */}
              {activeTab === item.id && (
                <motion.div
                  layoutId="mobile-indicator"
                  className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-white rounded-full shadow-lg"
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
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