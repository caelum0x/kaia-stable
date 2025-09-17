import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Trophy,
  Crown,
  Medal,
  Star,
  TrendingUp,
  Share2,
  Copy,
  Heart,
  MessageCircle,
  UserPlus,
  Gift,
  Zap,
  Award,
  Target,
  ChevronRight,
  Filter,
  Search,
  RefreshCw,
  Sparkles,
  Fire,
  ThumbsUp,
  Eye,
  DollarSign,
  Percent,
  Clock,
  Shield,
  Activity
} from 'lucide-react';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { kaiaAPI, LeaderboardEntry, SocialStrategy, SocialFeedPost, SocialMetrics, SocialPerformanceData } from '../services/api';


const SocialTrading: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'strategies' | 'feed'>('leaderboard');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [strategies, setStrategies] = useState<SocialStrategy[]>([]);
  const [socialFeed, setSocialFeed] = useState<SocialFeedPost[]>([]);
  const [socialMetrics, setSocialMetrics] = useState<SocialMetrics | null>(null);
  const [performanceData, setPerformanceData] = useState<SocialPerformanceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRisk, setFilterRisk] = useState<'all' | 'low' | 'medium' | 'high'>('all');


  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch real data using API service
        const [leaderboardData, socialStrategies, socialFeedData, socialMetricsData, performanceChartData] = await Promise.all([
          kaiaAPI.game.getLeaderboard('social', 'weekly', 50),
          kaiaAPI.social.getSocialStrategies(),
          kaiaAPI.social.getSocialFeed(),
          kaiaAPI.analytics.getSocialMetrics(),
          kaiaAPI.analytics.getSocialPerformance()
        ]);

        setLeaderboard(leaderboardData.leaderboard);
        setStrategies(socialStrategies);
        setSocialFeed(socialFeedData.posts);
        setSocialMetrics(socialMetricsData);
        setPerformanceData(performanceChartData);
      } catch (error) {
        console.error('Error fetching social data:', error);
        // Initialize with empty arrays instead of mock data
        setLeaderboard([]);
        setStrategies([]);
        setSocialFeed([]);
        setSocialMetrics(null);
        setPerformanceData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0: return <Crown className="w-6 h-6 text-yellow-400" />;
      case 1: return <Medal className="w-6 h-6 text-gray-400" />;
      case 2: return <Award className="w-6 h-6 text-orange-400" />;
      default: return <span className="text-lg font-bold text-gray-400">#{index + 1}</span>;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-green-400" />;
      case 'down': return <TrendingUp className="w-4 h-4 text-red-400 rotate-180" />;
      default: return <span className="w-4 h-4 bg-gray-400 rounded-full" />;
    }
  };

  const getRiskColor = (risk: number) => {
    if (risk <= 3) return 'text-green-400 bg-green-500/20';
    if (risk <= 6) return 'text-yellow-400 bg-yellow-500/20';
    return 'text-red-400 bg-red-500/20';
  };

  const filteredStrategies = strategies.filter(strategy => {
    const matchesSearch = strategy.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         strategy.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRisk = filterRisk === 'all' ||
                       (filterRisk === 'low' && strategy.risk <= 3) ||
                       (filterRisk === 'medium' && strategy.risk > 3 && strategy.risk <= 6) ||
                       (filterRisk === 'high' && strategy.risk > 6);
    return matchesSearch && matchesRisk;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-purple-400 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-lg border-b border-white/10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                <Users className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Social Trading
                </h1>
                <p className="text-gray-300 text-sm">Connect, Copy, Profit Together</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg px-3 py-2">
                <div className="flex items-center text-yellow-400 text-sm">
                  <Gift className="w-4 h-4 mr-1" />
                  Social Bonus Active
                </div>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex space-x-1 bg-black/30 rounded-xl p-1">
            {[
              { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
              { id: 'strategies', label: 'Strategies', icon: Target },
              { id: 'feed', label: 'Social Feed', icon: MessageCircle }
            ].map(tab => (
              <motion.button
                key={tab.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-lg font-semibold transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-white/20 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white hover:bg-white/10'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          {/* Leaderboard Tab */}
          {activeTab === 'leaderboard' && (
            <motion.div
              key="leaderboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Social Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-black/30 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <Users className="w-8 h-8 text-blue-400" />
                    <span className="text-2xl">👥</span>
                  </div>
                  <div className="text-2xl font-bold">{socialMetrics?.activeTraders?.toLocaleString() || '0'}</div>
                  <div className="text-gray-400 text-sm">Active Traders</div>
                </div>

                <div className="bg-black/30 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <Copy className="w-8 h-8 text-green-400" />
                    <span className="text-2xl">📋</span>
                  </div>
                  <div className="text-2xl font-bold">{socialMetrics?.strategyCopies?.toLocaleString() || '0'}</div>
                  <div className="text-gray-400 text-sm">Strategy Copies</div>
                </div>

                <div className="bg-black/30 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <DollarSign className="w-8 h-8 text-yellow-400" />
                    <span className="text-2xl">💰</span>
                  </div>
                  <div className="text-2xl font-bold">{socialMetrics?.socialVolume || '$0'}</div>
                  <div className="text-gray-400 text-sm">Social Volume</div>
                </div>

                <div className="bg-black/30 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <Percent className="w-8 h-8 text-purple-400" />
                    <span className="text-2xl">📈</span>
                  </div>
                  <div className="text-2xl font-bold">{socialMetrics?.averageSocialAPY?.toFixed(1) || '0.0'}%</div>
                  <div className="text-gray-400 text-sm">Avg Social APY</div>
                </div>
              </div>

              {/* Leaderboard */}
              <div className="bg-black/30 backdrop-blur-lg rounded-2xl border border-white/10 overflow-hidden">
                <div className="p-6 border-b border-white/10">
                  <h2 className="text-xl font-bold flex items-center">
                    <Trophy className="w-6 h-6 mr-2 text-yellow-400" />
                    Top Performers This Week
                  </h2>
                </div>

                <div className="space-y-0">
                  {leaderboard.map((entry, index) => (
                    <motion.div
                      key={entry.user.address}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-6 border-b border-white/5 last:border-b-0 hover:bg-white/5 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-3">
                            {getRankIcon(index)}
                            <div className="text-3xl">👤</div>
                          </div>

                          <div>
                            <div className="flex items-center space-x-2">
                              <h3 className="font-bold text-lg">{entry.user.displayName}</h3>
                              {entry.user.hasLineAccount && (
                                <div className="bg-yellow-500/20 border border-yellow-500/30 rounded px-2 py-1">
                                  <Sparkles className="w-3 h-3 text-yellow-400" />
                                </div>
                              )}
                              <div className="bg-purple-500/20 border border-purple-500/30 rounded px-2 py-1 text-xs">
                                Level {entry.stats.level}
                              </div>
                            </div>
                            <div className="text-sm text-gray-400">{entry.user.shortAddress}</div>

                            <div className="flex items-center space-x-4 mt-2 text-sm">
                              <div className="flex items-center text-green-400">
                                <DollarSign className="w-3 h-3 mr-1" />
                                ${entry.stats.totalRewards.toLocaleString()}
                              </div>
                              <div className="flex items-center text-blue-400">
                                <Target className="w-3 h-3 mr-1" />
                                {entry.performance.roi}
                              </div>
                              <div className="flex items-center text-purple-400">
                                <Users className="w-3 h-3 mr-1" />
                                {entry.stats.successfulStrategies} Strategies
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-2xl font-bold">{entry.stats.points}</div>
                          <div className="text-sm text-gray-400 mb-2">Points</div>

                          <div className="flex items-center space-x-2">
                            <div className="flex items-center text-sm text-green-400">
                              <TrendingUp className="w-4 h-4 mr-1" />
                              <span>#{entry.rank}</span>
                            </div>

                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className="bg-blue-500 text-white px-3 py-1 rounded-lg text-sm font-semibold hover:bg-blue-600 transition-colors"
                            >
                              Follow
                            </motion.button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Weekly Performance Chart */}
              <div className="bg-black/30 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Activity className="w-5 h-5 mr-2" />
                  Community Performance This Week
                </h3>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={performanceData}>
                    <defs>
                      <linearGradient id="communityGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
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
                    <Area
                      type="monotone"
                      dataKey="performance"
                      stroke="#8B5CF6"
                      fillOpacity={1}
                      fill="url(#communityGradient)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          )}

          {/* Strategies Tab */}
          {activeTab === 'strategies' && (
            <motion.div
              key="strategies"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Search and Filter */}
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search strategies..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-black/30 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Filter className="w-5 h-5 text-gray-400" />
                  <select
                    value={filterRisk}
                    onChange={(e) => setFilterRisk(e.target.value as any)}
                    className="bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="all">All Risk Levels</option>
                    <option value="low">Low Risk</option>
                    <option value="medium">Medium Risk</option>
                    <option value="high">High Risk</option>
                  </select>
                </div>
              </div>

              {/* Strategy Cards */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredStrategies.map((strategy, index) => (
                  <motion.div
                    key={strategy.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-black/30 backdrop-blur-lg rounded-2xl border border-white/10 overflow-hidden hover:border-purple-500/30 transition-colors"
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-bold mb-2">{strategy.name}</h3>
                          <p className="text-gray-300 text-sm mb-3">{strategy.description}</p>

                          <div className="flex items-center space-x-2 mb-3">
                            {strategy.tags.map(tag => (
                              <span
                                key={tag}
                                className="bg-purple-500/20 border border-purple-500/30 rounded-full px-2 py-1 text-xs text-purple-300"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className={`px-3 py-1 rounded-full text-xs font-bold ${getRiskColor(strategy.risk)}`}>
                          Risk {strategy.risk}/10
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div className="text-center">
                          <div className="text-xl font-bold text-green-400">{strategy.apy}%</div>
                          <div className="text-xs text-gray-400">APY</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xl font-bold text-blue-400">{strategy.performance}%</div>
                          <div className="text-xs text-gray-400">Win Rate</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xl font-bold text-purple-400">{strategy.copiers}</div>
                          <div className="text-xs text-gray-400">Copiers</div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 text-sm text-gray-400">
                          <div className="flex items-center">
                            <Heart className="w-4 h-4 mr-1" />
                            {strategy.likes}
                          </div>
                          <div className="flex items-center">
                            <MessageCircle className="w-4 h-4 mr-1" />
                            {strategy.comments}
                          </div>
                          <div className="flex items-center">
                            <Users className="w-4 h-4 mr-1" />
                            {strategy.followers}
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => kaiaAPI.social.copyStrategy(strategy.id, 100)}
                            className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-600 transition-colors"
                          >
                            <Copy className="w-4 h-4 mr-1 inline" />
                            Copy
                          </motion.button>

                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="bg-purple-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-purple-600 transition-colors"
                          >
                            <Eye className="w-4 h-4 mr-1 inline" />
                            View
                          </motion.button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Social Feed Tab */}
          {activeTab === 'feed' && (
            <motion.div
              key="feed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Create Post */}
              <div className="bg-black/30 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold">
                    U
                  </div>
                  <input
                    type="text"
                    placeholder="Share your latest strategy insights..."
                    className="flex-1 bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-purple-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-purple-600 transition-colors"
                  >
                    Post
                  </motion.button>
                </div>
              </div>

              {/* Social Posts */}
              <div className="space-y-4">
                {socialFeed.map((post, index) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-black/30 backdrop-blur-lg rounded-2xl p-6 border border-white/10"
                  >
                    <div className="flex items-start space-x-3 mb-4">
                      <div className="text-2xl">{post.userAvatar}</div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-bold">{post.userName}</h4>
                          <span className="text-gray-400 text-sm">{new Date(post.timestamp).toLocaleDateString()}</span>
                        </div>
                        <p className="text-gray-300">{post.content}</p>

                        {post.strategyName && (
                          <div className="bg-purple-500/20 border border-purple-500/30 rounded-lg p-3 mt-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-semibold text-purple-300">{post.strategyName}</div>
                                <div className="text-sm text-gray-400">Strategy Performance</div>
                              </div>
                              <div className="text-right">
                                <div className="text-2xl font-bold text-green-400">{post.performance?.toFixed(1) || '0.0'}%</div>
                                <div className="text-sm text-gray-400">APY</div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-white/10">
                      <div className="flex items-center space-x-6">
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          onClick={() => kaiaAPI.social.likePost(post.id)}
                          className={`flex items-center space-x-1 ${
                            post.isLiked ? 'text-red-400' : 'text-gray-400 hover:text-red-400'
                          }`}
                        >
                          <Heart className={`w-4 h-4 ${post.isLiked ? 'fill-current' : ''}`} />
                          <span className="text-sm">{post.likes}</span>
                        </motion.button>

                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          className="flex items-center space-x-1 text-gray-400 hover:text-blue-400"
                        >
                          <MessageCircle className="w-4 h-4" />
                          <span className="text-sm">{post.comments}</span>
                        </motion.button>

                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          onClick={() => kaiaAPI.social.sharePost(post.id)}
                          className="flex items-center space-x-1 text-gray-400 hover:text-green-400"
                        >
                          <Share2 className="w-4 h-4" />
                          <span className="text-sm">{post.shares}</span>
                        </motion.button>
                      </div>

                      {post.strategyId && (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => kaiaAPI.social.followStrategy(post.strategyId!)}
                          className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-600 transition-colors"
                        >
                          Follow Strategy
                        </motion.button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default SocialTrading;