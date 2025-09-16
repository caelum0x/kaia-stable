import { motion } from 'framer-motion';
import {
  TrendingUp,
  Shield,
  AlertTriangle,
  Star,
  ChevronRight,
  Target,
  DollarSign
} from 'lucide-react';
import { useState } from 'react';

interface Strategy {
  id: number;
  name: string;
  apy: number;
  riskLevel: number;
  minDeposit: string;
  maxDeposit: string;
  active: boolean;
  category?: string;
  description?: string;
  totalDeposited?: number;
  performance?: {
    trend: 'up' | 'down' | 'stable';
    change: number;
  };
}

interface StrategyCardProps {
  strategy: Strategy;
  userDeposited?: number;
  isRecommended?: boolean;
  onInvest?: (strategyId: number) => void;
  onViewDetails?: (strategyId: number) => void;
  showActions?: boolean;
  compact?: boolean;
}

export default function StrategyCard({
  strategy,
  userDeposited = 0,
  isRecommended = false,
  onInvest,
  onViewDetails,
  showActions = true,
  compact = false
}: StrategyCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getRiskColor = (riskLevel: number) => {
    if (riskLevel <= 3) return 'text-green-600 bg-green-50';
    if (riskLevel <= 6) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getRiskText = (riskLevel: number) => {
    if (riskLevel <= 3) return 'Low Risk';
    if (riskLevel <= 6) return 'Medium Risk';
    return 'High Risk';
  };

  const getRiskIcon = (riskLevel: number) => {
    if (riskLevel <= 3) return Shield;
    if (riskLevel <= 6) return Target;
    return AlertTriangle;
  };

  const formatAPY = (apy: number) => {
    return (apy / 100).toFixed(2);
  };

  const handleInvest = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onInvest) {
      onInvest(strategy.id);
    }
  };

  const handleViewDetails = () => {
    if (onViewDetails) {
      onViewDetails(strategy.id);
    } else {
      setIsExpanded(!isExpanded);
    }
  };

  const RiskIcon = getRiskIcon(strategy.riskLevel);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`
        bg-white rounded-lg border border-gray-200 overflow-hidden
        ${isRecommended ? 'ring-2 ring-primary-500 border-primary-200' : 'hover:shadow-md'}
        ${compact ? 'p-3' : 'p-4'}
        transition-all duration-200 cursor-pointer
      `}
      onClick={handleViewDetails}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            {isRecommended && (
              <Star className="h-4 w-4 text-yellow-500 fill-current" />
            )}
            <h3 className={`font-semibold text-gray-900 ${compact ? 'text-sm' : 'text-base'}`}>
              {strategy.name}
            </h3>
            {strategy.category && (
              <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">
                {strategy.category}
              </span>
            )}
          </div>

          {!compact && strategy.description && (
            <p className="text-sm text-gray-600 mb-2">
              {strategy.description}
            </p>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {strategy.performance && (
            <div className={`
              flex items-center space-x-1 px-2 py-1 rounded-full text-xs
              ${strategy.performance.trend === 'up' ? 'bg-green-50 text-green-700' :
                strategy.performance.trend === 'down' ? 'bg-red-50 text-red-700' :
                'bg-gray-50 text-gray-700'}
            `}>
              <TrendingUp className={`h-3 w-3 ${
                strategy.performance.trend === 'down' ? 'rotate-180' : ''
              }`} />
              <span>{strategy.performance.change.toFixed(1)}%</span>
            </div>
          )}

          <ChevronRight className={`h-4 w-4 text-gray-400 transition-transform ${
            isExpanded ? 'rotate-90' : ''
          }`} />
        </div>
      </div>

      {/* Main Metrics */}
      <div className="grid grid-cols-2 gap-4 mb-3">
        {/* APY */}
        <div className="text-center p-3 bg-primary-50 rounded-lg">
          <div className="flex items-center justify-center mb-1">
            <TrendingUp className="h-4 w-4 text-primary-600 mr-1" />
            <span className="text-xs font-medium text-primary-700">APY</span>
          </div>
          <div className="text-lg font-bold text-primary-900">
            {formatAPY(strategy.apy)}%
          </div>
        </div>

        {/* Risk Level */}
        <div className={`text-center p-3 rounded-lg ${getRiskColor(strategy.riskLevel)}`}>
          <div className="flex items-center justify-center mb-1">
            <RiskIcon className="h-4 w-4 mr-1" />
            <span className="text-xs font-medium">Risk</span>
          </div>
          <div className="text-sm font-semibold">
            {getRiskText(strategy.riskLevel)}
          </div>
        </div>
      </div>

      {/* Investment Range */}
      {!compact && (
        <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
          <div className="flex items-center">
            <DollarSign className="h-4 w-4 mr-1" />
            <span>Min: ${parseFloat(strategy.minDeposit).toLocaleString()}</span>
          </div>
          <div className="flex items-center">
            <span>Max: ${parseFloat(strategy.maxDeposit).toLocaleString()}</span>
          </div>
        </div>
      )}

      {/* User Position */}
      {userDeposited > 0 && (
        <div className="bg-blue-50 rounded-lg p-3 mb-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-900">Your Position</span>
            <span className="text-sm font-bold text-blue-900">
              ${userDeposited.toLocaleString()}
            </span>
          </div>
          <div className="text-xs text-blue-700 mt-1">
            Estimated annual yield: ${(userDeposited * strategy.apy / 10000).toFixed(2)}
          </div>
        </div>
      )}

      {/* Expanded Details */}
      {isExpanded && !compact && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="border-t border-gray-100 pt-3 mt-3"
        >
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Strategy Type:</span>
              <div className="font-medium">{strategy.category || 'Yield Farming'}</div>
            </div>
            <div>
              <span className="text-gray-600">Status:</span>
              <div className={`font-medium ${strategy.active ? 'text-green-600' : 'text-red-600'}`}>
                {strategy.active ? 'Active' : 'Inactive'}
              </div>
            </div>
            {strategy.totalDeposited && (
              <>
                <div>
                  <span className="text-gray-600">Total Locked:</span>
                  <div className="font-medium">${strategy.totalDeposited.toLocaleString()}</div>
                </div>
                <div>
                  <span className="text-gray-600">Risk Score:</span>
                  <div className="font-medium">{strategy.riskLevel}/10</div>
                </div>
              </>
            )}
          </div>
        </motion.div>
      )}

      {/* Actions */}
      {showActions && strategy.active && (
        <div className="flex space-x-2 mt-3">
          {onInvest && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleInvest}
              className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-primary-700 transition-colors"
            >
              {userDeposited > 0 ? 'Add More' : 'Invest'}
            </motion.button>
          )}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={(e) => {
              e.stopPropagation();
              handleViewDetails();
            }}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium text-sm hover:bg-gray-50 transition-colors"
          >
            Details
          </motion.button>
        </div>
      )}

      {/* Recommended Badge */}
      {isRecommended && (
        <div className="absolute top-2 right-2">
          <div className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">
            Recommended
          </div>
        </div>
      )}
    </motion.div>
  );
}