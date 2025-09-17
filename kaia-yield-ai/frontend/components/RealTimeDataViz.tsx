import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Zap,
  DollarSign,
  Percent,
  Users,
  Target,
  BarChart3,
  PieChart,
  LineChart,
  Maximize2,
  Minimize2,
  RefreshCw,
  Eye,
  EyeOff,
  Settings,
  Download,
  Share2,
  AlertTriangle
} from 'lucide-react';
import {
  AreaChart,
  Area,
  LineChart as RechartsLineChart,
  Line,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  ComposedChart,
  ReferenceLine
} from 'recharts';

interface DataPoint {
  timestamp: number;
  value: number;
  label?: string;
  extra?: any;
}

interface ChartConfig {
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
}

interface MetricDisplay {
  id: string;
  title: string;
  value: number;
  prevValue: number;
  format: 'currency' | 'percentage' | 'number' | 'apy';
  color: string;
  icon: any;
  chartData?: DataPoint[];
  chartConfig?: ChartConfig;
}

interface RealTimeDataVizProps {
  metrics: MetricDisplay[];
  updateInterval?: number;
  layout?: 'grid' | 'flex' | 'masonry';
  theme?: 'dark' | 'light';
  interactive?: boolean;
}

const RealTimeDataViz: React.FC<RealTimeDataVizProps> = ({
  metrics,
  updateInterval = 5000,
  layout = 'grid',
  theme = 'dark',
  interactive = true
}) => {
  const [data, setData] = useState<MetricDisplay[]>(metrics);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [expandedChart, setExpandedChart] = useState<string | null>(null);
  const [visibleMetrics, setVisibleMetrics] = useState<Set<string>>(
    new Set(metrics.map(m => m.id))
  );

  // Simulate real-time data updates
  const simulateDataUpdate = useCallback(() => {
    if (isPaused) return;

    setIsUpdating(true);
    setData(prevData => {
      return prevData.map(metric => {
        const variance = 0.05; // 5% variance
        const change = (Math.random() - 0.5) * variance;
        const newValue = metric.value * (1 + change);

        // Update chart data if it exists
        let newChartData = metric.chartData;
        if (metric.chartData && metric.chartConfig?.realTime) {
          const newPoint: DataPoint = {
            timestamp: Date.now(),
            value: newValue,
            label: new Date().toLocaleTimeString()
          };

          newChartData = [...metric.chartData.slice(-29), newPoint]; // Keep last 30 points
        }

        return {
          ...metric,
          prevValue: metric.value,
          value: newValue,
          chartData: newChartData
        };
      });
    });

    setTimeout(() => setIsUpdating(false), 500);
  }, [isPaused]);

  useEffect(() => {
    if (!isPaused) {
      const interval = setInterval(simulateDataUpdate, updateInterval);
      return () => clearInterval(interval);
    }
  }, [simulateDataUpdate, updateInterval, isPaused]);

  const formatValue = (value: number, format: string) => {
    switch (format) {
      case 'currency':
        return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      case 'percentage':
        return `${value.toFixed(2)}%`;
      case 'apy':
        return `${value.toFixed(1)}% APY`;
      case 'number':
        return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
      default:
        return value.toString();
    }
  };

  const getChangeColor = (current: number, previous: number) => {
    if (current > previous) return 'text-green-400';
    if (current < previous) return 'text-red-400';
    return 'text-gray-400';
  };

  const getChangeIcon = (current: number, previous: number) => {
    if (current > previous) return <TrendingUp className="w-4 h-4" />;
    if (current < previous) return <TrendingDown className="w-4 h-4" />;
    return <Activity className="w-4 h-4" />;
  };

  const getChangePercentage = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className={`p-3 rounded-lg border ${
          theme === 'dark'
            ? 'bg-black/90 border-white/20 text-white'
            : 'bg-white/90 border-gray-300 text-gray-900'
        }`}>
          <p className="text-sm font-semibold">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {formatValue(entry.value, 'number')}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const renderChart = (metric: MetricDisplay, isExpanded = false) => {
    if (!metric.chartData || !metric.chartConfig) return null;

    const { chartConfig, chartData } = metric;
    const height = isExpanded ? 400 : 150;

    const commonProps = {
      data: chartData,
      margin: { top: 5, right: 30, left: 20, bottom: 5 }
    };

    switch (chartConfig.type) {
      case 'area':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <AreaChart {...commonProps}>
              <defs>
                <linearGradient id={`gradient-${metric.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={chartConfig.color} stopOpacity={0.8}/>
                  <stop offset="95%" stopColor={chartConfig.color} stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              {chartConfig.showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#374151" />}
              <XAxis dataKey="label" stroke="#9CA3AF" fontSize={12} />
              <YAxis stroke="#9CA3AF" fontSize={12} />
              {chartConfig.showTooltip && <Tooltip content={<CustomTooltip />} />}
              <Area
                type="monotone"
                dataKey="value"
                stroke={chartConfig.color}
                fillOpacity={1}
                fill={`url(#gradient-${metric.id})`}
                strokeWidth={2}
                animationDuration={chartConfig.animated ? 300 : 0}
              />
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'line':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <RechartsLineChart {...commonProps}>
              {chartConfig.showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#374151" />}
              <XAxis dataKey="label" stroke="#9CA3AF" fontSize={12} />
              <YAxis stroke="#9CA3AF" fontSize={12} />
              {chartConfig.showTooltip && <Tooltip content={<CustomTooltip />} />}
              <Line
                type="monotone"
                dataKey="value"
                stroke={chartConfig.color}
                strokeWidth={2}
                dot={{ fill: chartConfig.color, strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: chartConfig.color, strokeWidth: 2 }}
                animationDuration={chartConfig.animated ? 300 : 0}
              />
            </RechartsLineChart>
          </ResponsiveContainer>
        );

      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart {...commonProps}>
              {chartConfig.showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#374151" />}
              <XAxis dataKey="label" stroke="#9CA3AF" fontSize={12} />
              <YAxis stroke="#9CA3AF" fontSize={12} />
              {chartConfig.showTooltip && <Tooltip content={<CustomTooltip />} />}
              <Bar
                dataKey="value"
                fill={chartConfig.color}
                radius={[4, 4, 0, 0]}
                animationDuration={chartConfig.animated ? 300 : 0}
              />
            </BarChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  const renderMetricCard = (metric: MetricDisplay) => {
    const change = getChangePercentage(metric.value, metric.prevValue);
    const isVisible = visibleMetrics.has(metric.id);

    return (
      <motion.div
        key={metric.id}
        layout
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{
          opacity: isVisible ? 1 : 0.3,
          scale: isVisible ? 1 : 0.95,
          filter: isVisible ? 'none' : 'grayscale(50%)'
        }}
        whileHover={{ scale: interactive ? 1.02 : 1 }}
        className={`relative overflow-hidden rounded-2xl border transition-all duration-300 ${
          theme === 'dark'
            ? 'bg-black/30 backdrop-blur-lg border-white/10 hover:border-white/20'
            : 'bg-white/80 backdrop-blur-lg border-gray-200 hover:border-gray-300'
        } ${expandedChart === metric.id ? 'col-span-full' : ''}`}
      >
        {/* Update Indicator */}
        <AnimatePresence>
          {isUpdating && (
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: '100%' }}
              exit={{ x: '200%' }}
              transition={{ duration: 0.5 }}
              className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-transparent via-blue-400 to-transparent z-10"
            />
          )}
        </AnimatePresence>

        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${metric.color.replace('text-', 'bg-').replace('400', '500/20')}`}>
                <metric.icon className={`w-5 h-5 ${metric.color}`} />
              </div>
              <div>
                <h3 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  {metric.title}
                </h3>
                <div className="flex items-center space-x-2 text-sm">
                  <span className={getChangeColor(metric.value, metric.prevValue)}>
                    {getChangeIcon(metric.value, metric.prevValue)}
                  </span>
                  <span className={getChangeColor(metric.value, metric.prevValue)}>
                    {change >= 0 ? '+' : ''}{change.toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {interactive && (
                <>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      const newVisible = new Set(visibleMetrics);
                      if (newVisible.has(metric.id)) {
                        newVisible.delete(metric.id);
                      } else {
                        newVisible.add(metric.id);
                      }
                      setVisibleMetrics(newVisible);
                    }}
                    className={`p-1 rounded ${theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
                  >
                    {isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </motion.button>

                  {metric.chartData && (
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setExpandedChart(expandedChart === metric.id ? null : metric.id)}
                      className={`p-1 rounded ${theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
                    >
                      {expandedChart === metric.id ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                    </motion.button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Value Display */}
          <div className="mb-4">
            <motion.div
              key={metric.value}
              initial={{ scale: 1.1 }}
              animate={{ scale: 1 }}
              className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}
            >
              {formatValue(metric.value, metric.format)}
            </motion.div>
          </div>

          {/* Chart */}
          {metric.chartData && isVisible && (
            <div className="relative">
              {renderChart(metric, expandedChart === metric.id)}

              {/* Real-time indicator */}
              {metric.chartConfig?.realTime && (
                <div className="absolute top-2 right-2 flex items-center space-x-1 text-xs">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>LIVE</span>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      {interactive && (
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsPaused(!isPaused)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-semibold transition-colors ${
                isPaused
                  ? 'bg-green-500 text-white hover:bg-green-600'
                  : 'bg-red-500 text-white hover:bg-red-600'
              }`}
            >
              {isPaused ? <Zap className="w-4 h-4" /> : <RefreshCw className="w-4 h-4" />}
              <span>{isPaused ? 'Resume' : 'Pause'}</span>
            </motion.button>

            <div className="flex items-center space-x-2">
              <Activity className={`w-4 h-4 ${isUpdating ? 'text-green-400' : 'text-gray-400'}`} />
              <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                {isUpdating ? 'Updating...' : 'Real-time data'}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <motion.button
              whileTap={{ scale: 0.95 }}
              className={`p-2 rounded-lg ${theme === 'dark' ? 'text-gray-400 hover:text-white hover:bg-white/10' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}
            >
              <Download className="w-4 h-4" />
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.95 }}
              className={`p-2 rounded-lg ${theme === 'dark' ? 'text-gray-400 hover:text-white hover:bg-white/10' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}
            >
              <Share2 className="w-4 h-4" />
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.95 }}
              className={`p-2 rounded-lg ${theme === 'dark' ? 'text-gray-400 hover:text-white hover:bg-white/10' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}
            >
              <Settings className="w-4 h-4" />
            </motion.button>
          </div>
        </div>
      )}

      {/* Metrics Grid */}
      <div className={`grid gap-6 ${
        layout === 'grid'
          ? 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3'
          : layout === 'flex'
          ? 'flex flex-wrap'
          : 'columns-1 lg:columns-2 xl:columns-3'
      }`}>
        {data.map(metric => renderMetricCard(metric))}
      </div>

      {/* Summary Stats */}
      <div className={`grid grid-cols-2 lg:grid-cols-4 gap-4 p-6 rounded-2xl border ${
        theme === 'dark'
          ? 'bg-black/20 border-white/10'
          : 'bg-white/60 border-gray-200'
      }`}>
        <div className="text-center">
          <div className={`text-2xl font-bold ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>
            {data.filter(m => m.value > m.prevValue).length}
          </div>
          <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            Trending Up
          </div>
        </div>

        <div className="text-center">
          <div className={`text-2xl font-bold ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>
            {data.filter(m => m.value < m.prevValue).length}
          </div>
          <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            Trending Down
          </div>
        </div>

        <div className="text-center">
          <div className={`text-2xl font-bold ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>
            {visibleMetrics.size}
          </div>
          <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            Active Metrics
          </div>
        </div>

        <div className="text-center">
          <div className={`text-2xl font-bold ${theme === 'dark' ? 'text-purple-400' : 'text-purple-600'}`}>
            {isPaused ? 'PAUSED' : 'LIVE'}
          </div>
          <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            Status
          </div>
        </div>
      </div>
    </div>
  );
};

export default RealTimeDataViz;