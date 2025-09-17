import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface MetricsCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  color?: string;
  subtitle?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  onClick?: () => void;
  gradient?: string;
  pulse?: boolean;
}

export default function MetricsCard({
  title,
  value,
  icon: Icon,
  color = "text-cyan-400",
  subtitle,
  trend,
  onClick,
  gradient = "from-slate-900/90 to-slate-800/90",
  pulse = false
}: MetricsCardProps) {
  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ 
        scale: onClick ? 1.02 : 1,
        boxShadow: "0 20px 40px rgba(0, 255, 255, 0.1)"
      }}
      whileTap={{ scale: onClick ? 0.98 : 1 }}
      className={`
        relative overflow-hidden backdrop-blur-xl rounded-2xl p-6 
        bg-gradient-to-br ${gradient} border border-slate-700/50
        ${onClick ? 'cursor-pointer hover:border-cyan-500/50 transition-all duration-300' : ''}
        ${pulse ? 'animate-pulse' : ''}
        shadow-xl shadow-black/20
      `}
      onClick={handleClick}
    >
      {/* Futuristic border glow */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-500/10 via-purple-500/5 to-pink-500/10 opacity-0 hover:opacity-100 transition-opacity duration-500" />
      
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_70%)]" />
      </div>

      <div className="relative z-10 flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-4">
            <motion.div
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.6 }}
              className={`p-2 rounded-xl bg-gradient-to-br from-slate-800 to-slate-700 border border-slate-600/50`}
            >
              <Icon className={`h-5 w-5 ${color}`} />
            </motion.div>
            <p className="text-sm font-medium text-slate-300 tracking-wide uppercase">{title}</p>
          </div>

          <div className="space-y-3">
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1 }}
            >
              <p className="text-3xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                {value}
              </p>
            </motion.div>

            {subtitle && (
              <p className="text-xs text-slate-400 font-light tracking-wide">{subtitle}</p>
            )}

            {trend && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="flex items-center space-x-2"
              >
                <div
                  className={`
                    text-xs font-semibold flex items-center px-2 py-1 rounded-lg
                    backdrop-blur-sm border
                    ${trend.isPositive 
                      ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' 
                      : 'text-red-400 bg-red-500/10 border-red-500/30'
                    }
                  `}
                >
                  <motion.span 
                    className="mr-1"
                    animate={{ y: trend.isPositive ? -2 : 2 }}
                    transition={{ repeat: Infinity, duration: 1, repeatType: "reverse" }}
                  >
                    {trend.isPositive ? '↗' : '↘'}
                  </motion.span>
                  {Math.abs(trend.value).toFixed(1)}%
                </div>
                <span className="text-xs text-slate-500 tracking-wide">vs last period</span>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Animated corner accents */}
      <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-cyan-500/20 to-transparent rounded-2xl" />
      <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-purple-500/20 to-transparent rounded-2xl" />
    </motion.div>
  );
}