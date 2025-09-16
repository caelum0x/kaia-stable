const express = require('express');
const router = express.Router();
const BlockchainService = require('../services/blockchain');
const Joi = require('joi');

const blockchainService = new BlockchainService();

const addressSchema = Joi.object({
  address: Joi.string().pattern(/^0x[a-fA-F0-9]{40}$/).required()
});

const missionSchema = Joi.object({
  missionId: Joi.number().min(1).required(),
  userAddress: Joi.string().pattern(/^0x[a-fA-F0-9]{40}$/).required()
});

// Get user's gaming profile and stats
router.get('/profile/:address', async (req, res) => {
  try {
    const { error } = addressSchema.validate({ address: req.params.address });
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Invalid address format'
      });
    }

    const { address } = req.params;

    const [userStats, userMissions, allMissions] = await Promise.all([
      blockchainService.getUserStats(address),
      blockchainService.getUserMissions(address),
      blockchainService.getActiveMissions()
    ]);

    const completedMissions = userMissions.filter(m => m.completed);
    const activeMissions = userMissions.filter(m => !m.completed && !m.claimed);
    const availableMissions = allMissions.filter(mission =>
      !userMissions.some(um => um.missionId === mission.id)
    );

    // Calculate achievements
    const achievements = calculateAchievements(userStats, completedMissions, userMissions);

    // Calculate next level requirements
    const nextLevel = calculateNextLevelRequirements(userStats.level);

    res.json({
      success: true,
      data: {
        profile: {
          level: userStats.level,
          points: userStats.points,
          streak: userStats.streak,
          hasSocialBonus: userStats.hasSocialBonus,
          rank: await getUserRank(address),
          progress: {
            currentLevelProgress: calculateLevelProgress(userStats.points, userStats.level),
            nextLevel,
            pointsToNextLevel: nextLevel.requiredPoints - userStats.points
          }
        },
        missions: {
          active: activeMissions.length,
          completed: completedMissions.length,
          available: availableMissions.length,
          totalRewardsEarned: completedMissions.reduce((sum, m) => {
            const mission = allMissions.find(am => am.id === m.missionId);
            return sum + (mission?.reward || 0);
          }, 0)
        },
        achievements: achievements,
        weeklyStats: generateWeeklyStats(userMissions, allMissions)
      }
    });

  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch gaming profile',
      message: error.message
    });
  }
});

// Get available missions
router.get('/missions/:address', async (req, res) => {
  try {
    const { error } = addressSchema.validate({ address: req.params.address });
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Invalid address format'
      });
    }

    const { address } = req.params;

    const [allMissions, userMissions, userStats] = await Promise.all([
      blockchainService.getActiveMissions(),
      blockchainService.getUserMissions(address),
      blockchainService.getUserStats(address)
    ]);

    const enrichedMissions = allMissions.map(mission => {
      const userMission = userMissions.find(um => um.missionId === mission.id);
      const canStart = !userMission && mission.difficulty <= userStats.level;
      const timeRemaining = userMission ? calculateTimeRemaining(userMission, mission) : null;

      return {
        ...mission,
        status: getUserMissionStatus(userMission),
        progress: userMission?.progress || 0,
        canStart,
        canClaim: userMission?.completed && !userMission?.claimed,
        timeRemaining,
        rewardFormatted: formatReward(mission.reward),
        difficultyText: getDifficultyText(mission.difficulty),
        estimatedTime: formatDuration(mission.duration)
      };
    });

    // Group missions by status
    const groupedMissions = {
      available: enrichedMissions.filter(m => m.canStart),
      active: enrichedMissions.filter(m => m.status === 'active'),
      completed: enrichedMissions.filter(m => m.status === 'completed'),
      claimed: enrichedMissions.filter(m => m.status === 'claimed')
    };

    res.json({
      success: true,
      data: {
        missions: groupedMissions,
        summary: {
          totalAvailable: groupedMissions.available.length,
          totalActive: groupedMissions.active.length,
          totalCompleted: groupedMissions.completed.length,
          totalRewardsPending: groupedMissions.completed.reduce((sum, m) => sum + m.reward, 0),
          userLevel: userStats.level,
          canStartNew: groupedMissions.available.length > 0
        },
        recommendations: generateMissionRecommendations(groupedMissions, userStats)
      }
    });

  } catch (error) {
    console.error('Missions fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch missions',
      message: error.message
    });
  }
});

// Get leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    const { limit = 50, type = 'points' } = req.query;

    const rawLeaderboard = await blockchainService.getLeaderboard();

    // Enrich leaderboard data
    const enrichedLeaderboard = await Promise.all(
      rawLeaderboard.slice(0, parseInt(limit)).map(async (entry, index) => {
        try {
          const userStats = await blockchainService.getUserStats(entry.user);
          return {
            rank: index + 1,
            address: entry.user,
            displayAddress: `${entry.user.slice(0, 6)}...${entry.user.slice(-4)}`,
            score: entry.score,
            level: userStats.level,
            streak: userStats.streak,
            hasSocialBonus: userStats.hasSocialBonus,
            lastActivity: new Date(entry.timestamp * 1000).toISOString(),
            badge: getRankBadge(index + 1)
          };
        } catch (error) {
          return {
            rank: index + 1,
            address: entry.user,
            displayAddress: `${entry.user.slice(0, 6)}...${entry.user.slice(-4)}`,
            score: entry.score,
            level: 1,
            streak: 0,
            hasSocialBonus: false,
            lastActivity: new Date(entry.timestamp * 1000).toISOString(),
            badge: getRankBadge(index + 1)
          };
        }
      })
    );

    // Calculate leaderboard stats
    const stats = {
      totalPlayers: rawLeaderboard.length,
      averageScore: rawLeaderboard.reduce((sum, entry) => sum + entry.score, 0) / rawLeaderboard.length,
      topScore: rawLeaderboard[0]?.score || 0,
      lastUpdate: new Date().toISOString()
    };

    res.json({
      success: true,
      data: {
        leaderboard: enrichedLeaderboard,
        stats,
        userPosition: null // Will be set if user address is provided
      }
    });

  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch leaderboard',
      message: error.message
    });
  }
});

// Get user's position in leaderboard
router.get('/leaderboard/position/:address', async (req, res) => {
  try {
    const { error } = addressSchema.validate({ address: req.params.address });
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Invalid address format'
      });
    }

    const { address } = req.params;
    const leaderboard = await blockchainService.getLeaderboard();

    const userPosition = leaderboard.findIndex(entry =>
      entry.user.toLowerCase() === address.toLowerCase()
    );

    if (userPosition === -1) {
      return res.json({
        success: true,
        data: {
          position: null,
          message: 'User not found in leaderboard'
        }
      });
    }

    const userEntry = leaderboard[userPosition];
    const userStats = await blockchainService.getUserStats(address);

    // Get surrounding positions for context
    const start = Math.max(0, userPosition - 2);
    const end = Math.min(leaderboard.length, userPosition + 3);
    const surrounding = leaderboard.slice(start, end).map((entry, index) => ({
      rank: start + index + 1,
      address: entry.user,
      displayAddress: `${entry.user.slice(0, 6)}...${entry.user.slice(-4)}`,
      score: entry.score,
      isCurrentUser: entry.user.toLowerCase() === address.toLowerCase()
    }));

    res.json({
      success: true,
      data: {
        position: userPosition + 1,
        totalPlayers: leaderboard.length,
        score: userEntry.score,
        level: userStats.level,
        percentile: Math.round(((leaderboard.length - userPosition) / leaderboard.length) * 100),
        surrounding,
        nextRank: userPosition > 0 ? {
          rank: userPosition,
          scoreGap: leaderboard[userPosition - 1].score - userEntry.score
        } : null
      }
    });

  } catch (error) {
    console.error('Position fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch leaderboard position',
      message: error.message
    });
  }
});

// Get daily/weekly challenges
router.get('/challenges/:address', async (req, res) => {
  try {
    const { error } = addressSchema.validate({ address: req.params.address });
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Invalid address format'
      });
    }

    const { address } = req.params;

    // Generate dynamic challenges based on user's activity
    const [userStats, userMissions, userDeposits] = await Promise.all([
      blockchainService.getUserStats(address),
      blockchainService.getUserMissions(address),
      blockchainService.getUserDeposits(address).catch(() => [])
    ]);

    const challenges = generateDailyChallenges(userStats, userMissions, userDeposits);

    res.json({
      success: true,
      data: {
        daily: challenges.daily,
        weekly: challenges.weekly,
        special: challenges.special,
        streak: {
          current: userStats.streak,
          record: Math.max(userStats.streak, 7), // Simulated record
          nextMilestone: calculateNextStreakMilestone(userStats.streak)
        }
      }
    });

  } catch (error) {
    console.error('Challenges error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch challenges',
      message: error.message
    });
  }
});

// Helper functions
async function getUserRank(address) {
  try {
    const leaderboard = await blockchainService.getLeaderboard();
    const position = leaderboard.findIndex(entry =>
      entry.user.toLowerCase() === address.toLowerCase()
    );
    return position === -1 ? null : position + 1;
  } catch (error) {
    return null;
  }
}

function calculateAchievements(userStats, completedMissions, allUserMissions) {
  const achievements = [];

  // Level-based achievements
  if (userStats.level >= 5) achievements.push({ id: 'level_5', name: 'Rising Star', description: 'Reached level 5' });
  if (userStats.level >= 10) achievements.push({ id: 'level_10', name: 'Experienced Player', description: 'Reached level 10' });
  if (userStats.level >= 20) achievements.push({ id: 'level_20', name: 'Master Trader', description: 'Reached level 20' });

  // Mission-based achievements
  if (completedMissions.length >= 5) achievements.push({ id: 'missions_5', name: 'Mission Specialist', description: 'Completed 5 missions' });
  if (completedMissions.length >= 25) achievements.push({ id: 'missions_25', name: 'Mission Master', description: 'Completed 25 missions' });

  // Streak achievements
  if (userStats.streak >= 7) achievements.push({ id: 'streak_7', name: 'Week Warrior', description: '7-day streak' });
  if (userStats.streak >= 30) achievements.push({ id: 'streak_30', name: 'Monthly Master', description: '30-day streak' });

  // Social achievements
  if (userStats.hasSocialBonus) achievements.push({ id: 'social', name: 'Social Trader', description: 'Connected with friends' });

  return achievements;
}

function calculateNextLevelRequirements(currentLevel) {
  const basePoints = 100;
  const multiplier = 1.5;
  const requiredPoints = Math.floor(basePoints * Math.pow(multiplier, currentLevel));

  return {
    level: currentLevel + 1,
    requiredPoints,
    benefits: getLevelBenefits(currentLevel + 1)
  };
}

function getLevelBenefits(level) {
  const benefits = [];

  if (level % 5 === 0) benefits.push('New mission types unlocked');
  if (level % 10 === 0) benefits.push('Bonus multiplier increased');
  if (level === 15) benefits.push('VIP strategy access');
  if (level === 20) benefits.push('Premium analytics unlocked');

  return benefits.length > 0 ? benefits : ['Continued progress rewards'];
}

function calculateLevelProgress(points, level) {
  const currentLevelStart = level === 1 ? 0 : Math.floor(100 * Math.pow(1.5, level - 2));
  const nextLevelStart = Math.floor(100 * Math.pow(1.5, level - 1));
  const progress = ((points - currentLevelStart) / (nextLevelStart - currentLevelStart)) * 100;

  return Math.max(0, Math.min(100, progress));
}

function getUserMissionStatus(userMission) {
  if (!userMission) return 'not_started';
  if (userMission.claimed) return 'claimed';
  if (userMission.completed) return 'completed';
  return 'active';
}

function calculateTimeRemaining(userMission, mission) {
  if (!userMission || userMission.completed) return null;

  const endTime = userMission.startTime + mission.duration;
  const now = Math.floor(Date.now() / 1000);
  const remaining = endTime - now;

  return remaining > 0 ? remaining : 0;
}

function formatReward(reward) {
  return `${reward} points`;
}

function getDifficultyText(difficulty) {
  if (difficulty <= 3) return 'Easy';
  if (difficulty <= 7) return 'Medium';
  if (difficulty <= 15) return 'Hard';
  return 'Expert';
}

function formatDuration(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

function generateMissionRecommendations(missions, userStats) {
  const recommendations = [];

  if (missions.available.length === 0) {
    recommendations.push('Complete active missions to unlock new ones');
  } else {
    const easiest = missions.available.filter(m => m.difficulty <= userStats.level).sort((a, b) => a.difficulty - b.difficulty)[0];
    if (easiest) {
      recommendations.push(`Try "${easiest.name}" - it matches your current level`);
    }
  }

  if (missions.completed.length > 0) {
    recommendations.push(`Claim ${missions.completed.length} completed mission rewards`);
  }

  return recommendations;
}

function getRankBadge(rank) {
  if (rank === 1) return '🏆';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  if (rank <= 10) return '🌟';
  if (rank <= 50) return '💎';
  return null;
}

function generateWeeklyStats(userMissions, allMissions) {
  const now = Date.now() / 1000;
  const weekStart = now - (7 * 24 * 60 * 60);

  const weeklyMissions = userMissions.filter(m => m.startTime >= weekStart);
  const weeklyCompleted = weeklyMissions.filter(m => m.completed);

  const weeklyRewards = weeklyCompleted.reduce((sum, m) => {
    const mission = allMissions.find(am => am.id === m.missionId);
    return sum + (mission?.reward || 0);
  }, 0);

  return {
    missionsStarted: weeklyMissions.length,
    missionsCompleted: weeklyCompleted.length,
    rewardsEarned: weeklyRewards,
    completionRate: weeklyMissions.length > 0 ? Math.round((weeklyCompleted.length / weeklyMissions.length) * 100) : 0
  };
}

function generateDailyChallenges(userStats, userMissions, userDeposits) {
  const now = new Date();
  const today = now.toISOString().split('T')[0];

  return {
    daily: [
      {
        id: 'daily_login',
        name: 'Daily Login',
        description: 'Log in to the app',
        progress: 1, // Assume completed by visiting
        target: 1,
        reward: 10,
        completed: true,
        type: 'login'
      },
      {
        id: 'daily_check',
        name: 'Portfolio Check',
        description: 'Check your portfolio performance',
        progress: userDeposits.length > 0 ? 1 : 0,
        target: 1,
        reward: 15,
        completed: userDeposits.length > 0,
        type: 'portfolio'
      }
    ],
    weekly: [
      {
        id: 'weekly_missions',
        name: 'Mission Specialist',
        description: 'Complete 3 missions this week',
        progress: Math.min(3, userMissions.filter(m => m.completed).length),
        target: 3,
        reward: 100,
        completed: userMissions.filter(m => m.completed).length >= 3,
        type: 'missions'
      }
    ],
    special: [
      {
        id: 'social_boost',
        name: 'Social Trader',
        description: 'Share a strategy with friends',
        progress: userStats.hasSocialBonus ? 1 : 0,
        target: 1,
        reward: 50,
        completed: userStats.hasSocialBonus,
        type: 'social'
      }
    ]
  };
}

function calculateNextStreakMilestone(currentStreak) {
  const milestones = [7, 14, 30, 60, 100];
  const next = milestones.find(m => m > currentStreak);
  return next || (Math.floor(currentStreak / 100) + 1) * 100;
}

module.exports = router;