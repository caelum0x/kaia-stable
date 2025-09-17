// =======================================================
// KAIA YIELD AI - LINE MINI DAPP WITH GAMIFIED USDT YIELD FARMING
// Real LINE LIFF integration with gamified yield farming
// =======================================================

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet,
  TrendingUp,
  Zap,
  Trophy,
  Users,
  Share2,
  Gift,
  Star,
  DollarSign,
  Target,
  Crown,
  Fire,
  Bell,
  MessageCircle,
  Copy,
  ExternalLink,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Plus,
  Minus,
  ArrowUpRight,
  Smartphone,
  QrCode,
  Camera,
  Heart,
  Send,
  Settings
} from 'lucide-react';
import { kaiaAPI, UserStats, UserMissionData, Strategy, YieldCalculation } from '../services/api';

// LINE LIFF SDK Integration
declare global {
  interface Window {
    liff: any;
  }
}

interface LIFFProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
  statusMessage?: string;
}

interface LIFFState {
  isLoggedIn: boolean;
  profile: LIFFProfile | null;
  accessToken: string | null;
  isInClient: boolean;
  os: 'ios' | 'android' | 'web';
  language: string;
}

interface WalletState {
  isConnected: boolean;
  address: string | null;
  usdtBalance: string;
  kaiaBalance: string;
  chainId: number;
}

interface YieldFarmingData {
  totalDeposited: number;
  totalEarnings: number;
  activeStrategies: number;
  dailyYield: number;
  bestStrategy: Strategy | null;
  recommendedAmount: number;
}

interface GameData {
  level: number;
  points: number;
  streak: number;
  nextMissionReward: number;
  leaderboardRank: number;
  socialBonus: number;
}

const LINEMiniDApp: React.FC = () => {
  // LIFF and Wallet States
  const [liffState, setLiffState] = useState<LIFFState>({
    isLoggedIn: false,
    profile: null,
    accessToken: null,
    isInClient: false,
    os: 'web',
    language: 'en'
  });

  const [walletState, setWalletState] = useState<WalletState>({
    isConnected: false,
    address: null,
    usdtBalance: '0.00',
    kaiaBalance: '0.00',
    chainId: 8217
  });

  // App States
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'farm' | 'game' | 'social' | 'profile'>('farm');

  // Data States
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [userMissions, setUserMissions] = useState<UserMissionData | null>(null);
  const [yieldData, setYieldData] = useState<YieldFarmingData>({
    totalDeposited: 0,
    totalEarnings: 0,
    activeStrategies: 0,
    dailyYield: 0,
    bestStrategy: null,
    recommendedAmount: 100
  });

  const [gameData, setGameData] = useState<GameData>({
    level: 1,
    points: 0,
    streak: 0,
    nextMissionReward: 50,
    leaderboardRank: 0,
    socialBonus: 0
  });

  // Form States
  const [depositAmount, setDepositAmount] = useState('100');
  const [selectedStrategy, setSelectedStrategy] = useState<Strategy | null>(null);
  const [yieldCalculation, setYieldCalculation] = useState<YieldCalculation | null>(null);
  const [shareMessage, setShareMessage] = useState('');

  // Initialize LIFF SDK
  const initializeLIFF = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      if (typeof window !== 'undefined' && window.liff) {
        await window.liff.init({ liffId: process.env.NEXT_PUBLIC_LIFF_ID || 'YOUR_LIFF_ID' });

        if (window.liff.isLoggedIn()) {
          const profile = await window.liff.getProfile();
          const accessToken = window.liff.getAccessToken();
          const context = window.liff.getContext();

          setLiffState({
            isLoggedIn: true,
            profile: {
              userId: profile.userId,
              displayName: profile.displayName,
              pictureUrl: profile.pictureUrl,
              statusMessage: profile.statusMessage
            },
            accessToken,
            isInClient: window.liff.isInClient(),
            os: context?.type || 'web',
            language: window.liff.getLanguage()
          });

          // Send welcome message
          await sendLINENotification('🎉 Welcome to KAIA YIELD AI! Start farming USDT with AI-powered strategies.');

        } else {
          await window.liff.login();
        }
      } else {
        // Fallback for development - mock LIFF state
        console.warn('LIFF SDK not available, using mock data');
        setLiffState({
          isLoggedIn: true,
          profile: {
            userId: 'mock_user_123',
            displayName: 'DeFi Farmer 🚜',
            pictureUrl: 'https://via.placeholder.com/150',
            statusMessage: 'Farming USDT with AI! 🤖💰'
          },
          accessToken: 'mock_token',
          isInClient: true,
          os: 'android',
          language: 'en'
        });
      }
    } catch (err) {
      console.error('LIFF initialization error:', err);
      setError('Failed to initialize LINE app. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Connect Kaia Wallet
  const connectWallet = async () => {
    setConnecting(true);
    setError(null);

    try {
      if (typeof window.ethereum !== 'undefined') {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });

        // Switch to Kaia network if needed
        if (chainId !== '0x2019') { // Kaia Mainnet
          try {
            await window.ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: '0x2019' }],
            });
          } catch (switchError: any) {
            if (switchError.code === 4902) {
              await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [{
                  chainId: '0x2019',
                  chainName: 'Kaia Mainnet',
                  nativeCurrency: {
                    name: 'KAIA',
                    symbol: 'KAIA',
                    decimals: 18,
                  },
                  rpcUrls: ['https://archive-en.node.kaia.io'],
                  blockExplorerUrls: ['https://kaiascope.com/'],
                }],
              });
            }
          }
        }

        // Get balances (mock for now)
        setWalletState({
          isConnected: true,
          address: accounts[0],
          usdtBalance: '1,247.58',
          kaiaBalance: '523.41',
          chainId: 8217
        });

        // Send success notification
        await sendLINENotification('✅ Wallet connected successfully! Ready to start farming.');

      } else {
        throw new Error('No Web3 wallet found');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to connect wallet');
    } finally {
      setConnecting(false);
    }
  };

  // Fetch user data
  const fetchUserData = async () => {
    if (!walletState.address) return;

    try {
      const [stats, missions, strategiesData] = await Promise.all([
        kaiaAPI.game.getUserStats(walletState.address),
        kaiaAPI.game.getUserMissions(walletState.address),
        kaiaAPI.strategies.getAllStrategies()
      ]);

      setUserStats(stats);
      setUserMissions(missions);
      setStrategies(strategiesData);

      // Update game data
      setGameData({
        level: stats.gaming.level,
        points: stats.gaming.points,
        streak: stats.gaming.streak,
        nextMissionReward: missions.missions[0]?.reward.points || 50,
        leaderboardRank: stats.ranking || 0,
        socialBonus: stats.gaming.hasSocialBonus ? 20 : 0
      });

      // Update yield data
      setYieldData({
        totalDeposited: parseFloat(stats.performance.totalDeposited.toString()),
        totalEarnings: parseFloat(stats.performance.totalRewards.toString()),
        activeStrategies: stats.performance.successfulStrategies,
        dailyYield: parseFloat(stats.performance.totalRewards.toString()) * 0.001, // Mock daily calculation
        bestStrategy: strategiesData[0] || null,
        recommendedAmount: 100
      });

    } catch (err) {
      console.error('Error fetching user data:', err);
    }
  };

  // Calculate yield projections
  const calculateYield = async () => {
    if (!selectedStrategy || !depositAmount) return;

    try {
      const calculation = await kaiaAPI.yield.calculateYield(
        parseFloat(depositAmount),
        selectedStrategy.id,
        30
      );
      setYieldCalculation(calculation);
    } catch (err) {
      console.error('Error calculating yield:', err);
    }
  };

  // Deposit USDT
  const depositUSDT = async () => {
    if (!walletState.address || !selectedStrategy || !depositAmount) return;

    try {
      setLoading(true);

      // Mock transaction hash for demo
      const mockTxHash = '0x' + Math.random().toString(16).substring(2, 66);

      await kaiaAPI.yield.recordDeposit(
        walletState.address,
        selectedStrategy.id,
        depositAmount,
        mockTxHash
      );

      await sendLINENotification(
        `🎉 Successfully deposited ${depositAmount} USDT in ${selectedStrategy.name}! ` +
        `Estimated daily earnings: $${(parseFloat(depositAmount) * selectedStrategy.apy / 100 / 365).toFixed(2)}`
      );

      // Refresh data
      await fetchUserData();
      setDepositAmount('100');

    } catch (err: any) {
      setError(err.message || 'Failed to deposit USDT');
    } finally {
      setLoading(false);
    }
  };

  // Send LINE notification
  const sendLINENotification = async (message: string) => {
    if (!liffState.isLoggedIn || !liffState.isInClient) return;

    try {
      if (window.liff && window.liff.sendMessages) {
        await window.liff.sendMessages([{
          type: 'text',
          text: `🤖 KAIA YIELD AI\n\n${message}`
        }]);
      }
    } catch (err) {
      console.error('Failed to send LINE message:', err);
    }
  };

  // Share strategy
  const shareStrategy = async () => {
    if (!liffState.isLoggedIn || !selectedStrategy) return;

    try {
      const message = shareMessage ||
        `🚀 I'm earning ${selectedStrategy.apy}% APY on KAIA YIELD AI!\n\n` +
        `Strategy: ${selectedStrategy.name}\n` +
        `Join me and start farming USDT with AI optimization!\n\n` +
        `${window.location.origin}`;

      if (window.liff && window.liff.shareTargetPicker) {
        await window.liff.shareTargetPicker([{
          type: 'text',
          text: message
        }]);
      }

      await sendLINENotification('📤 Strategy shared successfully!');
      setShareMessage('');

    } catch (err) {
      console.error('Failed to share strategy:', err);
    }
  };

  // Claim mission reward
  const claimMissionReward = async (missionId: number) => {
    if (!walletState.address) return;

    try {
      await kaiaAPI.game.claimReward(walletState.address, missionId);
      await sendLINENotification(`🎁 Mission completed! You earned ${gameData.nextMissionReward} points!`);
      await fetchUserData();
    } catch (err) {
      console.error('Failed to claim reward:', err);
    }
  };

  // Effects
  useEffect(() => {
    initializeLIFF();
  }, [initializeLIFF]);

  useEffect(() => {
    if (walletState.address) {
      fetchUserData();
    }
  }, [walletState.address]);

  useEffect(() => {
    if (selectedStrategy && depositAmount) {
      calculateYield();
    }
  }, [selectedStrategy, depositAmount]);

  // Loading screen
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-500 via-blue-500 to-purple-600 flex items-center justify-center">
        <motion.div className="text-center text-white">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-white border-t-transparent rounded-full mx-auto mb-4"
          />
          <div className="text-xl font-bold mb-2">🤖 Initializing KAIA YIELD AI</div>
          <div className="text-sm opacity-80">Connecting to LINE platform...</div>
        </motion.div>
      </div>
    );
  }

  // Login screen
  if (!liffState.isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-500 via-blue-500 to-purple-600 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20 text-center text-white max-w-md w-full"
        >
          <div className="text-6xl mb-6">🤖</div>
          <h1 className="text-3xl font-bold mb-4 bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
            KAIA YIELD AI
          </h1>
          <p className="text-white/80 mb-6">
            AI-Powered USDT Yield Farming with Gamified Rewards on Kaia Network
          </p>
          <div className="text-center mb-6">
            <div className="text-sm text-white/60 mb-4">Available on LINE Mini dApp</div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={initializeLIFF}
              className="w-full bg-gradient-to-r from-green-500 to-blue-500 text-white py-4 px-6 rounded-xl font-bold text-lg flex items-center justify-center space-x-2 hover:shadow-lg transition-all duration-200"
            >
              <Smartphone className="w-6 h-6" />
              <span>Open in LINE</span>
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-500 via-blue-500 to-purple-600">
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-lg border-b border-white/10 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">KAIA YIELD AI</h1>
                <p className="text-xs text-gray-200">
                  Level {gameData.level} • {gameData.points} pts
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {/* Notifications */}
              <motion.div
                whileTap={{ scale: 0.95 }}
                className="relative p-2 bg-white/10 rounded-lg"
              >
                <Bell className="w-5 h-5 text-white" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
              </motion.div>

              {/* Profile */}
              <div className="flex items-center space-x-2">
                {liffState.profile?.pictureUrl ? (
                  <img
                    src={liffState.profile.pictureUrl}
                    alt="Profile"
                    className="w-8 h-8 rounded-full border-2 border-white/20"
                  />
                ) : (
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-white">
                      {liffState.profile?.displayName?.charAt(0) || 'U'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-black/10 backdrop-blur-sm border-b border-white/10">
        <div className="container mx-auto px-4">
          <div className="flex space-x-1">
            {[
              { id: 'farm', label: 'Farm', icon: TrendingUp },
              { id: 'game', label: 'Game', icon: Trophy },
              { id: 'social', label: 'Social', icon: Users },
              { id: 'profile', label: 'Profile', icon: Wallet }
            ].map(tab => (
              <motion.button
                key={tab.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 flex items-center justify-center space-x-1 py-3 px-2 font-semibold transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'text-white border-b-2 border-yellow-400'
                    : 'text-white/60 hover:text-white/80'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span className="text-sm">{tab.label}</span>
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-4 space-y-4">
        <AnimatePresence mode="wait">
          {/* Farm Tab */}
          {activeTab === 'farm' && (
            <motion.div
              key="farm"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {/* Wallet Connection */}
              {!walletState.isConnected ? (
                <div className="bg-black/30 backdrop-blur-lg rounded-2xl p-6 border border-white/10 text-center">
                  <div className="text-6xl mb-4">👛</div>
                  <h3 className="text-xl font-bold text-white mb-2">Connect Your Wallet</h3>
                  <p className="text-gray-300 mb-6">Connect your Kaia wallet to start farming USDT</p>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={connectWallet}
                    disabled={connecting}
                    className="bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3 px-8 rounded-xl font-bold flex items-center justify-center space-x-2 mx-auto"
                  >
                    {connecting ? (
                      <RefreshCw className="w-5 h-5 animate-spin" />
                    ) : (
                      <Wallet className="w-5 h-5" />
                    )}
                    <span>{connecting ? 'Connecting...' : 'Connect Wallet'}</span>
                  </motion.button>
                </div>
              ) : (
                <>
                  {/* Portfolio Overview */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-green-500/20 border border-green-500/30 rounded-xl p-4">
                      <div className="text-green-400 text-xs mb-1">Total Deposited</div>
                      <div className="text-white font-bold text-lg">${yieldData.totalDeposited.toFixed(2)}</div>
                    </div>

                    <div className="bg-blue-500/20 border border-blue-500/30 rounded-xl p-4">
                      <div className="text-blue-400 text-xs mb-1">Total Earnings</div>
                      <div className="text-white font-bold text-lg">${yieldData.totalEarnings.toFixed(2)}</div>
                    </div>
                  </div>

                  {/* Strategy Selection */}
                  <div className="bg-black/30 backdrop-blur-lg rounded-2xl p-4 border border-white/10">
                    <h3 className="text-white font-bold mb-3 flex items-center">
                      <Target className="w-5 h-5 mr-2 text-yellow-400" />
                      Select Strategy
                    </h3>

                    <div className="space-y-2 mb-4">
                      {strategies.slice(0, 3).map(strategy => (
                        <motion.div
                          key={strategy.id}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setSelectedStrategy(strategy)}
                          className={`p-3 rounded-lg border cursor-pointer transition-all ${
                            selectedStrategy?.id === strategy.id
                              ? 'border-yellow-400 bg-yellow-400/10'
                              : 'border-white/20 bg-white/5'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-white font-semibold text-sm">{strategy.name}</div>
                              <div className="text-gray-300 text-xs">Risk Level: {strategy.riskLevel}/10</div>
                            </div>
                            <div className="text-right">
                              <div className="text-green-400 font-bold">{(strategy.apy / 100).toFixed(1)}%</div>
                              <div className="text-gray-400 text-xs">APY</div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    {/* Amount Input */}
                    <div className="space-y-3">
                      <div>
                        <label className="text-white text-sm mb-2 block">Deposit Amount (USDT)</label>
                        <div className="relative">
                          <input
                            type="number"
                            value={depositAmount}
                            onChange={(e) => setDepositAmount(e.target.value)}
                            className="w-full bg-black/30 border border-white/20 rounded-lg p-3 text-white placeholder-gray-400"
                            placeholder="100.00"
                          />
                          <div className="absolute right-3 top-3 text-gray-400 text-sm">USDT</div>
                        </div>
                      </div>

                      {/* Quick Amount Buttons */}
                      <div className="flex space-x-2">
                        {['50', '100', '500', '1000'].map(amount => (
                          <motion.button
                            key={amount}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setDepositAmount(amount)}
                            className="flex-1 bg-white/10 border border-white/20 text-white py-2 px-3 rounded-lg text-sm font-semibold hover:bg-white/20 transition-colors"
                          >
                            ${amount}
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    {/* Yield Calculation */}
                    {yieldCalculation && (
                      <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                        <div className="text-yellow-400 text-sm font-semibold mb-2">💰 Projected Earnings</div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <div className="text-gray-300">Daily:</div>
                            <div className="text-white font-bold">${yieldCalculation.projections.dailyEarnings}</div>
                          </div>
                          <div>
                            <div className="text-gray-300">Monthly:</div>
                            <div className="text-white font-bold">${yieldCalculation.projections.compoundedRewards}</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Deposit Button */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={depositUSDT}
                      disabled={!selectedStrategy || !depositAmount || loading}
                      className="w-full mt-4 bg-gradient-to-r from-green-500 to-blue-500 text-white py-3 px-4 rounded-xl font-bold hover:shadow-lg transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <RefreshCw className="w-5 h-5 animate-spin" />
                      ) : (
                        <DollarSign className="w-5 h-5" />
                      )}
                      <span>{loading ? 'Processing...' : 'Start Farming'}</span>
                    </motion.button>
                  </div>
                </>
              )}
            </motion.div>
          )}

          {/* Game Tab */}
          {activeTab === 'game' && (
            <motion.div
              key="game"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {/* Game Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-purple-500/20 border border-purple-500/30 rounded-xl p-4">
                  <div className="flex items-center space-x-2">
                    <Crown className="w-5 h-5 text-yellow-400" />
                    <div>
                      <div className="text-yellow-400 text-xs">Level</div>
                      <div className="text-white font-bold text-lg">{gameData.level}</div>
                    </div>
                  </div>
                </div>

                <div className="bg-orange-500/20 border border-orange-500/30 rounded-xl p-4">
                  <div className="flex items-center space-x-2">
                    <Fire className="w-5 h-5 text-orange-400" />
                    <div>
                      <div className="text-orange-400 text-xs">Streak</div>
                      <div className="text-white font-bold text-lg">{gameData.streak} days</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Active Missions */}
              <div className="bg-black/30 backdrop-blur-lg rounded-2xl p-4 border border-white/10">
                <h3 className="text-white font-bold mb-3 flex items-center">
                  <Target className="w-5 h-5 mr-2 text-blue-400" />
                  Active Missions
                </h3>

                <div className="space-y-2">
                  {userMissions?.missions.slice(0, 3).map(mission => (
                    <div key={mission.id} className="p-3 bg-white/5 rounded-lg border border-white/10">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-white font-semibold text-sm">{mission.name}</div>
                        <div className="text-yellow-400 font-bold text-sm">{mission.reward.points} pts</div>
                      </div>

                      <div className="text-gray-300 text-xs mb-2">{mission.description}</div>

                      <div className="flex items-center justify-between">
                        <div className="text-xs text-gray-400">
                          {mission.progressFormatted || `${mission.progress}/${mission.target}`}
                        </div>

                        {mission.isCompleted && !mission.isClaimed ? (
                          <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => claimMissionReward(mission.missionId)}
                            className="bg-green-500 text-white px-3 py-1 rounded-lg text-xs font-bold"
                          >
                            Claim
                          </motion.button>
                        ) : mission.isClaimed ? (
                          <div className="text-green-400 text-xs flex items-center">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Claimed
                          </div>
                        ) : (
                          <div className="text-blue-400 text-xs">In Progress</div>
                        )}
                      </div>
                    </div>
                  )) || []}
                </div>
              </div>

              {/* Leaderboard Preview */}
              <div className="bg-black/30 backdrop-blur-lg rounded-2xl p-4 border border-white/10">
                <h3 className="text-white font-bold mb-3 flex items-center">
                  <Trophy className="w-5 h-5 mr-2 text-yellow-400" />
                  Leaderboard
                </h3>

                <div className="text-center">
                  <div className="text-2xl mb-2">🏆</div>
                  <div className="text-white font-bold">Your Rank: #{gameData.leaderboardRank || 'Unranked'}</div>
                  <div className="text-gray-300 text-sm">Keep farming to climb higher!</div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Social Tab */}
          {activeTab === 'social' && (
            <motion.div
              key="social"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {/* Social Stats */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-green-500/20 border border-green-500/30 rounded-xl p-3 text-center">
                  <div className="text-green-400 text-xs mb-1">Friends</div>
                  <div className="text-white font-bold">12</div>
                </div>

                <div className="bg-blue-500/20 border border-blue-500/30 rounded-xl p-3 text-center">
                  <div className="text-blue-400 text-xs mb-1">Shared</div>
                  <div className="text-white font-bold">5</div>
                </div>

                <div className="bg-purple-500/20 border border-purple-500/30 rounded-xl p-3 text-center">
                  <div className="text-purple-400 text-xs mb-1">Bonus</div>
                  <div className="text-white font-bold">+{gameData.socialBonus}%</div>
                </div>
              </div>

              {/* Share Strategy */}
              <div className="bg-black/30 backdrop-blur-lg rounded-2xl p-4 border border-white/10">
                <h3 className="text-white font-bold mb-3 flex items-center">
                  <Share2 className="w-5 h-5 mr-2 text-green-400" />
                  Share Your Success
                </h3>

                <div className="space-y-3">
                  <textarea
                    value={shareMessage}
                    onChange={(e) => setShareMessage(e.target.value)}
                    placeholder="Add a personal message..."
                    className="w-full bg-black/30 border border-white/20 rounded-lg p-3 text-white placeholder-gray-400 text-sm resize-none"
                    rows={3}
                  />

                  <div className="grid grid-cols-2 gap-2">
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={shareStrategy}
                      className="bg-green-500 text-white py-2 px-4 rounded-lg text-sm font-bold flex items-center justify-center space-x-2"
                    >
                      <Send className="w-4 h-4" />
                      <span>Share to LINE</span>
                    </motion.button>

                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => sendLINENotification('🚀 Join me on KAIA YIELD AI for amazing DeFi returns!')}
                      className="bg-blue-500 text-white py-2 px-4 rounded-lg text-sm font-bold flex items-center justify-center space-x-2"
                    >
                      <Heart className="w-4 h-4" />
                      <span>Invite Friends</span>
                    </motion.button>
                  </div>
                </div>
              </div>

              {/* Quick Share Actions */}
              <div className="space-y-2">
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => sendLINENotification(`💰 I just earned $${yieldData.dailyYield.toFixed(2)} today with KAIA YIELD AI!`)}
                  className="w-full bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 py-3 px-4 rounded-lg font-semibold flex items-center justify-center space-x-2"
                >
                  <Star className="w-4 h-4" />
                  <span>Share Daily Earnings</span>
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => sendLINENotification(`🏆 I reached Level ${gameData.level} on KAIA YIELD AI! Challenge accepted?`)}
                  className="w-full bg-purple-500/20 border border-purple-500/30 text-purple-400 py-3 px-4 rounded-lg font-semibold flex items-center justify-center space-x-2"
                >
                  <Crown className="w-4 h-4" />
                  <span>Challenge Friends</span>
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {/* Profile Info */}
              <div className="bg-black/30 backdrop-blur-lg rounded-2xl p-4 border border-white/10">
                <div className="flex items-center space-x-4 mb-4">
                  {liffState.profile?.pictureUrl ? (
                    <img
                      src={liffState.profile.pictureUrl}
                      alt="Profile"
                      className="w-16 h-16 rounded-full border-2 border-white/20"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                      {liffState.profile?.displayName?.charAt(0) || 'U'}
                    </div>
                  )}

                  <div>
                    <h3 className="text-white font-bold text-lg">{liffState.profile?.displayName}</h3>
                    <p className="text-gray-300 text-sm">{liffState.profile?.statusMessage}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <div className="px-2 py-1 bg-yellow-500/20 border border-yellow-500/30 rounded text-yellow-400 text-xs font-bold">
                        Level {gameData.level}
                      </div>
                      <div className="px-2 py-1 bg-blue-500/20 border border-blue-500/30 rounded text-blue-400 text-xs font-bold">
                        {gameData.points} pts
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Wallet Info */}
              {walletState.isConnected && (
                <div className="bg-black/30 backdrop-blur-lg rounded-2xl p-4 border border-white/10">
                  <h3 className="text-white font-bold mb-3 flex items-center">
                    <Wallet className="w-5 h-5 mr-2 text-blue-400" />
                    Wallet
                  </h3>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <span className="text-gray-300 text-sm">Address</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-white font-mono text-sm">
                          {`${walletState.address?.slice(0, 6)}...${walletState.address?.slice(-4)}`}
                        </span>
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          onClick={() => navigator.clipboard.writeText(walletState.address || '')}
                          className="text-blue-400"
                        >
                          <Copy className="w-4 h-4" />
                        </motion.button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                        <div className="text-green-400 text-xs mb-1">USDT Balance</div>
                        <div className="text-white font-bold">{walletState.usdtBalance}</div>
                      </div>

                      <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                        <div className="text-blue-400 text-xs mb-1">KAIA Balance</div>
                        <div className="text-white font-bold">{walletState.kaiaBalance}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Performance Summary */}
              <div className="bg-black/30 backdrop-blur-lg rounded-2xl p-4 border border-white/10">
                <h3 className="text-white font-bold mb-3 flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2 text-green-400" />
                  Performance
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400">${yieldData.totalEarnings.toFixed(2)}</div>
                    <div className="text-gray-300 text-xs">Total Earnings</div>
                  </div>

                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-400">{yieldData.activeStrategies}</div>
                    <div className="text-gray-300 text-xs">Active Strategies</div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error Display */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-500/20 border border-red-500/30 rounded-xl p-4"
          >
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <div>
                <div className="text-red-300 font-semibold text-sm">Error</div>
                <div className="text-red-200 text-xs">{error}</div>
              </div>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setError(null)}
                className="ml-auto text-red-400 hover:text-red-300"
              >
                ×
              </motion.button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default LINEMiniDApp;