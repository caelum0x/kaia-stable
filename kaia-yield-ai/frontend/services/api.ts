// =======================================================
// KAIA YIELD AI - FRONTEND API SERVICE LAYER
// Complete end-to-end integration with backend services
// =======================================================

import axios, { AxiosResponse, AxiosError } from 'axios';

// =======================================================
// TYPESCRIPT INTERFACES
// =======================================================

export interface APIResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  details?: string;
}

export interface Strategy {
  id: number;
  name: string;
  apy: number;
  apyFormatted: string;
  riskLevel: number;
  riskLevelText: string;
  category: string;
  source: string;
  liquidity: string;
  minDeposit: string;
  maxDeposit: string;
  active: boolean;
  lastUpdate: string;
}

export interface UserPortfolio {
  summary: {
    totalDeposited: string;
    totalRewards: string;
    activePositions: number;
    totalValue: string;
    averageAPY: string;
    portfolioGrowth: string;
  };
  positions: UserPosition[];
  userStats: {
    level: number;
    points: number;
    streak: number;
    riskTolerance: number;
  };
  lastUpdated: string;
}

export interface UserPosition {
  id: string;
  strategyId: number;
  strategyName: string;
  amount: string;
  amountFormatted: string;
  rewards: string;
  rewardsFormatted: string;
  apy: number;
  apyFormatted: string;
  depositTime: number;
  lastRewardTime: number;
  daysActive: number;
  performanceScore: string;
}

export interface YieldCalculation {
  strategy: {
    id: number;
    name: string;
    currentAPY: number;
    riskLevel: number;
    protocol: string;
  };
  inputs: {
    amount: number;
    duration: number;
    currency: string;
  };
  projections: {
    simpleRewards: string;
    compoundedRewards: string;
    dailyEarnings: string;
    totalValue: string;
    effectiveAPY: string;
  };
  riskAnalysis: {
    volatility: number;
    maxDrawdown: number;
    sharpeRatio: number;
    riskScore: number;
    riskCategory: string;
  };
  marketConditions: {
    volatilityIndex: number;
    recommendation: string;
    lastUpdate: string;
  };
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

export interface MLMetrics {
  modelAccuracy: number;
  predictionConfidence: number;
  dataQuality: number;
  marketVolatility: number;
  lastTraining: string;
}

export interface RadarData {
  metric: string;
  value: number;
  fullMark: number;
}

export interface PerformancePrediction {
  month: string;
  conservative: number;
  predicted: number;
  optimistic: number;
}

export interface StrategyComparison {
  name: string;
  risk: number;
  apy: number;
  score: number;
}

export interface EnhancedUserRiskProfile {
  riskProfile: string;
  riskTolerance: number;
  averageRisk: number;
  diversification: number;
  strategiesUsed: number;
  totalDeposited: string;
  recommendations: string[];
}

export interface LegacyAIRecommendation {
  recommendedStrategy: {
    id: number;
    name: string;
    apy: number;
    riskLevel: number;
    confidence: number;
  };
  reasoning: string[];
  alternatives: Strategy[];
  marketInsights: {
    condition: string;
    recommendation: string;
    trends: {
      usdtPrice: number;
      kaiaPrice: number;
      defiTVL: string;
    };
  };
  lastUpdated: string;
}

export interface PortfolioPerformanceData {
  name: string;
  portfolio: number;
  market: number;
}

export interface StrategyDistributionData {
  name: string;
  value: number;
  color: string;
}

export interface YieldHistoryData {
  day: string;
  yield: number;
}

export interface SocialMetrics {
  activeTraders: number;
  strategyCopies: number;
  socialVolume: string;
  averageSocialAPY: number;
}

export interface SocialPerformanceData {
  day: string;
  performance: number;
}

export interface SocialStrategy extends TradingStrategy {
  userId: string;
  userName: string;
  verified: boolean;
  copiedByUser?: boolean;
}

export interface SocialFeedPost {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  strategyId?: number;
  strategyName?: string;
  performance?: number;
  timestamp: string;
  likes: number;
  comments: number;
  shares: number;
  isLiked: boolean;
  attachments?: Array<{
    type: 'strategy' | 'image' | 'chart';
    data: any;
  }>;
}

export interface TradingStrategy {
  id: number;
  userId: string;
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
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProtocolMetrics {
  protocol: {
    tvl: number;
    tvlFormatted: string;
    totalUsers: number;
    activeUsers24h: number;
    totalStrategies: number;
    averageApy: number;
    totalDeposits: number;
    totalVolume: number;
    newUsersToday: number;
  };
  strategies: Strategy[];
  market: {
    usdtPrice: number;
    kaiaPrice: number;
    volatilityIndex: number;
    defiTVL: number;
    marketCap: number;
  };
  performance: {
    topStrategy: any;
    growth24h: number;
    rewardsDistributed: number;
    successRate: number;
  };
  lastUpdated: string;
}

export interface Mission {
  id: number;
  name: string;
  description: string;
  type: string;
  reward: {
    points: number;
    usdt: number;
    formatted: string;
  };
  difficulty: number;
  difficultyText: string;
  duration: number;
  durationText: string;
  requirements: any;
  isActive: boolean;
  startDate?: string;
  endDate?: string;
  category: string;
  icon: string;
}

export interface UserMissionData {
  missions: UserMission[];
  summary: {
    totalMissions: number;
    completedMissions: number;
    claimedRewards: number;
    pendingClaims: number;
    totalPointsEarned: number;
    totalUSDTEarned: number;
    currentLevel: number;
    currentPoints: number;
    currentStreak: number;
    completionRate: number;
  };
  lastUpdated: string;
}

export interface UserMission {
  id: string;
  missionId: number;
  name: string;
  description: string;
  progress: number;
  target: number;
  progressFormatted: string;
  startTime: string;
  completedAt?: string;
  claimedAt?: string;
  isCompleted: boolean;
  isClaimed: boolean;
  canClaim: boolean;
  reward: {
    points: number;
    usdt: number;
  };
  difficulty: number;
  timeRemaining?: string;
  status: 'in_progress' | 'completed' | 'claimed';
}

export interface LeaderboardData {
  leaderboard: LeaderboardEntry[];
  metadata: {
    category: string;
    period: string;
    totalEntries: number;
    lastUpdated: string;
    updateFrequency: string;
  };
}

export interface LeaderboardEntry {
  rank: number;
  user: {
    address: string;
    displayName: string;
    shortAddress: string;
    hasLineAccount: boolean;
  };
  stats: {
    points: number;
    level: number;
    streak: number;
    totalDeposited: number;
    totalRewards: number;
    successfulStrategies: number;
    blockchainScore: number;
  };
  performance: {
    roi: string;
    avgDailyPoints: number;
    efficiency: number;
  };
  badges: Array<{
    name: string;
    icon: string;
    color: string;
  }>;
  lastActive?: string;
}

export interface UserStats {
  user: {
    address: string;
    displayName: string;
    joinDate: string;
    daysActive: number;
  };
  gaming: {
    points: number;
    level: number;
    experience: number;
    nextLevel: {
      nextLevel: number;
      expNeeded: number;
      expToNext: number;
      progressPercent: number;
    };
    streak: number;
    hasSocialBonus: boolean;
  };
  performance: {
    totalDeposited: number;
    totalRewards: number;
    successfulStrategies: number;
    roi: string;
  };
  missions: {
    total: number;
    completed: number;
    completionRate: number;
  };
  achievements: Array<{
    id: string;
    name: string;
    description: string;
    unlocked: boolean;
    icon: string;
    rarity: string;
  }>;
  ranking: number | null;
  lastUpdated: string;
}

// =======================================================
// API CLIENT CONFIGURATION
// =======================================================

class APIClient {
  private baseURL: string;
  private timeout: number;
  private retryAttempts: number;

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api';
    this.timeout = 10000; // 10 seconds
    this.retryAttempts = 3;

    // Configure axios defaults
    axios.defaults.timeout = this.timeout;
    axios.defaults.headers.common['Content-Type'] = 'application/json';

    // Request interceptor for adding auth headers
    axios.interceptors.request.use(
      (config) => {
        // Add auth token if available
        const token = localStorage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    axios.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        console.error('API Error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  private async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    data?: any,
    retryCount = 0
  ): Promise<T> {
    try {
      const config = {
        method,
        url: `${this.baseURL}${endpoint}`,
        data,
        timeout: this.timeout,
      };

      const response: AxiosResponse<APIResponse<T>> = await axios(config);

      if (!response.data.success) {
        throw new Error(response.data.error || 'API request failed');
      }

      return response.data.data;
    } catch (error) {
      if (retryCount < this.retryAttempts && this.shouldRetry(error as AxiosError)) {
        console.warn(`API request failed, retrying... (${retryCount + 1}/${this.retryAttempts})`);
        await this.delay(1000 * Math.pow(2, retryCount)); // Exponential backoff
        return this.request(method, endpoint, data, retryCount + 1);
      }
      throw this.handleError(error as AxiosError);
    }
  }

  private shouldRetry(error: AxiosError): boolean {
    // Retry on network errors, timeouts, or 5xx server errors
    return !error.response ||
           error.code === 'ECONNABORTED' ||
           (error.response.status >= 500 && error.response.status < 600);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private handleError(error: AxiosError): Error {
    if (error.response?.data) {
      const apiError = error.response.data as APIResponse<any>;
      return new Error(apiError.error || 'Unknown API error');
    }

    if (error.code === 'ECONNABORTED') {
      return new Error('Request timeout - please try again');
    }

    return new Error(error.message || 'Network error occurred');
  }

  // Public API methods
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>('GET', endpoint);
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>('POST', endpoint, data);
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>('PUT', endpoint, data);
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>('DELETE', endpoint);
  }
}

// =======================================================
// SERVICE CLASSES
// =======================================================

export class StrategiesService {
  constructor(private api: APIClient) {}

  async getAllStrategies(): Promise<Strategy[]> {
    return this.api.get<Strategy[]>('/strategies');
  }

  async getStrategy(id: number): Promise<Strategy> {
    return this.api.get<Strategy>(`/strategies/${id}`);
  }

  async getOptimalStrategy(userAddress: string): Promise<Strategy> {
    return this.api.get<Strategy>(`/strategies/optimal/${userAddress}`);
  }
}

export class YieldService {
  constructor(private api: APIClient) {}

  async getUserPortfolio(userAddress: string): Promise<UserPortfolio> {
    return this.api.get<UserPortfolio>(`/yield/portfolio/${userAddress}`);
  }

  async calculateYield(amount: number, strategyId: number, duration = 30): Promise<YieldCalculation> {
    return this.api.post<YieldCalculation>('/yield/calculate', {
      amount,
      strategyId,
      duration
    });
  }

  async recordDeposit(
    userAddress: string,
    strategyId: number,
    amount: string,
    transactionHash: string
  ): Promise<{ depositId: string; message: string; transactionHash: string; blockNumber: number }> {
    return this.api.post('/yield/deposit', {
      userAddress,
      strategyId,
      amount,
      transactionHash
    });
  }

  async getYieldHistory(userAddress: string, page = 1, limit = 20): Promise<{
    history: any[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
    return this.api.get(`/yield/history/${userAddress}?page=${page}&limit=${limit}`);
  }

  async getRecommendation(userAddress: string): Promise<LegacyAIRecommendation> {
    return this.api.get<LegacyAIRecommendation>(`/yield/recommend/${userAddress}`);
  }
}

export class AnalyticsService {
  constructor(private api: APIClient) {}

  async getProtocolMetrics(): Promise<ProtocolMetrics> {
    return this.api.get<ProtocolMetrics>('/analytics/protocol-metrics');
  }

  async getStrategyAnalytics(): Promise<Strategy[]> {
    return this.api.get<Strategy[]>('/analytics/strategies');
  }

  async getUserAnalytics(timeframe = '7d'): Promise<any> {
    return this.api.get(`/analytics/users?timeframe=${timeframe}`);
  }

  async getActivityFeed(limit = 50): Promise<any[]> {
    return this.api.get(`/analytics/activity?limit=${limit}`);
  }

  async getPerformanceAnalytics(period = '30d'): Promise<any> {
    return this.api.get(`/analytics/performance?period=${period}`);
  }

  async getDashboardData(): Promise<any> {
    return this.api.get('/analytics/dashboard');
  }

  async getPortfolioPerformance(userAddress?: string, period = '6m'): Promise<PortfolioPerformanceData[]> {
    const endpoint = userAddress
      ? `/analytics/portfolio-performance/${userAddress}?period=${period}`
      : `/analytics/portfolio-performance?period=${period}`;
    return this.api.get<PortfolioPerformanceData[]>(endpoint);
  }

  async getStrategyDistribution(userAddress?: string): Promise<StrategyDistributionData[]> {
    const endpoint = userAddress
      ? `/analytics/strategy-distribution/${userAddress}`
      : '/analytics/strategy-distribution';
    return this.api.get<StrategyDistributionData[]>(endpoint);
  }

  async getYieldHistory(period = '7d'): Promise<YieldHistoryData[]> {
    return this.api.get<YieldHistoryData[]>(`/analytics/yield-history?period=${period}`);
  }

  async getSocialMetrics(): Promise<SocialMetrics> {
    return this.api.get<SocialMetrics>('/analytics/social-metrics');
  }

  async getSocialPerformance(period = '7d'): Promise<SocialPerformanceData[]> {
    return this.api.get<SocialPerformanceData[]>(`/analytics/social-performance?period=${period}`);
  }

  async getAIRecommendations(userAddress?: string, investmentAmount = 1000): Promise<AIRecommendation[]> {
    const params = new URLSearchParams();
    if (userAddress) params.append('userAddress', userAddress);
    params.append('amount', investmentAmount.toString());
    return this.api.get<AIRecommendation[]>(`/ai/recommendations?${params.toString()}`);
  }

  async getUserRiskProfile(userAddress: string): Promise<EnhancedUserRiskProfile> {
    return this.api.get<EnhancedUserRiskProfile>(`/ai/risk-profile/${userAddress}`);
  }

  async getMLMetrics(): Promise<MLMetrics> {
    return this.api.get<MLMetrics>('/ai/ml-metrics');
  }

  async getPortfolioRadarData(userAddress?: string): Promise<RadarData[]> {
    const endpoint = userAddress
      ? `/ai/portfolio-radar/${userAddress}`
      : '/ai/portfolio-radar';
    return this.api.get<RadarData[]>(endpoint);
  }

  async getPerformancePrediction(strategyId?: number, amount = 1000): Promise<PerformancePrediction[]> {
    const params = new URLSearchParams();
    if (strategyId) params.append('strategyId', strategyId.toString());
    params.append('amount', amount.toString());
    return this.api.get<PerformancePrediction[]>(`/ai/performance-prediction?${params.toString()}`);
  }

  async getStrategyComparison(): Promise<StrategyComparison[]> {
    return this.api.get<StrategyComparison[]>('/ai/strategy-comparison');
  }
}

export class SocialService {
  constructor(private api: APIClient) {}

  async getSocialStrategies(filter?: {
    riskLevel?: 'low' | 'medium' | 'high';
    category?: string;
    minAPY?: number;
    maxAPY?: number;
    sort?: 'apy' | 'performance' | 'followers' | 'recent';
  }): Promise<SocialStrategy[]> {
    const params = new URLSearchParams();
    if (filter) {
      Object.entries(filter).forEach(([key, value]) => {
        if (value !== undefined) params.append(key, value.toString());
      });
    }
    return this.api.get<SocialStrategy[]>(`/social/strategies?${params.toString()}`);
  }

  async getSocialFeed(page = 1, limit = 20): Promise<{
    posts: SocialFeedPost[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
    return this.api.get(`/social/feed?page=${page}&limit=${limit}`);
  }

  async likePost(postId: string): Promise<{ success: boolean; likes: number }> {
    return this.api.post(`/social/posts/${postId}/like`);
  }

  async sharePost(postId: string): Promise<{ success: boolean; shares: number }> {
    return this.api.post(`/social/posts/${postId}/share`);
  }

  async followStrategy(strategyId: number): Promise<{ success: boolean; message: string }> {
    return this.api.post(`/social/strategies/${strategyId}/follow`);
  }

  async copyStrategy(strategyId: number, amount: number): Promise<{ success: boolean; message: string; copyId: string }> {
    return this.api.post(`/social/strategies/${strategyId}/copy`, { amount });
  }
}

export class GameService {
  constructor(private api: APIClient) {}

  async getAllMissions(): Promise<Mission[]> {
    return this.api.get<Mission[]>('/game/missions');
  }

  async getUserMissions(userAddress: string): Promise<UserMissionData> {
    return this.api.get<UserMissionData>(`/game/missions/${userAddress}`);
  }

  async getLeaderboard(category = 'overall', period = 'all', limit = 50): Promise<LeaderboardData> {
    return this.api.get<LeaderboardData>(`/game/leaderboard?category=${category}&period=${period}&limit=${limit}`);
  }

  async getUserStats(userAddress: string): Promise<UserStats> {
    return this.api.get<UserStats>(`/game/user-stats/${userAddress}`);
  }

  async claimReward(userAddress: string, missionId: number): Promise<{
    message: string;
    rewards: { points: number; usdt: number };
    missionId: number;
    claimedAt: string;
  }> {
    return this.api.post('/game/claim-reward', {
      userAddress,
      missionId
    });
  }
}

// =======================================================
// WEBSOCKET SERVICE FOR REAL-TIME UPDATES
// =======================================================

export class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private listeners: Map<string, Function[]> = new Map();

  constructor(private wsUrl: string = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001') {}

  connect(): void {
    try {
      this.ws = new WebSocket(this.wsUrl);

      this.ws.onopen = () => {
        console.log('🔗 WebSocket connected');
        this.reconnectAttempts = 0;
        this.emit('connected', true);
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.emit(data.type, data.payload);
        } catch (error) {
          console.error('WebSocket message parse error:', error);
        }
      };

      this.ws.onclose = () => {
        console.log('🔌 WebSocket disconnected');
        this.emit('connected', false);
        this.handleReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.emit('error', error);
      };
    } catch (error) {
      console.error('WebSocket connection error:', error);
      this.handleReconnect();
    }
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

      console.log(`🔄 Attempting WebSocket reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);

      setTimeout(() => {
        this.connect();
      }, delay);
    } else {
      console.error('💀 WebSocket max reconnection attempts reached');
    }
  }

  subscribe(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  unsubscribe(event: string, callback: Function): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      const index = eventListeners.indexOf(callback);
      if (index > -1) {
        eventListeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => callback(data));
    }
  }

  send(type: string, payload: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, payload }));
    } else {
      console.warn('WebSocket not connected - cannot send message');
    }
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.listeners.clear();
  }
}

// =======================================================
// MAIN API SERVICE INSTANCE
// =======================================================

export class KaiaYieldAPI {
  private apiClient: APIClient;
  public strategies: StrategiesService;
  public yield: YieldService;
  public analytics: AnalyticsService;
  public social: SocialService;
  public game: GameService;
  public websocket: WebSocketService;

  constructor() {
    this.apiClient = new APIClient();
    this.strategies = new StrategiesService(this.apiClient);
    this.yield = new YieldService(this.apiClient);
    this.analytics = new AnalyticsService(this.apiClient);
    this.social = new SocialService(this.apiClient);
    this.game = new GameService(this.apiClient);
    this.websocket = new WebSocketService();
  }

  // Initialize WebSocket connection
  initializeRealTimeUpdates(): void {
    this.websocket.connect();

    // Subscribe to relevant real-time events
    this.websocket.subscribe('strategy_apy_update', (data: any) => {
      console.log('📈 Strategy APY updated:', data);
      // Emit custom event for components to listen to
      window.dispatchEvent(new CustomEvent('strategy-apy-update', { detail: data }));
    });

    this.websocket.subscribe('new_deposit', (data: any) => {
      console.log('💰 New deposit:', data);
      window.dispatchEvent(new CustomEvent('new-deposit', { detail: data }));
    });

    this.websocket.subscribe('mission_completed', (data: any) => {
      console.log('🎯 Mission completed:', data);
      window.dispatchEvent(new CustomEvent('mission-completed', { detail: data }));
    });

    this.websocket.subscribe('leaderboard_update', (data: any) => {
      console.log('🏆 Leaderboard updated:', data);
      window.dispatchEvent(new CustomEvent('leaderboard-update', { detail: data }));
    });
  }

  // Clean up connections
  disconnect(): void {
    this.websocket.disconnect();
  }
}

// Export singleton instance
export const kaiaAPI = new KaiaYieldAPI();

// Export individual services for convenience
export const { strategies, yield: yieldService, analytics, social, game, websocket } = kaiaAPI;

// Export default
export default kaiaAPI;