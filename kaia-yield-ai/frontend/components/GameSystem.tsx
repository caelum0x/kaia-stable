import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy,
  Star,
  Target,
  Zap,
  Award,
  Crown,
  Gift,
  Fire,
  Calendar,
  CheckCircle,
  Circle,
  Clock,
  TrendingUp,
  Users,
  DollarSign,
  Shield,
  Sparkles,
  Gamepad2,
  Medal,
  Gem,
  Rocket,
  Lightning,
  Heart,
  Flame,
  ChevronRight,
  RotateCcw,
  Plus,
  Timer
} from 'lucide-react';
import {
  CircularProgressbar,
  buildStyles
} from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import {
  RadialBarChart,
  RadialBar,
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface Mission {
  id: number;
  name: string;
  description: string;
  reward: number;
  difficulty: number;
  duration: number;
  progress: number;
  completed: boolean;
  claimed: boolean;
  category: 'deposit' | 'yield' | 'social' | 'streak' | 'special';
  icon: string;
  requirements?: string[];
  timeLeft?: number;
}

interface UserStats {
  points: number;
  level: number;
  streak: number;
  hasSocialBonus: boolean;
  nextLevelPoints: number;
  currentLevelPoints: number;
  achievements: string[];
  badges: string[];
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlocked: boolean;
  progress?: number;
  maxProgress?: number;
}

interface Reward {
  type: 'points' | 'bonus' | 'nft' | 'title';
  value: number | string;
  icon: string;
}

const GameSystem: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'missions' | 'achievements' | 'rewards' | 'leaderboard'>('missions');
  const [userStats, setUserStats] = useState<UserStats>({
    points: 1547,
    level: 8,
    streak: 12,
    hasSocialBonus: true,
    nextLevelPoints: 2000,
    currentLevelPoints: 1500,
    achievements: ['first_deposit', 'yield_explorer', 'social_butterfly'],
    badges: ['streak_master', 'top_performer']
  });

  const [missions, setMissions] = useState<Mission[]>([
    {
      id: 1,
      name: 'Daily Deposit',
      description: 'Make a deposit today to keep your streak alive',
      reward: 50,
      difficulty: 1,
      duration: 86400,
      progress: 0,
      completed: false,
      claimed: false,
      category: 'deposit',
      icon: '💰',
      timeLeft: 18000
    },
    {
      id: 2,
      name: 'Yield Explorer',
      description: 'Try 3 different yield strategies this week',
      reward: 250,
      difficulty: 2,
      duration: 604800,
      progress: 1,
      completed: false,
      claimed: false,
      category: 'yield',
      icon: '🎯',
      requirements: ['Use Stable Earn', 'Use Growth Plus', 'Use High Yield Pro'],
      timeLeft: 432000
    },
    {
      id: 3,
      name: 'Social Butterfly',
      description: 'Share your strategy with 5 friends on LINE',
      reward: 150,
      difficulty: 2,
      duration: 259200,
      progress: 3,
      completed: false,
      claimed: false,
      category: 'social',
      icon: '🦋',
      timeLeft: 172800
    },
    {
      id: 4,
      name: 'Streak Master',
      description: 'Maintain a 7-day deposit streak',
      reward: 500,
      difficulty: 3,
      duration: 604800,
      progress: 5,
      completed: false,
      claimed: false,
      category: 'streak',
      icon: '🔥',
      timeLeft: 259200
    },
    {
      id: 5,
      name: 'First Deposit Champion',
      description: 'Make your very first deposit on KAIA YIELD AI',
      reward: 100,
      difficulty: 1,
      duration: 86400,
      progress: 100,
      completed: true,
      claimed: false,
      category: 'deposit',
      icon: '🏆'
    }
  ]);

  const [achievements, setAchievements] = useState<Achievement[]>([
    {
      id: 'first_deposit',
      name: 'First Steps',
      description: 'Made your first deposit',
      icon: '🚀',
      rarity: 'common',
      unlocked: true
    },
    {
      id: 'yield_explorer',
      name: 'Yield Explorer',
      description: 'Tried 3 different strategies',
      icon: '🗺️',
      rarity: 'rare',
      unlocked: true
    },
    {
      id: 'social_butterfly',
      name: 'Social Butterfly',
      description: 'Shared strategies with friends',
      icon: '🦋',
      rarity: 'rare',
      unlocked: true
    },
    {
      id: 'high_roller',
      name: 'High Roller',
      description: 'Deposited over $10,000',
      icon: '💎',
      rarity: 'epic',
      unlocked: false,
      progress: 6543,
      maxProgress: 10000
    },
    {
      id: 'whale_status',
      name: 'Whale Status',
      description: 'Reached $100,000 in deposits',
      icon: '🐋',
      rarity: 'legendary',
      unlocked: false,
      progress: 6543,
      maxProgress: 100000
    },
    {
      id: 'streak_legend',
      name: 'Streak Legend',
      description: 'Maintained 30-day streak',
      icon: '⚡',
      rarity: 'legendary',
      unlocked: false,
      progress: 12,
      maxProgress: 30
    }
  ]);

  const levelProgress = ((userStats.points - userStats.currentLevelPoints) / (userStats.nextLevelPoints - userStats.currentLevelPoints)) * 100;

  const streakData = [
    { day: 'Mon', active: true },
    { day: 'Tue', active: true },
    { day: 'Wed', active: true },
    { day: 'Thu', active: true },
    { day: 'Fri', active: true },
    { day: 'Sat', active: true },
    { day: 'Sun', active: false }
  ];

  const pointsHistory = [
    { day: 'Day 1', points: 100 },
    { day: 'Day 2', points: 180 },
    { day: 'Day 3', points: 290 },
    { day: 'Day 4', points: 450 },
    { day: 'Day 5', points: 580 },
    { day: 'Day 6', points: 720 },
    { day: 'Day 7', points: 890 }
  ];

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'border-gray-500 bg-gray-500/20 text-gray-300';
      case 'rare': return 'border-blue-500 bg-blue-500/20 text-blue-300';
      case 'epic': return 'border-purple-500 bg-purple-500/20 text-purple-300';
      case 'legendary': return 'border-yellow-500 bg-yellow-500/20 text-yellow-300';
      default: return 'border-gray-500 bg-gray-500/20 text-gray-300';
    }
  };

  const getDifficultyStars = (difficulty: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-3 h-3 ${i < difficulty ? 'text-yellow-400 fill-current' : 'text-gray-600'}`}
      />
    ));
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const claimReward = (missionId: number) => {
    setMissions(prev => prev.map(mission =>
      mission.id === missionId ? { ...mission, claimed: true } : mission
    ));
    setUserStats(prev => ({
      ...prev,
      points: prev.points + missions.find(m => m.id === missionId)?.reward || 0
    }));
  };

  const CategoryIcon = ({ category }: { category: string }) => {
    switch (category) {
      case 'deposit': return <DollarSign className="w-4 h-4" />;
      case 'yield': return <TrendingUp className="w-4 h-4" />;
      case 'social': return <Users className="w-4 h-4" />;
      case 'streak': return <Fire className="w-4 h-4" />;
      case 'special': return <Star className="w-4 h-4" />;
      default: return <Target className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-lg border-b border-white/10">
        <div className="container mx-auto px-4 py-6">
          {/* User Stats Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-2xl font-bold">
                  {userStats.level}
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                  <Crown className="w-3 h-3 text-yellow-400" />
                </div>
              </div>

              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                  Level {userStats.level} Player
                </h1>
                <div className="flex items-center space-x-4 text-sm text-gray-300">
                  <div className="flex items-center">
                    <Zap className="w-4 h-4 mr-1 text-yellow-400" />
                    {userStats.points.toLocaleString()} Points
                  </div>
                  <div className="flex items-center">
                    <Fire className="w-4 h-4 mr-1 text-orange-400" />
                    {userStats.streak} Day Streak
                  </div>
                  {userStats.hasSocialBonus && (
                    <div className="flex items-center bg-green-500/20 px-2 py-1 rounded">
                      <Users className="w-4 h-4 mr-1 text-green-400" />
                      Social Bonus
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className="text-sm text-gray-400 mb-1">Next Level</div>
              <div className="flex items-center space-x-2">
                <div className="w-32 h-2 bg-gray-700 rounded-full">
                  <motion.div
                    className="h-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${levelProgress}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  />
                </div>
                <span className="text-sm font-bold">
                  {userStats.nextLevelPoints - userStats.points} to go
                </span>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex space-x-1 bg-black/30 rounded-xl p-1">
            {[
              { id: 'missions', label: 'Missions', icon: Target },
              { id: 'achievements', label: 'Achievements', icon: Trophy },
              { id: 'rewards', label: 'Rewards', icon: Gift },
              { id: 'leaderboard', label: 'Leaderboard', icon: Crown }
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
          {/* Missions Tab */}
          {activeTab === 'missions' && (
            <motion.div
              key="missions"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Daily Streak */}
              <div className="bg-black/30 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold flex items-center">
                    <Fire className="w-5 h-5 mr-2 text-orange-400" />
                    Daily Streak - {userStats.streak} Days
                  </h2>
                  <div className="bg-orange-500/20 border border-orange-500/30 rounded-lg px-3 py-1">
                    <span className="text-orange-400 text-sm font-bold">🔥 ON FIRE!</span>
                  </div>
                </div>

                <div className="flex justify-center space-x-2 mb-4">
                  {streakData.map((day, index) => (
                    <motion.div
                      key={day.day}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className={`flex flex-col items-center p-3 rounded-lg ${
                        day.active
                          ? 'bg-orange-500/20 border border-orange-500/30'
                          : 'bg-gray-700/20 border border-gray-500/30'
                      }`}
                    >
                      <div className="text-xs text-gray-400 mb-1">{day.day}</div>
                      {day.active ? (
                        <Fire className="w-6 h-6 text-orange-400" />
                      ) : (
                        <Circle className="w-6 h-6 text-gray-500" />
                      )}
                    </motion.div>
                  ))}
                </div>

                <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20 rounded-lg p-4">
                  <div className="text-center">
                    <div className="text-2xl mb-2">🏆</div>
                    <div className="font-bold mb-1">Streak Bonus: +20% APY</div>
                    <div className="text-sm text-gray-300">Keep your streak alive to maintain bonus rewards!</div>
                  </div>
                </div>
              </div>

              {/* Active Missions */}
              <div className="space-y-4">
                <h2 className="text-xl font-bold flex items-center">
                  <Target className="w-6 h-6 mr-2 text-blue-400" />
                  Active Missions
                </h2>

                {missions.filter(m => !m.completed || !m.claimed).map((mission, index) => (
                  <motion.div
                    key={mission.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`bg-black/30 backdrop-blur-lg rounded-2xl border overflow-hidden ${
                      mission.completed ? 'border-green-500/30' : 'border-white/10'
                    }`}
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start space-x-4">
                          <div className="text-4xl">{mission.icon}</div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h3 className="text-lg font-bold">{mission.name}</h3>
                              <div className="flex items-center space-x-1">
                                {getDifficultyStars(mission.difficulty)}
                              </div>
                              <div className="bg-purple-500/20 border border-purple-500/30 rounded px-2 py-1">
                                <CategoryIcon category={mission.category} />
                              </div>
                            </div>

                            <p className="text-gray-300 text-sm mb-3">{mission.description}</p>

                            {mission.requirements && (
                              <div className="space-y-1 mb-3">
                                {mission.requirements.map((req, i) => (
                                  <div key={i} className="flex items-center text-sm text-gray-400">
                                    <CheckCircle className={`w-3 h-3 mr-2 ${i < mission.progress ? 'text-green-400' : 'text-gray-600'}`} />
                                    {req}
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Progress Bar */}
                            <div className="mb-3">
                              <div className="flex justify-between text-sm mb-1">
                                <span className="text-gray-400">Progress</span>
                                <span className="font-bold">
                                  {mission.requirements ? `${mission.progress}/${mission.requirements.length}` : `${mission.progress}%`}
                                </span>
                              </div>
                              <div className="w-full h-2 bg-gray-700 rounded-full">
                                <motion.div
                                  className="h-2 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full"
                                  initial={{ width: 0 }}
                                  animate={{
                                    width: mission.requirements
                                      ? `${(mission.progress / mission.requirements.length) * 100}%`
                                      : `${mission.progress}%`
                                  }}
                                  transition={{ duration: 1, ease: "easeOut" }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-3 mb-3">
                            <div className="flex items-center text-yellow-400">
                              <Gem className="w-4 h-4 mr-1" />
                              <span className="font-bold">{mission.reward} Points</span>
                            </div>
                          </div>

                          {mission.timeLeft && (
                            <div className="text-sm text-gray-400 mb-2">
                              <Clock className="w-3 h-3 inline mr-1" />
                              {formatTime(mission.timeLeft)} left
                            </div>
                          )}

                          {mission.completed && !mission.claimed ? (
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => claimReward(mission.id)}
                              className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 rounded-lg font-semibold hover:shadow-lg transition-all duration-200 flex items-center"
                            >
                              <Gift className="w-4 h-4 mr-1" />
                              Claim Reward
                            </motion.button>
                          ) : mission.claimed ? (
                            <div className="bg-gray-600 text-gray-300 px-4 py-2 rounded-lg font-semibold flex items-center">
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Claimed
                            </div>
                          ) : (
                            <div className="bg-blue-500/20 border border-blue-500/30 text-blue-300 px-4 py-2 rounded-lg font-semibold">
                              In Progress
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Achievements Tab */}
          {activeTab === 'achievements' && (
            <motion.div
              key="achievements"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {achievements.map((achievement, index) => (
                  <motion.div
                    key={achievement.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className={`bg-black/30 backdrop-blur-lg rounded-2xl p-6 border transition-all duration-300 hover:scale-105 ${
                      achievement.unlocked
                        ? getRarityColor(achievement.rarity)
                        : 'border-gray-600 bg-gray-800/20 opacity-60'
                    }`}
                  >
                    <div className="flex items-start space-x-4">
                      <div className={`text-4xl ${achievement.unlocked ? '' : 'grayscale'}`}>
                        {achievement.icon}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-bold">{achievement.name}</h3>
                          <div className={`px-2 py-1 rounded text-xs font-bold ${getRarityColor(achievement.rarity)}`}>
                            {achievement.rarity.toUpperCase()}
                          </div>
                        </div>

                        <p className="text-gray-300 text-sm mb-3">{achievement.description}</p>

                        {!achievement.unlocked && achievement.progress !== undefined && achievement.maxProgress && (
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-gray-400">Progress</span>
                              <span className="font-bold">
                                {achievement.progress.toLocaleString()} / {achievement.maxProgress.toLocaleString()}
                              </span>
                            </div>
                            <div className="w-full h-2 bg-gray-700 rounded-full">
                              <motion.div
                                className="h-2 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: `${(achievement.progress / achievement.maxProgress) * 100}%` }}
                                transition={{ duration: 1, ease: "easeOut" }}
                              />
                            </div>
                          </div>
                        )}

                        {achievement.unlocked && (
                          <div className="flex items-center text-green-400 text-sm">
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Unlocked
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Rewards Tab */}
          {activeTab === 'rewards' && (
            <motion.div
              key="rewards"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Points History Chart */}
              <div className="bg-black/30 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2" />
                  Points History (Last 7 Days)
                </h3>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={pointsHistory}>
                    <defs>
                      <linearGradient id="pointsGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.1}/>
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
                      dataKey="points"
                      stroke="#F59E0B"
                      fillOpacity={1}
                      fill="url(#pointsGradient)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Rewards Store */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {[
                  { name: 'Bonus APY Boost', cost: 500, icon: '🚀', description: '+5% APY for 24 hours' },
                  { name: 'Strategy Unlock', cost: 1000, icon: '🔓', description: 'Access to premium strategies' },
                  { name: 'Custom Avatar', cost: 750, icon: '🎭', description: 'Personalize your profile' },
                  { name: 'VIP Status', cost: 2000, icon: '👑', description: 'Exclusive benefits for 30 days' },
                  { name: 'Mystery Box', cost: 300, icon: '📦', description: 'Random reward surprise' },
                  { name: 'Referral Bonus', cost: 1500, icon: '🎁', description: 'Double referral rewards' }
                ].map((reward, index) => (
                  <motion.div
                    key={reward.name}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-black/30 backdrop-blur-lg rounded-2xl p-6 border border-white/10 hover:border-yellow-500/30 transition-colors"
                  >
                    <div className="text-center">
                      <div className="text-4xl mb-3">{reward.icon}</div>
                      <h4 className="font-bold mb-2">{reward.name}</h4>
                      <p className="text-gray-300 text-sm mb-4">{reward.description}</p>

                      <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-3 mb-4">
                        <div className="flex items-center justify-center text-yellow-400">
                          <Gem className="w-4 h-4 mr-1" />
                          <span className="font-bold">{reward.cost} Points</span>
                        </div>
                      </div>

                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        disabled={userStats.points < reward.cost}
                        className={`w-full py-2 px-4 rounded-lg font-semibold transition-all duration-200 ${
                          userStats.points >= reward.cost
                            ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white hover:shadow-lg'
                            : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        {userStats.points >= reward.cost ? 'Redeem' : 'Not Enough Points'}
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Leaderboard Tab */}
          {activeTab === 'leaderboard' && (
            <motion.div
              key="leaderboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="bg-black/30 backdrop-blur-lg rounded-2xl border border-white/10 overflow-hidden">
                <div className="p-6 border-b border-white/10">
                  <h2 className="text-xl font-bold flex items-center">
                    <Crown className="w-6 h-6 mr-2 text-yellow-400" />
                    Top Gamers This Week
                  </h2>
                </div>

                <div className="space-y-0">
                  {[
                    { rank: 1, name: 'CryptoMaster 👑', points: 4567, level: 15, badge: '🏆' },
                    { rank: 2, name: 'YieldHunter 🎯', points: 3890, level: 13, badge: '🥈' },
                    { rank: 3, name: 'DeFiNinja 🥷', points: 3234, level: 12, badge: '🥉' },
                    { rank: 4, name: 'SmartInvestor 🧠', points: 2756, level: 10, badge: '⭐' },
                    { rank: 5, name: 'StrategyKing 👑', points: 2345, level: 9, badge: '⭐' }
                  ].map((player, index) => (
                    <motion.div
                      key={player.rank}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-6 border-b border-white/5 last:border-b-0 hover:bg-white/5 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="text-2xl">{player.badge}</div>
                          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold">
                            {player.level}
                          </div>
                          <div>
                            <h4 className="font-bold">{player.name}</h4>
                            <div className="text-sm text-gray-400">Level {player.level}</div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-xl font-bold text-yellow-400">{player.points.toLocaleString()}</div>
                          <div className="text-sm text-gray-400">Points</div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default GameSystem;