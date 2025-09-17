// Core Components
export { default as Dashboard } from './Dashboard';
export { default as MainApp } from './MainApp';

// AI & ML Components
export { default as AIRecommendationsEnhanced } from './AIRecommendationsEnhanced';

// Social & Trading Components
export { default as SocialTrading } from './SocialTrading';

// Gaming & Gamification
export { default as GameSystem } from './GameSystem';

// LINE Integration
export { default as LIFFIntegration } from './LIFFIntegration';

// Data Visualization
export { default as RealTimeDataViz } from './RealTimeDataViz';

// Legacy Components (keeping for backward compatibility)
export { default as AIRecommendations } from './AIRecommendations';
export { default as Layout } from './Layout';
export { default as LoadingScreen } from './LoadingScreen';
export { default as MetricsCard } from './MetricsCard';
export { default as StrategyCard } from './StrategyCard';

// Type Definitions
export interface MetricDisplay {
  id: string;
  title: string;
  value: number;
  prevValue: number;
  format: 'currency' | 'percentage' | 'number' | 'apy';
  color: string;
  icon: any;
  chartData?: Array<{
    timestamp: number;
    value: number;
    label?: string;
    extra?: any;
  }>;
  chartConfig?: {
    title: string;
    type: 'line' | 'area' | 'bar' | 'pie' | 'radial' | 'composed';
    dataKey: string;
    color: string;
    gradient?: string;
    showGrid?: boolean;
    showTooltip?: boolean;
    showTrend?: boolean;
    animated?: boolean;
    realTime?: boolean;
    updateInterval?: number;
  };
}

export interface NavigationItem {
  id: string;
  label: string;
  icon: any;
  color: string;
  gradient: string;
  badge?: number;
}

export interface UserStats {
  points: number;
  level: number;
  streak: number;
  hasSocialBonus: boolean;
  nextLevelPoints: number;
  currentLevelPoints: number;
  achievements: string[];
  badges: string[];
}

export interface ProtocolMetrics {
  tvl: number;
  totalStrategies: number;
  totalUsers: number;
  averageApy: number;
  topUsers: Array<{
    user: string;
    score: number;
    timestamp: number;
  }>;
}

export interface AIRecommendation {
  strategy_id: number;
  strategy_name: string;
  score: number;
  confidence: 'High' | 'Medium' | 'Low';
  explanation: string;
  expected_return: number;
  apy: number;
  risk_level: number;
  category: string;
}

export interface Mission {
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

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlocked: boolean;
  progress?: number;
  maxProgress?: number;
}

export interface LeaderboardEntry {
  user: string;
  displayName: string;
  avatar: string;
  score: number;
  level: number;
  winRate: number;
  totalEarned: number;
  strategies: number;
  followers: number;
  isFollowing?: boolean;
  trend: 'up' | 'down' | 'stable';
  change24h: number;
  socialBonus: boolean;
}

export interface TradingStrategy {
  id: number;
  user: string;
  name: string;
  description: string;
  apy: number;
  risk: number;
  followers: number;
  copiers: number;
  performance: number;
  timeframe: string;
  tags: string[];
  isPublic: boolean;
  likes: number;
  comments: number;
}

export interface LIFFProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
  statusMessage?: string;
}

export interface LIFFState {
  isLoggedIn: boolean;
  profile: LIFFProfile | null;
  accessToken: string | null;
  isInClient: boolean;
  os: 'ios' | 'android' | 'web';
  language: string;
}

export interface WalletState {
  isConnected: boolean;
  address: string | null;
  balance: string;
  chainId: number;
  provider: any;
}