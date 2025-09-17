import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  TrendingUp,
  Shield,
  Target,
  Zap,
  Star,
  AlertCircle,
  ChevronRight,
  RefreshCw,
  Sparkles,
  Activity,
  BarChart3,
  Gauge,
  Award,
  ThumbsUp,
  ThumbsDown,
  Clock,
  DollarSign
} from 'lucide-react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar
} from 'recharts';
import { kaiaAPI, AIRecommendation, EnhancedUserRiskProfile, MLMetrics, RadarData, PerformancePrediction, StrategyComparison } from '../services/api';


interface AIRecommendationsEnhancedProps {
  userAddress?: string;
  investmentAmount?: number;
}

const AIRecommendationsEnhanced: React.FC<AIRecommendationsEnhancedProps> = ({
  userAddress,
  investmentAmount = 1000
}) => {
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [riskProfile, setRiskProfile] = useState<EnhancedUserRiskProfile | null>(null);
  const [mlMetrics, setMlMetrics] = useState<MLMetrics | null>(null);
  const [radarData, setRadarData] = useState<RadarData[]>([]);
  const [performancePrediction, setPerformancePrediction] = useState<PerformancePrediction[]>([]);
  const [strategyComparison, setStrategyComparison] = useState<StrategyComparison[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState<number | null>(null);


  const fetchAIRecommendations = async () => {
    setLoading(true);
    setAnalyzing(true);

    try {
      // Simulate AI processing time
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Fetch real AI data from backend
      const [aiRecommendations, userRiskData, mlMetricsData, radarChartData, performancePredData, strategyCompData] = await Promise.all([
        kaiaAPI.analytics.getAIRecommendations(userAddress, investmentAmount),
        userAddress ? kaiaAPI.analytics.getUserRiskProfile(userAddress) : null,
        kaiaAPI.analytics.getMLMetrics(),
        kaiaAPI.analytics.getPortfolioRadarData(userAddress),
        kaiaAPI.analytics.getPerformancePrediction(selectedStrategy || undefined, investmentAmount),
        kaiaAPI.analytics.getStrategyComparison()
      ]);

      setRecommendations(aiRecommendations);
      setRiskProfile(userRiskData);
      setMlMetrics(mlMetricsData);
      setRadarData(radarChartData);
      setPerformancePrediction(performancePredData);
      setStrategyComparison(strategyCompData);

    } catch (error) {
      console.error('Error fetching AI recommendations:', error);
      // Set empty/default states on error
      setRecommendations([]);
      setRiskProfile(null);
      setMlMetrics(null);
      setRadarData([]);
      setPerformancePrediction([]);
      setStrategyComparison([]);
    } finally {
      setLoading(false);
      setAnalyzing(false);
    }
  };

  useEffect(() => {
    fetchAIRecommendations();
  }, [userAddress, investmentAmount]);

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'High': return 'text-green-400 bg-green-500/20 border-green-500/30';
      case 'Medium': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
      case 'Low': return 'text-red-400 bg-red-500/20 border-red-500/30';
      default: return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
    }
  };

  const getRiskColor = (riskLevel: number) => {
    if (riskLevel <= 3) return 'text-green-400';
    if (riskLevel <= 6) return 'text-yellow-400';
    return 'text-red-400';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <motion.div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-purple-400 border-t-transparent rounded-full mx-auto mb-4"
          />
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="text-white"
          >
            <Brain className="w-8 h-8 mx-auto mb-2 text-purple-400" />
            <div className="text-lg font-semibold">AI Analyzing Your Profile...</div>
            <div className="text-sm text-gray-300">Processing market data and user patterns...</div>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-lg border-b border-white/10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <Brain className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  AI Yield Optimizer
                </h1>
                <p className="text-gray-300 text-sm">Powered by Machine Learning</p>
              </div>
            </div>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={fetchAIRecommendations}
              disabled={analyzing}
              className="flex items-center space-x-2 bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-2 rounded-lg font-semibold hover:shadow-lg transition-all duration-200"
            >
              <RefreshCw className={`w-4 h-4 ${analyzing ? 'animate-spin' : ''}`} />
              <span>Refresh AI</span>
            </motion.button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* ML Model Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-black/30 backdrop-blur-lg rounded-2xl p-6 border border-white/10"
        >
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <Activity className="w-5 h-5 mr-2 text-purple-400" />
            AI Model Status
          </h2>

          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{mlMetrics?.modelAccuracy?.toFixed(1) || '0.0'}%</div>
              <div className="text-sm text-gray-400">Model Accuracy</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">{mlMetrics?.predictionConfidence?.toFixed(1) || '0.0'}%</div>
              <div className="text-sm text-gray-400">Confidence</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">{mlMetrics?.dataQuality?.toFixed(1) || '0.0'}%</div>
              <div className="text-sm text-gray-400">Data Quality</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">{mlMetrics?.marketVolatility?.toFixed(1) || '0.0'}%</div>
              <div className="text-sm text-gray-400">Market Volatility</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-bold text-gray-300">{mlMetrics?.lastTraining || 'N/A'}</div>
              <div className="text-sm text-gray-400">Last Training</div>
            </div>
          </div>
        </motion.div>

        {/* Risk Profile Analysis */}
        {riskProfile && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            {/* Risk Profile */}
            <div className="bg-black/30 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Shield className="w-5 h-5 mr-2 text-blue-400" />
                Risk Profile Analysis
              </h3>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Risk Tolerance</span>
                  <div className="flex items-center">
                    <div className="w-32 h-2 bg-gray-700 rounded-full mr-2">
                      <div
                        className="h-2 bg-gradient-to-r from-green-400 to-red-400 rounded-full"
                        style={{ width: `${(riskProfile.riskTolerance / 10) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-bold">{riskProfile.riskTolerance}/10</span>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Diversification</span>
                  <div className="flex items-center">
                    <div className="w-32 h-2 bg-gray-700 rounded-full mr-2">
                      <div
                        className="h-2 bg-blue-400 rounded-full"
                        style={{ width: `${riskProfile.diversification}%` }}
                      />
                    </div>
                    <span className="text-sm font-bold">{riskProfile.diversification}%</span>
                  </div>
                </div>

                <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-400 mb-2">AI Insights</h4>
                  {riskProfile.recommendations.map((rec, index) => (
                    <div key={index} className="text-sm text-gray-300 mb-1">• {rec}</div>
                  ))}
                </div>
              </div>
            </div>

            {/* Portfolio Radar */}
            <div className="bg-black/30 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Target className="w-5 h-5 mr-2 text-purple-400" />
                Portfolio Analysis
              </h3>

              <ResponsiveContainer width="100%" height={250}>
                <RadarChart data={radarData}>
                  <PolarGrid gridType="polygon" />
                  <PolarAngleAxis dataKey="metric" tick={{ fontSize: 12, fill: '#9CA3AF' }} />
                  <PolarRadiusAxis
                    angle={90}
                    domain={[0, 100]}
                    tick={{ fontSize: 10, fill: '#9CA3AF' }}
                  />
                  <Radar
                    name="Score"
                    dataKey="value"
                    stroke="#8B5CF6"
                    fill="#8B5CF6"
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}

        {/* Strategy Recommendations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          <h2 className="text-xl font-bold flex items-center">
            <Sparkles className="w-6 h-6 mr-2 text-yellow-400" />
            AI-Powered Recommendations
          </h2>

          {recommendations.map((rec, index) => (
            <motion.div
              key={rec.strategy_id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-black/30 backdrop-blur-lg rounded-2xl border border-white/10 overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-xl font-bold">{rec.strategy_name}</h3>
                      <div className={`px-3 py-1 rounded-full text-xs font-bold border ${getConfidenceColor(rec.confidence)}`}>
                        {rec.confidence} Confidence
                      </div>
                      <div className="text-xs bg-gray-700 px-2 py-1 rounded">
                        #{index + 1} Recommended
                      </div>
                    </div>

                    <p className="text-gray-300 text-sm mb-4">{rec.explanation}</p>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-3">
                        <div className="text-green-400 text-sm">AI Score</div>
                        <div className="text-xl font-bold">{rec.score.toFixed(1)}/100</div>
                      </div>

                      <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-3">
                        <div className="text-blue-400 text-sm">APY</div>
                        <div className="text-xl font-bold">{(rec.apy / 100).toFixed(1)}%</div>
                      </div>

                      <div className="bg-purple-500/20 border border-purple-500/30 rounded-lg p-3">
                        <div className="text-purple-400 text-sm">Risk Level</div>
                        <div className={`text-xl font-bold ${getRiskColor(rec.risk_level)}`}>
                          {rec.risk_level}/10
                        </div>
                      </div>

                      <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-3">
                        <div className="text-yellow-400 text-sm">Expected Return</div>
                        <div className="text-xl font-bold">${rec.expected_return.toFixed(2)}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex items-center space-x-2 bg-green-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-600 transition-colors"
                    >
                      <ThumbsUp className="w-4 h-4" />
                      <span>Invest Now</span>
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedStrategy(selectedStrategy === rec.strategy_id ? null : rec.strategy_id)}
                      className="flex items-center space-x-2 bg-blue-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-600 transition-colors"
                    >
                      <BarChart3 className="w-4 h-4" />
                      <span>Details</span>
                    </motion.button>
                  </div>

                  <div className="flex items-center text-gray-400">
                    <Clock className="w-4 h-4 mr-1" />
                    <span className="text-sm">Updated 5 min ago</span>
                  </div>
                </div>

                {/* Expanded Details */}
                <AnimatePresence>
                  {selectedStrategy === rec.strategy_id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-6 pt-6 border-t border-white/10"
                    >
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Performance Prediction */}
                        <div>
                          <h4 className="font-semibold mb-3 flex items-center">
                            <TrendingUp className="w-4 h-4 mr-2" />
                            6-Month Performance Prediction
                          </h4>
                          <ResponsiveContainer width="100%" height={200}>
                            <AreaChart data={performancePrediction}>
                              <defs>
                                <linearGradient id="predictedGradient" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                              <XAxis dataKey="month" stroke="#9CA3AF" fontSize={12} />
                              <YAxis stroke="#9CA3AF" fontSize={12} />
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
                                dataKey="conservative"
                                stroke="#6B7280"
                                fill="transparent"
                                strokeDasharray="5 5"
                                strokeWidth={1}
                              />
                              <Area
                                type="monotone"
                                dataKey="predicted"
                                stroke="#3B82F6"
                                fillOpacity={1}
                                fill="url(#predictedGradient)"
                                strokeWidth={2}
                              />
                              <Area
                                type="monotone"
                                dataKey="optimistic"
                                stroke="#10B981"
                                fill="transparent"
                                strokeDasharray="5 5"
                                strokeWidth={1}
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>

                        {/* Strategy Comparison */}
                        <div>
                          <h4 className="font-semibold mb-3 flex items-center">
                            <BarChart3 className="w-4 h-4 mr-2" />
                            Strategy Comparison
                          </h4>
                          <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={strategyComparison}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                              <XAxis dataKey="name" stroke="#9CA3AF" fontSize={12} />
                              <YAxis stroke="#9CA3AF" fontSize={12} />
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: 'rgba(0, 0, 0, 0.8)',
                                  border: '1px solid rgba(255, 255, 255, 0.1)',
                                  borderRadius: '8px',
                                  color: 'white'
                                }}
                              />
                              <Bar dataKey="score" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* AI Disclaimer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-4"
        >
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5" />
            <div className="text-sm text-yellow-100">
              <div className="font-semibold mb-1">AI-Generated Recommendations</div>
              <div className="text-yellow-200/80">
                These recommendations are generated by our machine learning model based on your risk profile,
                market conditions, and historical performance data. Past performance does not guarantee future results.
                Please conduct your own research before making investment decisions.
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AIRecommendationsEnhanced;