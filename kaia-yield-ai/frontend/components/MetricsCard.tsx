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
}

export default function MetricsCard({
  title,
  value,
  icon: Icon,
  color = "text-primary-600",
  subtitle,
  trend,
  onClick
}: MetricsCardProps) {
  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  return (
    <motion.div
      whileHover={{ scale: onClick ? 1.02 : 1 }}
      whileTap={{ scale: onClick ? 0.98 : 1 }}
      className={`
        bg-white rounded-lg p-4 shadow-sm border border-gray-200
        ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}
      `}
      onClick={handleClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <Icon className={`h-5 w-5 ${color}`} />
            <p className="text-sm font-medium text-gray-600">{title}</p>
          </div>

          <div className="space-y-1">
            <p className="text-2xl font-bold text-gray-900">{value}</p>

            {subtitle && (
              <p className="text-xs text-gray-500">{subtitle}</p>
            )}

            {trend && (
              <div className="flex items-center space-x-1">
                <div
                  className={`
                    text-xs font-medium flex items-center
                    ${trend.isPositive ? 'text-green-600' : 'text-red-600'}
                  `}
                >
                  <span className="mr-1">
                    {trend.isPositive ? '↗' : '↘'}
                  </span>
                  {Math.abs(trend.value).toFixed(1)}%
                </div>
                <span className="text-xs text-gray-400">vs last period</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}