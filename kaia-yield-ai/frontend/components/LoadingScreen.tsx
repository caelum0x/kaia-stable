import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot,
  Sparkles,
  Zap,
  TrendingUp,
  Shield,
  Users,
  Star,
  Loader2,
  Crown,
  Heart,
  Target,
  Brain,
  Gamepad2
} from 'lucide-react';

interface LoadingScreenProps {
  message?: string;
  progress?: number;
  onComplete?: () => void;
  theme?: 'light' | 'dark';
  showTips?: boolean;
}

const loadingTips = [
  '🤖 AI is analyzing the best yield opportunities for you...',
  '🔍 Scanning thousands of DeFi protocols...',
  '📊 Calculating optimal risk-adjusted returns...',
  '🎯 Personalizing recommendations based on your profile...',
  '🚀 Almost ready to maximize your yields!',
  '💎 Preparing your gamified DeFi experience...',
  '🌟 Loading social trading features...',
  '⚡ Optimizing performance for lightning-fast trades...'
];

const floatingIcons = [
  { icon: Sparkles, color: 'text-yellow-400', delay: 0 },
  { icon: Zap, color: 'text-blue-400', delay: 0.2 },
  { icon: TrendingUp, color: 'text-green-400', delay: 0.4 },
  { icon: Shield, color: 'text-purple-400', delay: 0.6 },
  { icon: Users, color: 'text-pink-400', delay: 0.8 },
  { icon: Star, color: 'text-indigo-400', delay: 1.0 }
];

export default function LoadingScreen({
  message = 'Loading your DeFi experience...',
  progress = 0,
  onComplete,
  theme = 'dark',
  showTips = true
}: LoadingScreenProps) {
  const [currentTip, setCurrentTip] = useState(0);
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const [loadingStage, setLoadingStage] = useState(0);

  useEffect(() => {
    // Cycle through loading tips
    if (showTips) {
      const tipInterval = setInterval(() => {
        setCurrentTip((prev) => (prev + 1) % loadingTips.length);
      }, 2000);
      return () => clearInterval(tipInterval);
    }
  }, [showTips]);

  useEffect(() => {
    // Simulate progressive loading
    const progressInterval = setInterval(() => {
      setAnimatedProgress((prev) => {
        const newProgress = Math.min(prev + Math.random() * 15, 100);
        if (newProgress >= 100 && onComplete) {
          setTimeout(onComplete, 500);
        }
        return newProgress;
      });
    }, 300);

    return () => clearInterval(progressInterval);
  }, [onComplete]);

  useEffect(() => {
    // Update loading stage based on progress
    if (animatedProgress > 80) setLoadingStage(3);
    else if (animatedProgress > 60) setLoadingStage(2);
    else if (animatedProgress > 30) setLoadingStage(1);
    else setLoadingStage(0);
  }, [animatedProgress]);

  const isDark = theme === 'dark';

  return (
    <div className={`min-h-screen flex items-center justify-center relative overflow-hidden ${
      isDark
        ? 'bg-gradient-to-br from-gray-900 via-purple-900/20 to-blue-900/20'
        : 'bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50'
    }`}>
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Floating Particles */}
        {Array.from({ length: 50 }).map((_, i) => (
          <motion.div
            key={i}
            className={`absolute w-1 h-1 rounded-full ${
              isDark ? 'bg-white/20' : 'bg-purple-500/20'
            }`}
            initial={{
              x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000),
              y: typeof window !== 'undefined' ? window.innerHeight + 100 : 1000,
            }}
            animate={{
              y: -100,
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: Math.random() * 3 + 2,
              repeat: Infinity,
              delay: Math.random() * 2,
              ease: "easeOut",
            }}
          />
        ))}

        {/* Pulsing Orbs */}
        {Array.from({ length: 3 }).map((_, i) => (
          <motion.div
            key={`orb-${i}`}
            className={`absolute w-32 h-32 rounded-full blur-3xl opacity-30 ${
              i === 0 ? 'bg-purple-500' :
              i === 1 ? 'bg-blue-500' : 'bg-green-500'
            }`}
            style={{
              left: `${20 + i * 30}%`,
              top: `${20 + i * 20}%`,
            }}
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              delay: i * 1.5,
            }}
          />
        ))}
      </div>

      {/* Main Loading Content */}
      <div className="relative z-10 text-center max-w-md mx-auto px-6">
        {/* Main Logo/Icon */}
        <motion.div
          className="relative mb-8"
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, type: "spring", stiffness: 200 }}
        >
          <motion.div
            className="w-24 h-24 bg-gradient-to-r from-purple-500 via-blue-500 to-green-500 rounded-3xl flex items-center justify-center mx-auto shadow-2xl relative overflow-hidden"
            animate={{
              rotate: [0, 360],
              scale: [1, 1.05, 1]
            }}
            transition={{
              rotate: { duration: 8, repeat: Infinity, ease: "linear" },
              scale: { duration: 2, repeat: Infinity }
            }}
          >
            <motion.div
              animate={{
                rotate: [0, -360],
                scale: [1, 1.2, 1]
              }}
              transition={{
                rotate: { duration: 6, repeat: Infinity, ease: "linear" },
                scale: { duration: 1.5, repeat: Infinity }
              }}
            >
              <Sparkles className="w-12 h-12 text-white" />
            </motion.div>

            {/* Floating mini icons around main icon */}
            {floatingIcons.map((item, index) => (
              <motion.div
                key={index}
                className={`absolute ${item.color}`}
                style={{
                  left: `${50 + 40 * Math.cos((index * 60) * Math.PI / 180)}%`,
                  top: `${50 + 40 * Math.sin((index * 60) * Math.PI / 180)}%`,
                  transform: 'translate(-50%, -50%)'
                }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{
                  scale: [0, 1, 0],
                  opacity: [0, 1, 0],
                  rotate: [0, 360]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  delay: item.delay,
                  ease: "easeInOut"
                }}
              >
                <item.icon className="w-4 h-4" />
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="mb-6"
        >
          <h1 className={`text-4xl font-bold mb-2 bg-gradient-to-r bg-clip-text text-transparent ${
            isDark
              ? 'from-white via-purple-200 to-blue-200'
              : 'from-gray-900 via-purple-700 to-blue-700'
          }`}>
            KAIA YIELD AI
          </h1>
          <p className={`text-lg ${
            isDark ? 'text-gray-300' : 'text-gray-600'
          }`}>
            Next-Gen AI-Powered DeFi Platform
          </p>
        </motion.div>

        {/* Loading Tips */}
        {showTips && (
          <motion.div
            className="mb-8 h-16 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <AnimatePresence mode="wait">
              <motion.p
                key={currentTip}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className={`text-center px-4 py-2 rounded-xl border ${
                  isDark
                    ? 'text-gray-300 bg-white/5 border-white/10'
                    : 'text-gray-700 bg-white/80 border-gray-200'
                }`}
              >
                {loadingTips[currentTip]}
              </motion.p>
            </AnimatePresence>
          </motion.div>
        )}

        {/* Progress Bar */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="mb-6"
        >
          <div className={`w-full h-3 rounded-full border overflow-hidden ${
            isDark
              ? 'bg-white/10 border-white/20'
              : 'bg-gray-200 border-gray-300'
          }`}>
            <motion.div
              className="h-full bg-gradient-to-r from-purple-500 via-blue-500 to-green-500 rounded-full relative overflow-hidden"
              initial={{ width: 0 }}
              animate={{ width: `${animatedProgress}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              {/* Animated shine effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                animate={{
                  x: ['-100%', '100%']
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            </motion.div>
          </div>

          <div className="flex items-center justify-between mt-3">
            <span className={`text-sm font-medium ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}>
              {Math.round(animatedProgress)}%
            </span>

            <div className="flex items-center space-x-2">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <Loader2 className={`w-4 h-4 ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                }`} />
              </motion.div>
              <span className={`text-sm ${
                isDark ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Loading...
              </span>
            </div>
          </div>
        </motion.div>

        {/* Loading Stages */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="flex items-center justify-center space-x-4"
        >
          {[
            { icon: Brain, label: 'AI Engine', stage: 0 },
            { icon: Shield, label: 'Security', stage: 1 },
            { icon: Users, label: 'Social', stage: 2 },
            { icon: Gamepad2, label: 'Gaming', stage: 3 }
          ].map((item, index) => (
            <motion.div
              key={item.label}
              className={`flex flex-col items-center space-y-1 ${
                loadingStage >= item.stage
                  ? isDark ? 'text-white' : 'text-gray-900'
                  : isDark ? 'text-gray-600' : 'text-gray-400'
              }`}
              animate={{
                scale: loadingStage >= item.stage ? [1, 1.1, 1] : 1,
                opacity: loadingStage >= item.stage ? 1 : 0.5
              }}
              transition={{
                scale: { duration: 0.5, repeat: loadingStage >= item.stage ? Infinity : 0, repeatDelay: 1 },
                opacity: { duration: 0.3 }
              }}
            >
              <div className={`p-2 rounded-lg ${
                loadingStage >= item.stage
                  ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white'
                  : isDark
                    ? 'bg-white/5 border border-white/10'
                    : 'bg-gray-100 border border-gray-200'
              }`}>
                <item.icon className="w-5 h-5" />
              </div>
              <span className="text-xs font-medium">{item.label}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}