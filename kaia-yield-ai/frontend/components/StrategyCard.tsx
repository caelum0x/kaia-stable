import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  Shield,
  AlertTriangle,
  Star,
  ChevronRight,
  Target,
  DollarSign,
  Sparkles,
  Zap,
  Lock,
  Activity
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
  const [isHovered, setIsHovered] = useState(false);

  const getRiskColor = (riskLevel: number) => {
    if (riskLevel <= 3) return 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/30 text-emerald-400';
    if (riskLevel <= 6) return 'from-amber-500/20 to-amber-600/10 border-amber-500/30 text-amber-400';
    return 'from-red-500/20 to-red-600/10 border-red-500/30 text-red-400';
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
      whileHover={{ scale: 1.02 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className={`
        relative overflow-hidden backdrop-blur-xl rounded-2xl 
        bg-gradient-to-br from-slate-900/90 to-slate-800/90 
        border border-slate-700/50 shadow-xl shadow-black/20
        ${isRecommended ? 'ring-2 ring-cyan-500/50 border-cyan-500/50' : 'hover:border-slate-600/50'}
        ${compact ? 'p-4' : 'p-6'}
        transition-all duration-300 cursor-pointer group
      `}
      onClick={handleViewDetails}
    >
      {/* Animated Background Elements */}
      <div className="absolute inset-0 opacity-20">
        <motion.div
          animate={{
            background: isHovered 
              ? ["radial-gradient(circle at 20% 80%, rgba(0,255,255,0.1) 0%, transparent 50%)",
                 "radial-gradient(circle at 80% 20%, rgba(147,51,234,0.1) 0%, transparent 50%)",
                 "radial-gradient(circle at 40% 40%, rgba(236,72,153,0.1) 0%, transparent 50%)"]
              : ["radial-gradient(circle at 50% 50%, rgba(30,41,59,0.1) 0%, transparent 70%)"]
          }}
          transition={{ duration: 3, repeat: Infinity, repeatType: "reverse" }}
          className="absolute inset-0"
        />
      </div>

      {/* Recommended Badge */}
      {isRecommended && (
        <motion.div
          initial={{ scale: 0, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          className="absolute top-4 right-4 z-20"
        >
          <div className="flex items-center space-x-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
            <Sparkles className="h-3 w-3" />
            <span>AI Pick</span>
          </div>
        </motion.div>
      )}

      {/* Header */}
      <div className="relative z-10 flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <motion.div
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.6 }}
              className="p-2 rounded-xl bg-gradient-to-br from-slate-800 to-slate-700 border border-slate-600/50"
            >
              {strategy.riskLevel <= 3 ? (
                <Shield className="h-5 w-5 text-emerald-400" />
              ) : strategy.riskLevel <= 6 ? (
                <Target className="h-5 w-5 text-amber-400" />
              ) : (
                <Zap className="h-5 w-5 text-red-400" />
              )}
            </motion.div>
            
            <div>
              <h3 className={`font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent ${compact ? 'text-lg' : 'text-xl'}`}>
                {strategy.name}
              </h3>
              {strategy.category && (
                <span className="inline-flex items-center px-2 py-1 text-xs bg-slate-800/50 text-slate-300 rounded-lg border border-slate-600/30 mt-1">
                  <Activity className="h-3 w-3 mr-1" />
                  {strategy.category}
                </span>
              )}
            </div>
          </div>

          {!compact && strategy.description && (
            <p className="text-sm text-slate-400 font-light tracking-wide">
              {strategy.description}
            </p>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {strategy.performance && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`
                flex items-center space-x-1 px-3 py-1 rounded-lg backdrop-blur-sm border text-xs font-semibold
                ${strategy.performance.trend === 'up' 
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                  strategy.performance.trend === 'down' 
                    ? 'bg-red-500/10 text-red-400 border-red-500/30' :
                    'bg-slate-500/10 text-slate-400 border-slate-500/30'}
              `}
            >
              <motion.div
                animate={{ y: strategy.performance.trend === 'up' ? -2 : strategy.performance.trend === 'down' ? 2 : 0 }}
                transition={{ repeat: Infinity, duration: 1, repeatType: "reverse" }}
              >
                <TrendingUp className={`h-3 w-3 ${
                  strategy.performance.trend === 'down' ? 'rotate-180' : ''
                }`} />
              </motion.div>
              <span>{strategy.performance.change.toFixed(1)}%</span>
            </motion.div>
          )}

          <motion.div
            animate={{ rotate: isExpanded ? 90 : 0 }}
            transition={{ duration: 0.2 }}
            className="p-1 rounded-lg bg-slate-800/50 border border-slate-600/30"
          >
            <ChevronRight className="h-4 w-4 text-slate-400" />
          </motion.div>
        </div>
      </div>

      {/* Main Metrics */}
      <div className="relative z-10 grid grid-cols-2 gap-4 mb-4">
        {/* APY */}
        <motion.div 
          whileHover={{ scale: 1.05 }}
          className="text-center p-4 bg-gradient-to-br from-cyan-500/10 to-blue-600/5 rounded-2xl border border-cyan-500/20 backdrop-blur-sm"
        >
          <div className="flex items-center justify-center mb-2">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            >
              <TrendingUp className="h-4 w-4 text-cyan-400 mr-1" />
            </motion.div>
            <span className="text-xs font-semibold text-cyan-300 uppercase tracking-wide">APY</span>
          </div>
          <motion.div 
            className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", bounce: 0.5 }}
          >
            {formatAPY(strategy.apy)}%
          </motion.div>
        </motion.div>

        {/* Risk Level */}
        <motion.div 
          whileHover={{ scale: 1.05 }}
          className={`text-center p-4 rounded-2xl border backdrop-blur-sm bg-gradient-to-br ${getRiskColor(strategy.riskLevel)}`}
        >
          <div className="flex items-center justify-center mb-2">
            <RiskIcon className="h-4 w-4 mr-1" />
            <span className="text-xs font-semibold uppercase tracking-wide">Risk</span>
          </div>
          <motion.div 
            className="text-sm font-bold"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {getRiskText(strategy.riskLevel)}
          </motion.div>
        </motion.div>
      </div>

      {/* Investment Range */}
      {!compact && (
        <div className="relative z-10 flex items-center justify-between text-sm text-slate-400 mb-4 p-3 bg-slate-800/30 rounded-xl border border-slate-700/30">
          <div className="flex items-center space-x-2">
            <DollarSign className="h-4 w-4 text-emerald-400" />
            <span>Min: <span className="text-white font-semibold">${parseFloat(strategy.minDeposit).toLocaleString()}</span></span>
          </div>
          <div className="w-px h-4 bg-slate-600" />
          <div className="flex items-center space-x-2">
            <span>Max: <span className="text-white font-semibold">${parseFloat(strategy.maxDeposit).toLocaleString()}</span></span>
          </div>
        </div>
      )}

      {/* User Position */}
      {userDeposited > 0 && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="relative z-10 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-2xl p-4 mb-4 border border-blue-500/20 backdrop-blur-sm"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-blue-300 flex items-center">
              <Lock className="h-4 w-4 mr-2" />
              Your Position
            </span>
            <span className="text-lg font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              ${userDeposited.toLocaleString()}
            </span>
          </div>
          <div className="text-xs text-blue-300/80">
            Estimated annual yield: <span className="text-cyan-400 font-semibold">${(userDeposited * strategy.apy / 10000).toFixed(2)}</span>
          </div>
        </motion.div>
      )}

      {/* Expanded Details */}
      <AnimatePresence>
        {isExpanded && !compact && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="relative z-10 border-t border-slate-700/50 pt-4 mt-4"
          >
            <div className="grid grid-cols-2 gap-4 text-sm">
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="space-y-1"
              >
                <span className="text-slate-500">Strategy Type:</span>
                <div className="font-semibold text-slate-200">{strategy.category || 'Yield Farming'}</div>
              </motion.div>
              
              <motion.div
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="space-y-1"
              >
                <span className="text-slate-500">Status:</span>
                <div className={`font-semibold flex items-center ${strategy.active ? 'text-emerald-400' : 'text-red-400'}`}>
                  <div className={`w-2 h-2 rounded-full mr-2 ${strategy.active ? 'bg-emerald-400' : 'bg-red-400'}`} />
                  {strategy.active ? 'Active' : 'Inactive'}
                </div>
              </motion.div>
              
              {strategy.totalDeposited && (
                <>
                  <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="space-y-1"
                  >
                    <span className="text-slate-500">Total Locked:</span>
                    <div className="font-semibold text-slate-200">${strategy.totalDeposited.toLocaleString()}</div>
                  </motion.div>
                  
                  <motion.div
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="space-y-1"
                  >
                    <span className="text-slate-500">Risk Score:</span>
                    <div className="font-semibold text-slate-200">{strategy.riskLevel}/10</div>
                  </motion.div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Actions */}
      {showActions && strategy.active && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="relative z-10 flex space-x-3 mt-4"
        >
          {onInvest && (
            <motion.button
              whileHover={{ 
                scale: 1.02,
                boxShadow: "0 10px 25px rgba(0, 255, 255, 0.2)"
              }}
              whileTap={{ scale: 0.98 }}
              onClick={handleInvest}
              className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-6 py-3 rounded-xl font-semibold text-sm hover:from-cyan-400 hover:to-blue-500 transition-all duration-300 shadow-lg shadow-cyan-500/25"
            >
              <span className="flex items-center justify-center">
                <Zap className="h-4 w-4 mr-2" />
                {userDeposited > 0 ? 'Add More' : 'Invest Now'}
              </span>
            </motion.button>
          )}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={(e) => {
              e.stopPropagation();
              handleViewDetails();
            }}
            className="px-6 py-3 border border-slate-600/50 text-slate-300 rounded-xl font-semibold text-sm hover:bg-slate-800/50 hover:border-slate-500/50 transition-all duration-300 backdrop-blur-sm"
          >
            Details
          </motion.button>
        </motion.div>
      )}

      {/* Glow Effects */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-500/5 via-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
      
      {/* Corner Accent */}
      <div className="absolute bottom-0 right-0 w-24 h-24 bg-gradient-to-tl from-cyan-500/10 to-transparent rounded-2xl" />
    </motion.div>
  );
}