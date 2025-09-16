import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot,
  TrendingUp,
  Shield,
  Target,
  Lightbulb,
  ChevronRight,
  RefreshCw,
  Star,
  Brain,
  AlertCircle
} from 'lucide-react';
import StrategyCard from './StrategyCard';

interface AIRecommendation {
  strategy_id: number;
  strategy_name: string;
  score: number;
  confidence: 'High' | 'Medium' | 'Low';
  explanation: string;
  expected_return: string;
  strategy?: {
    id: number;
    name: string;
    apy: number;
    riskLevel: number;
    minDeposit: string;
    maxDeposit: string;
    riskText: string;
    apyFormatted: string;
  };
  marketConditions?: {
    volatility: string;
    trend: string;
    outlook: string;
  };
}

interface UserProfile {
  riskTolerance: number;
  experienceLevel: string;
  portfolioDiversification: number;
  totalDeposited: number;
}

interface AIRecommendationsProps {
  userAddress: string;
  onInvestClick?: (strategyId: number) => void;
  showDetails?: boolean;
}

export default function AIRecommendations({
  userAddress,
  onInvestClick,
  showDetails = true
}: AIRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'recommendations' | 'insights'>('recommendations');

  useEffect(() => {
    if (userAddress) {
      fetchRecommendations();
    }
  }, [userAddress]);

  const fetchRecommendations = async () => {
    if (!userAddress) return;

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/ai/recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address: userAddress,
          riskTolerance: 5, // Default value
          investmentAmount: 100, // Default value
          preferences: {
            maxRisk: 7,
            minApy: 500,
            diversification: true
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch recommendations');
      }

      const data = await response.json();

      if (data.success) {
        setRecommendations(data.data.recommendations || []);
        setUserProfile(data.data.userProfile || null);
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (err) {
      console.error('Recommendations fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load recommendations');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshRecommendations = async () => {
    setIsRefreshing(true);
    await fetchRecommendations();
    setIsRefreshing(false);
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'High': return 'text-green-600 bg-green-50';
      case 'Medium': return 'text-yellow-600 bg-yellow-50';
      case 'Low': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getConfidenceIcon = (confidence: string) => {
    switch (confidence) {
      case 'High': return Star;
      case 'Medium': return Target;
      case 'Low': return AlertCircle;
      default: return Bot;
    }
  };

  if (isLoading && recommendations.length === 0) {
    return (
      <div className="bg-white rounded-lg p-6 shadow-sm border">
        <div className="flex items-center space-x-3 mb-4">
          <div className="animate-spin">
            <Bot className="h-6 w-6 text-primary-500" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">AI Recommendations</h2>
        </div>

        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg p-6 shadow-sm border">
        <div className="flex items-center space-x-3 mb-4">
          <AlertCircle className="h-6 w-6 text-red-500" />
          <h2 className="text-lg font-semibold text-gray-900">AI Recommendations</h2>
        </div>

        <div className="text-center py-4">
          <p className="text-red-600 mb-3">{error}</p>
          <button
            onClick={fetchRecommendations}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-primary-100 p-2 rounded-lg">
              <Bot className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">AI Recommendations</h2>
              <p className="text-sm text-gray-600">Personalized strategies powered by machine learning</p>
            </div>
          </div>

          <button
            onClick={refreshRecommendations}
            disabled={isRefreshing}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 mt-4 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setSelectedTab('recommendations')}
            className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              selectedTab === 'recommendations'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Brain className="h-4 w-4 inline mr-2" />
            Strategies
          </button>
          <button
            onClick={() => setSelectedTab('insights')}
            className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              selectedTab === 'insights'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Lightbulb className="h-4 w-4 inline mr-2" />
            Insights
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <AnimatePresence mode="wait">
          {selectedTab === 'recommendations' ? (
            <motion.div
              key="recommendations"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              {recommendations.length === 0 ? (
                <div className="text-center py-8">
                  <Bot className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600">No recommendations available.</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Connect your wallet and make some deposits to get personalized recommendations.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recommendations.map((rec, index) => (
                    <motion.div
                      key={rec.strategy_id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="font-semibold text-gray-900">{rec.strategy_name}</h3>
                            <div className={`px-2 py-1 rounded-full text-xs font-medium ${getConfidenceColor(rec.confidence)}`}>
                              {rec.confidence} Confidence
                            </div>
                          </div>

                          <p className="text-sm text-gray-600 mb-3">{rec.explanation}</p>

                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">AI Score:</span>
                              <div className="font-semibold">{rec.score}/100</div>
                            </div>
                            <div>
                              <span className="text-gray-500">Expected Return:</span>
                              <div className="font-semibold text-green-600">${rec.expected_return}</div>
                            </div>
                            {rec.strategy && (
                              <div>
                                <span className="text-gray-500">APY:</span>
                                <div className="font-semibold">{rec.strategy.apyFormatted}</div>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col items-end space-y-2 ml-4">
                          {React.createElement(getConfidenceIcon(rec.confidence), {
                            className: `h-5 w-5 ${getConfidenceColor(rec.confidence).split(' ')[0]}`
                          })}

                          <div className="text-right">
                            <div className="text-lg font-bold text-gray-900">{rec.score}</div>
                            <div className="text-xs text-gray-500">AI Score</div>
                          </div>
                        </div>
                      </div>

                      {rec.marketConditions && (
                        <div className="bg-gray-50 rounded-lg p-3 mb-3">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Market Conditions:</span>
                            <div className="flex space-x-4">
                              <span>Volatility: {rec.marketConditions.volatility}</span>
                              <span>Trend: {rec.marketConditions.trend}</span>
                              <span>Outlook: {rec.marketConditions.outlook}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {onInvestClick && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => onInvestClick(rec.strategy_id)}
                            className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-primary-700 transition-colors"
                          >
                            Invest Now
                          </button>
                          <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium text-sm hover:bg-gray-50 transition-colors">
                            Learn More
                          </button>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="insights"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {userProfile ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <Shield className="h-5 w-5 text-blue-600" />
                        <span className="font-medium text-blue-900">Risk Profile</span>
                      </div>
                      <div className="text-2xl font-bold text-blue-900">{userProfile.riskTolerance}/10</div>
                      <div className="text-sm text-blue-700">{userProfile.experienceLevel}</div>
                    </div>

                    <div className="bg-green-50 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <Target className="h-5 w-5 text-green-600" />
                        <span className="font-medium text-green-900">Diversification</span>
                      </div>
                      <div className="text-2xl font-bold text-green-900">
                        {(userProfile.portfolioDiversification * 100).toFixed(0)}%
                      </div>
                      <div className="text-sm text-green-700">Portfolio spread</div>
                    </div>
                  </div>

                  <div className="bg-purple-50 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <TrendingUp className="h-5 w-5 text-purple-600" />
                      <span className="font-medium text-purple-900">Investment Summary</span>
                    </div>
                    <div className="text-2xl font-bold text-purple-900">
                      ${userProfile.totalDeposited.toLocaleString()}
                    </div>
                    <div className="text-sm text-purple-700">Total deposited</div>
                  </div>

                  <div className="bg-yellow-50 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-3">
                      <Lightbulb className="h-5 w-5 text-yellow-600" />
                      <span className="font-medium text-yellow-900">AI Insights</span>
                    </div>
                    <ul className="space-y-2 text-sm text-yellow-800">
                      <li className="flex items-start space-x-2">
                        <ChevronRight className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <span>Your risk tolerance allows for moderate-yield strategies</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <ChevronRight className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <span>Consider diversifying across {Math.ceil(userProfile.totalDeposited / 500)} strategies</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <ChevronRight className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <span>Current market conditions favor balanced approaches</span>
                      </li>
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Lightbulb className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600">No insights available.</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Start investing to get personalized insights.
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}