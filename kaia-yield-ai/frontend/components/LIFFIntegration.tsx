import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet,
  User,
  Share2,
  Users,
  QrCode,
  Smartphone,
  Check,
  AlertCircle,
  Copy,
  ExternalLink,
  Gift,
  Crown,
  Star,
  Zap,
  Shield,
  Settings,
  LogOut,
  RefreshCw,
  Heart,
  MessageCircle,
  Send,
  Plus,
  Bell,
  Camera
} from 'lucide-react';

// LIFF SDK types (simplified)
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
  balance: string;
  chainId: number;
  provider: any;
}

const LIFFIntegration: React.FC = () => {
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
    balance: '0.0',
    chainId: 8217, // Kaia Mainnet
    provider: null
  });

  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [shareMessage, setShareMessage] = useState('');
  const [notifications, setNotifications] = useState<any[]>([]);

  // Mock LIFF initialization
  const initializeLIFF = useCallback(async () => {
    setLoading(true);
    try {
      // Simulate LIFF initialization
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock LIFF state for development
      const mockProfile: LIFFProfile = {
        userId: 'U1234567890abcdef',
        displayName: 'Crypto Enthusiast',
        pictureUrl: 'https://via.placeholder.com/150',
        statusMessage: 'DeFi to the moon! 🚀'
      };

      setLiffState({
        isLoggedIn: true,
        profile: mockProfile,
        accessToken: 'mock-access-token',
        isInClient: true,
        os: 'android',
        language: 'en'
      });

      // Load notifications
      setNotifications([
        {
          id: 1,
          type: 'reward',
          title: 'Mission Complete!',
          message: 'You earned 100 points for your first deposit',
          timestamp: Date.now() - 3600000,
          icon: '🎉'
        },
        {
          id: 2,
          type: 'social',
          title: 'New Follower',
          message: 'CryptoMaster started following your strategy',
          timestamp: Date.now() - 7200000,
          icon: '👥'
        }
      ]);

    } catch (err) {
      setError('Failed to initialize LINE LIFF');
      console.error('LIFF initialization error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Connect wallet
  const connectWallet = async () => {
    setConnecting(true);
    setError(null);

    try {
      // Simulate wallet connection
      await new Promise(resolve => setTimeout(resolve, 2000));

      setWalletState({
        isConnected: true,
        address: '0x1234567890123456789012345678901234567890',
        balance: '1.2547',
        chainId: 8217,
        provider: {} // Mock provider
      });

    } catch (err) {
      setError('Failed to connect wallet');
      console.error('Wallet connection error:', err);
    } finally {
      setConnecting(false);
    }
  };

  // Disconnect wallet
  const disconnectWallet = () => {
    setWalletState({
      isConnected: false,
      address: null,
      balance: '0.0',
      chainId: 8217,
      provider: null
    });
  };

  // Share strategy
  const shareStrategy = async () => {
    if (!liffState.isLoggedIn || !liffState.isInClient) {
      setError('Please open in LINE app to share');
      return;
    }

    try {
      // Mock sharing functionality
      const message = shareMessage || `🚀 Check out my DeFi strategy on KAIA YIELD AI! I'm earning amazing returns with AI-powered yield optimization. Join me: ${window.location.origin}`;

      // In real implementation, this would use liff.shareTargetPicker()
      console.log('Sharing message:', message);

      // Show success message
      setShareMessage('');
      alert('Strategy shared successfully!');

    } catch (err) {
      setError('Failed to share strategy');
      console.error('Share error:', err);
    }
  };

  // Send message to LINE
  const sendLINEMessage = async (text: string) => {
    if (!liffState.isLoggedIn) return;

    try {
      // In real implementation, this would use liff.sendMessages()
      console.log('Sending LINE message:', text);
      alert('Message sent to LINE chat!');
    } catch (err) {
      console.error('LINE message error:', err);
    }
  };

  // Login with LINE
  const loginWithLINE = async () => {
    try {
      // In real implementation, this would use liff.login()
      await initializeLIFF();
    } catch (err) {
      setError('Failed to login with LINE');
    }
  };

  // Logout
  const logout = () => {
    setLiffState({
      isLoggedIn: false,
      profile: null,
      accessToken: null,
      isInClient: false,
      os: 'web',
      language: 'en'
    });
    disconnectWallet();
  };

  // Copy address
  const copyAddress = () => {
    if (walletState.address) {
      navigator.clipboard.writeText(walletState.address);
      alert('Address copied to clipboard!');
    }
  };

  useEffect(() => {
    initializeLIFF();
  }, [initializeLIFF]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-600 via-blue-600 to-purple-600 flex items-center justify-center">
        <motion.div className="text-center text-white">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-white border-t-transparent rounded-full mx-auto mb-4"
          />
          <div className="text-xl font-bold mb-2">Connecting to LINE...</div>
          <div className="text-sm opacity-80">Initializing LIFF SDK</div>
        </motion.div>
      </div>
    );
  }

  if (!liffState.isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-600 via-blue-600 to-purple-600 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20 text-center text-white max-w-md w-full"
        >
          <div className="text-6xl mb-6">📱</div>
          <h1 className="text-2xl font-bold mb-4">Welcome to KAIA YIELD AI</h1>
          <p className="text-white/80 mb-6">
            Connect with LINE to access AI-powered yield optimization and social trading features
          </p>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={loginWithLINE}
            className="w-full bg-gradient-to-r from-green-500 to-blue-500 text-white py-4 px-6 rounded-xl font-bold text-lg flex items-center justify-center space-x-2 hover:shadow-lg transition-all duration-200"
          >
            <User className="w-6 h-6" />
            <span>Login with LINE</span>
          </motion.button>

          {error && (
            <div className="mt-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 text-sm">
              {error}
            </div>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-600 via-blue-600 to-purple-600">
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-lg border-b border-white/10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-blue-400 rounded-xl flex items-center justify-center">
                <Smartphone className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">LINE Integration</h1>
                <p className="text-gray-200 text-sm">Connected & Ready</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <div className="relative">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowProfile(!showProfile)}
                  className="relative"
                >
                  {liffState.profile?.pictureUrl ? (
                    <img
                      src={liffState.profile.pictureUrl}
                      alt="Profile"
                      className="w-10 h-10 rounded-full border-2 border-white/20"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-white" />
                    </div>
                  )}
                  {notifications.length > 0 && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                      <span className="text-xs text-white font-bold">{notifications.length}</span>
                    </div>
                  )}
                </motion.button>

                <AnimatePresence>
                  {showProfile && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                      className="absolute right-0 top-12 w-80 bg-black/90 backdrop-blur-lg rounded-2xl border border-white/20 p-4 z-50"
                    >
                      <div className="text-center mb-4">
                        {liffState.profile?.pictureUrl && (
                          <img
                            src={liffState.profile.pictureUrl}
                            alt="Profile"
                            className="w-16 h-16 rounded-full mx-auto mb-3 border-2 border-white/20"
                          />
                        )}
                        <h3 className="text-white font-bold">{liffState.profile?.displayName}</h3>
                        <p className="text-gray-300 text-sm">{liffState.profile?.statusMessage}</p>
                      </div>

                      <div className="space-y-2 mb-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-400">Platform:</span>
                          <span className="text-white capitalize">{liffState.os}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-400">Language:</span>
                          <span className="text-white uppercase">{liffState.language}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-400">Client:</span>
                          <span className="text-white">{liffState.isInClient ? 'LINE App' : 'Browser'}</span>
                        </div>
                      </div>

                      {/* Notifications */}
                      <div className="mb-4">
                        <h4 className="text-white font-semibold mb-2 flex items-center">
                          <Bell className="w-4 h-4 mr-1" />
                          Notifications
                        </h4>
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                          {notifications.map(notif => (
                            <div key={notif.id} className="bg-white/10 rounded-lg p-2">
                              <div className="flex items-start space-x-2">
                                <span className="text-lg">{notif.icon}</span>
                                <div className="flex-1">
                                  <div className="text-white text-sm font-medium">{notif.title}</div>
                                  <div className="text-gray-300 text-xs">{notif.message}</div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={logout}
                        className="w-full bg-red-500/20 border border-red-500/30 text-red-300 py-2 px-4 rounded-lg font-semibold flex items-center justify-center space-x-2 hover:bg-red-500/30 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Logout</span>
                      </motion.button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Wallet Connection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-black/30 backdrop-blur-lg rounded-2xl p-6 border border-white/10"
        >
          <h2 className="text-xl font-bold text-white mb-4 flex items-center">
            <Wallet className="w-6 h-6 mr-2 text-blue-400" />
            Kaia Wallet Connection
          </h2>

          {!walletState.isConnected ? (
            <div className="text-center">
              <div className="text-6xl mb-4">👛</div>
              <p className="text-gray-300 mb-6">Connect your Kaia wallet to start earning yield</p>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={connectWallet}
                disabled={connecting}
                className="bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3 px-8 rounded-xl font-bold text-lg flex items-center justify-center space-x-2 hover:shadow-lg transition-all duration-200 mx-auto"
              >
                {connecting ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Connecting...</span>
                  </>
                ) : (
                  <>
                    <Wallet className="w-5 h-5" />
                    <span>Connect Wallet</span>
                  </>
                )}
              </motion.button>
            </div>
          ) : (
            <div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
                <div className="bg-green-500/20 border border-green-500/30 rounded-xl p-4">
                  <div className="text-green-400 text-sm mb-1">Wallet Address</div>
                  <div className="flex items-center space-x-2">
                    <div className="text-white font-mono text-sm">
                      {`${walletState.address?.slice(0, 6)}...${walletState.address?.slice(-4)}`}
                    </div>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={copyAddress}
                      className="text-green-400 hover:text-green-300"
                    >
                      <Copy className="w-4 h-4" />
                    </motion.button>
                  </div>
                </div>

                <div className="bg-blue-500/20 border border-blue-500/30 rounded-xl p-4">
                  <div className="text-blue-400 text-sm mb-1">KAIA Balance</div>
                  <div className="text-white font-bold text-lg">{walletState.balance} KAIA</div>
                </div>

                <div className="bg-purple-500/20 border border-purple-500/30 rounded-xl p-4">
                  <div className="text-purple-400 text-sm mb-1">Network</div>
                  <div className="flex items-center text-white">
                    <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                    Kaia Mainnet
                  </div>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={disconnectWallet}
                className="bg-red-500/20 border border-red-500/30 text-red-300 py-2 px-4 rounded-lg font-semibold hover:bg-red-500/30 transition-colors"
              >
                Disconnect Wallet
              </motion.button>
            </div>
          )}
        </motion.div>

        {/* Social Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-black/30 backdrop-blur-lg rounded-2xl p-6 border border-white/10"
        >
          <h2 className="text-xl font-bold text-white mb-4 flex items-center">
            <Share2 className="w-6 h-6 mr-2 text-green-400" />
            Social Features
          </h2>

          <div className="space-y-4">
            {/* Share Strategy */}
            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
              <h3 className="text-green-400 font-semibold mb-3 flex items-center">
                <Heart className="w-4 h-4 mr-1" />
                Share Your Strategy
              </h3>

              <div className="space-y-3">
                <textarea
                  value={shareMessage}
                  onChange={(e) => setShareMessage(e.target.value)}
                  placeholder="Add a personal message to share with your LINE friends..."
                  className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-white placeholder-gray-400 resize-none"
                  rows={3}
                />

                <div className="flex space-x-2">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={shareStrategy}
                    className="flex-1 bg-green-500 text-white py-2 px-4 rounded-lg font-semibold hover:bg-green-600 transition-colors flex items-center justify-center space-x-2"
                  >
                    <Send className="w-4 h-4" />
                    <span>Share to LINE</span>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => sendLINEMessage('🚀 Just earned amazing returns on KAIA YIELD AI!')}
                    className="bg-blue-500 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-600 transition-colors flex items-center space-x-1"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Quick Share</span>
                  </motion.button>
                </div>
              </div>
            </div>

            {/* Social Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white/10 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-blue-400">12</div>
                <div className="text-sm text-gray-300">Friends Invited</div>
              </div>

              <div className="bg-white/10 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-green-400">5</div>
                <div className="text-sm text-gray-300">Strategies Shared</div>
              </div>

              <div className="bg-white/10 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-purple-400">156</div>
                <div className="text-sm text-gray-300">Social Points</div>
              </div>

              <div className="bg-white/10 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-yellow-400">+20%</div>
                <div className="text-sm text-gray-300">Social Bonus</div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => sendLINEMessage('💰 Check out my DeFi earnings on KAIA YIELD AI!')}
                className="bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 py-3 px-4 rounded-lg font-semibold hover:bg-yellow-500/30 transition-colors flex items-center justify-center space-x-2"
              >
                <Star className="w-4 h-4" />
                <span>Share Earnings</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => sendLINEMessage('🎮 Join me in the KAIA YIELD AI leaderboard challenge!')}
                className="bg-purple-500/20 border border-purple-500/30 text-purple-400 py-3 px-4 rounded-lg font-semibold hover:bg-purple-500/30 transition-colors flex items-center justify-center space-x-2"
              >
                <Crown className="w-4 h-4" />
                <span>Challenge Friends</span>
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* LIFF Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-black/30 backdrop-blur-lg rounded-2xl p-6 border border-white/10"
        >
          <h2 className="text-xl font-bold text-white mb-4 flex items-center">
            <Zap className="w-6 h-6 mr-2 text-yellow-400" />
            LINE Mini-dApp Features
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Device Info */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Device Information</h3>

              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-white/10 rounded-lg">
                  <span className="text-gray-300">Platform</span>
                  <span className="text-white capitalize">{liffState.os}</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-white/10 rounded-lg">
                  <span className="text-gray-300">Client</span>
                  <span className="text-white">{liffState.isInClient ? 'LINE App' : 'Browser'}</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-white/10 rounded-lg">
                  <span className="text-gray-300">Language</span>
                  <span className="text-white uppercase">{liffState.language}</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Quick Actions</h3>

              <div className="space-y-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => window.open('https://line.me/R/ti/p/~kaia-yield-ai', '_blank')}
                  className="w-full bg-green-500/20 border border-green-500/30 text-green-400 py-3 px-4 rounded-lg font-semibold hover:bg-green-500/30 transition-colors flex items-center justify-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Official Account</span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => sendLINEMessage('🤖 KAIA YIELD AI is helping me maximize my DeFi returns!')}
                  className="w-full bg-blue-500/20 border border-blue-500/30 text-blue-400 py-3 px-4 rounded-lg font-semibold hover:bg-blue-500/30 transition-colors flex items-center justify-center space-x-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Send to Chat</span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-purple-500/20 border border-purple-500/30 text-purple-400 py-3 px-4 rounded-lg font-semibold hover:bg-purple-500/30 transition-colors flex items-center justify-center space-x-2"
                >
                  <QrCode className="w-4 h-4" />
                  <span>Scan QR Code</span>
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Error Display */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-500/20 border border-red-500/30 rounded-2xl p-4"
          >
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-6 h-6 text-red-400" />
              <div>
                <div className="text-red-300 font-semibold">Error</div>
                <div className="text-red-200 text-sm">{error}</div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default LIFFIntegration;