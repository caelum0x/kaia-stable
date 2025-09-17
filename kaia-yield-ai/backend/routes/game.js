const express = require('express');
const router = express.Router();
const BlockchainService = require('../services/blockchain');
const { db } = require('../database/connection');
const Joi = require('joi');

const blockchainService = new BlockchainService();

// Validation schemas
const addressSchema = Joi.object({
  address: Joi.string().pattern(/^0x[a-fA-F0-9]{40}$/).required()
});

// Get all available missions
router.get('/missions', async (req, res) => {
  try {
    // Get missions from blockchain and database
    const [blockchainMissions, dbMissions] = await Promise.all([
      blockchainService.getActiveMissions(),
      db.query(`
        SELECT
          id,
          name,
          description,
          mission_type,
          reward_points,
          reward_usdt,
          difficulty,
          duration_hours,
          requirements,
          is_active,
          start_date,
          end_date
        FROM missions
        WHERE is_active = true
        ORDER BY difficulty ASC, reward_points DESC
      `)
    ]);

    // Merge and format missions
    const missions = dbMissions.rows.map(mission => ({
      id: mission.id,
      name: mission.name,
      description: mission.description,
      type: mission.mission_type,
      reward: {
        points: mission.reward_points,
        usdt: parseFloat(mission.reward_usdt || 0),
        formatted: `${mission.reward_points} points${mission.reward_usdt > 0 ? ` + ${mission.reward_usdt} USDT` : ''}`
      },
      difficulty: mission.difficulty,
      difficultyText: getDifficultyText(mission.difficulty),
      duration: mission.duration_hours,
      durationText: getDurationText(mission.duration_hours),
      requirements: mission.requirements,
      isActive: mission.is_active,
      startDate: mission.start_date,
      endDate: mission.end_date,
      category: getMissionCategory(mission.mission_type),
      icon: getMissionIcon(mission.mission_type)
    }));

    res.json({
      success: true,
      data: missions,
      count: missions.length
    });

  } catch (error) {
    console.error('Missions fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch missions'
    });
  }
});

// Get user mission progress
router.get('/missions/:address', async (req, res) => {
  try {
    const { error } = addressSchema.validate({ address: req.params.address });
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Invalid wallet address format'
      });
    }

    const userAddress = req.params.address;

    // Get user missions from blockchain and database
    const [blockchainUserMissions, dbUserMissions] = await Promise.all([
      blockchainService.getUserMissions(userAddress),
      db.query(`
        SELECT
          um.*,
          m.name,
          m.description,
          m.reward_points,
          m.reward_usdt,
          m.difficulty,
          m.requirements
        FROM user_missions um
        JOIN missions m ON um.mission_id = m.id
        WHERE um.user_id = (SELECT id FROM users WHERE address = $1)
        ORDER BY um.started_at DESC
      `, [userAddress])
    ]);

    // Process user mission data
    const userMissions = dbUserMissions.rows.map(userMission => {
      const blockchainData = blockchainUserMissions.find(bm => bm.missionId === userMission.mission_id);

      return {
        id: userMission.id,
        missionId: userMission.mission_id,
        name: userMission.name,
        description: userMission.description,
        progress: blockchainData?.progress || userMission.progress,
        target: 100, // Most missions are percentage-based
        progressFormatted: `${blockchainData?.progress || userMission.progress}%`,
        startTime: userMission.started_at,
        completedAt: userMission.completed_at,
        claimedAt: userMission.claimed_at,
        isCompleted: blockchainData?.completed || userMission.is_completed,
        isClaimed: blockchainData?.claimed || userMission.is_claimed,
        canClaim: (blockchainData?.completed || userMission.is_completed) &&
                  !(blockchainData?.claimed || userMission.is_claimed),
        reward: {
          points: userMission.reward_points,
          usdt: parseFloat(userMission.reward_usdt || 0)
        },
        difficulty: userMission.difficulty,
        timeRemaining: calculateTimeRemaining(userMission.started_at, userMission.requirements?.duration),
        status: getMissionStatus(userMission, blockchainData)
      };
    });

    // Get user stats
    const userStats = await db.query(`
      SELECT points, level, streak_days, experience
      FROM user_stats
      WHERE user_id = (SELECT id FROM users WHERE address = $1)
    `, [userAddress]);

    // Calculate mission summary
    const summary = {
      totalMissions: userMissions.length,
      completedMissions: userMissions.filter(m => m.isCompleted).length,
      claimedRewards: userMissions.filter(m => m.isClaimed).length,
      pendingClaims: userMissions.filter(m => m.canClaim).length,
      totalPointsEarned: userMissions
        .filter(m => m.isClaimed)
        .reduce((sum, m) => sum + m.reward.points, 0),
      totalUSDTEarned: userMissions
        .filter(m => m.isClaimed)
        .reduce((sum, m) => sum + m.reward.usdt, 0),
      currentLevel: userStats.rows[0]?.level || 1,
      currentPoints: userStats.rows[0]?.points || 0,
      currentStreak: userStats.rows[0]?.streak_days || 0,
      completionRate: userMissions.length > 0
        ? Math.round((userMissions.filter(m => m.isCompleted).length / userMissions.length) * 100)
        : 0
    };

    res.json({
      success: true,
      data: {
        missions: userMissions,
        summary,
        lastUpdated: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('User missions fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user missions'
    });
  }
});

// Get leaderboard data
router.get('/leaderboard', async (req, res) => {
  try {
    const { category = 'overall', period = 'all', limit = 50 } = req.query;

    // Get leaderboard from blockchain
    const blockchainLeaderboard = await blockchainService.getLeaderboard();

    // Get enhanced leaderboard from database
    const dbLeaderboard = await db.query(`
      SELECT
        u.address,
        u.display_name,
        u.line_user_id,
        us.points,
        us.level,
        us.streak_days,
        us.total_deposited,
        us.total_rewards,
        us.successful_strategies,
        RANK() OVER (ORDER BY us.points DESC) as rank,
        DENSE_RANK() OVER (ORDER BY us.points DESC) as dense_rank
      FROM user_stats us
      JOIN users u ON us.user_id = u.id
      WHERE u.is_active = true
      ORDER BY us.points DESC, us.total_deposited DESC
      LIMIT $1
    `, [limit]);

    // Format leaderboard entries
    const leaderboard = dbLeaderboard.rows.map((entry, index) => {
      const blockchainEntry = blockchainLeaderboard.find(bl =>
        bl.user.toLowerCase() === entry.address.toLowerCase()
      );

      return {
        rank: entry.rank,
        user: {
          address: entry.address,
          displayName: entry.display_name || `User ${entry.address.slice(0, 6)}`,
          shortAddress: `${entry.address.slice(0, 6)}...${entry.address.slice(-4)}`,
          hasLineAccount: !!entry.line_user_id
        },
        stats: {
          points: entry.points,
          level: entry.level,
          streak: entry.streak_days,
          totalDeposited: parseFloat(entry.total_deposited || 0),
          totalRewards: parseFloat(entry.total_rewards || 0),
          successfulStrategies: entry.successful_strategies,
          blockchainScore: blockchainEntry?.score || 0
        },
        performance: {
          roi: entry.total_deposited > 0
            ? ((entry.total_rewards / entry.total_deposited) * 100).toFixed(2)
            : '0.00',
          avgDailyPoints: entry.points > 0 ? Math.round(entry.points / Math.max(entry.streak_days, 1)) : 0,
          efficiency: calculateEfficiencyScore(entry)
        },
        badges: generateUserBadges(entry),
        lastActive: blockchainEntry?.timestamp ? new Date(blockchainEntry.timestamp * 1000) : null
      };
    });

    res.json({
      success: true,
      data: {
        leaderboard,
        metadata: {
          category,
          period,
          totalEntries: leaderboard.length,
          lastUpdated: new Date().toISOString(),
          updateFrequency: '5 minutes'
        }
      }
    });

  } catch (error) {
    console.error('Leaderboard fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch leaderboard'
    });
  }
});

// Get user stats and achievements
router.get('/user-stats/:address', async (req, res) => {
  try {
    const { error } = addressSchema.validate({ address: req.params.address });
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Invalid wallet address format'
      });
    }

    const userAddress = req.params.address;

    // Get stats from blockchain and database
    const [blockchainStats, dbStats] = await Promise.all([
      blockchainService.getUserStats(userAddress),
      db.query(`
        SELECT
          us.*,
          u.display_name,
          u.created_at as join_date,
          COUNT(um.id) as total_missions,
          COUNT(CASE WHEN um.is_completed THEN 1 END) as completed_missions
        FROM user_stats us
        JOIN users u ON us.user_id = u.id
        LEFT JOIN user_missions um ON us.user_id = um.user_id
        WHERE u.address = $1
        GROUP BY us.user_id, u.display_name, u.created_at
      `, [userAddress])
    ]);

    if (dbStats.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const userStats = dbStats.rows[0];

    // Calculate achievements and progress
    const achievements = await calculateUserAchievements(userAddress, userStats);
    const nextLevelInfo = calculateNextLevel(userStats.level, userStats.experience);

    const stats = {
      user: {
        address: userAddress,
        displayName: userStats.display_name,
        joinDate: userStats.join_date,
        daysActive: Math.floor((Date.now() - new Date(userStats.join_date)) / (1000 * 60 * 60 * 24))
      },
      gaming: {
        points: blockchainStats.points || userStats.points,
        level: blockchainStats.level || userStats.level,
        experience: userStats.experience,
        nextLevel: nextLevelInfo,
        streak: blockchainStats.streak || userStats.streak_days,
        hasSocialBonus: blockchainStats.hasSocialBonus || userStats.social_bonus_active
      },
      performance: {
        totalDeposited: parseFloat(userStats.total_deposited || 0),
        totalRewards: parseFloat(userStats.total_rewards || 0),
        successfulStrategies: userStats.successful_strategies,
        roi: userStats.total_deposited > 0
          ? ((userStats.total_rewards / userStats.total_deposited) * 100).toFixed(2)
          : '0.00'
      },
      missions: {
        total: userStats.total_missions,
        completed: userStats.completed_missions,
        completionRate: userStats.total_missions > 0
          ? Math.round((userStats.completed_missions / userStats.total_missions) * 100)
          : 0
      },
      achievements,
      ranking: await getUserRanking(userAddress),
      lastUpdated: new Date().toISOString()
    };

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('User stats fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user stats'
    });
  }
});

// Claim mission rewards
router.post('/claim-reward', async (req, res) => {
  try {
    const { userAddress, missionId } = req.body;

    const schema = Joi.object({
      userAddress: Joi.string().pattern(/^0x[a-fA-F0-9]{40}$/).required(),
      missionId: Joi.number().integer().positive().required()
    });

    const { error } = schema.validate({ userAddress, missionId });
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    // Check if mission is completed and not claimed
    const userMission = await db.query(`
      SELECT um.*, m.reward_points, m.reward_usdt
      FROM user_missions um
      JOIN missions m ON um.mission_id = m.id
      WHERE um.user_id = (SELECT id FROM users WHERE address = $1)
        AND um.mission_id = $2
        AND um.is_completed = true
        AND um.is_claimed = false
    `, [userAddress, missionId]);

    if (userMission.rows.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Mission not completed or already claimed'
      });
    }

    const mission = userMission.rows[0];

    // Update mission as claimed and user stats
    await db.transaction(async (client) => {
      // Mark mission as claimed
      await client.query(`
        UPDATE user_missions
        SET is_claimed = true, claimed_at = NOW()
        WHERE id = $1
      `, [mission.id]);

      // Update user stats
      await client.query(`
        UPDATE user_stats
        SET points = points + $1,
            experience = experience + $2,
            last_activity = NOW()
        WHERE user_id = (SELECT id FROM users WHERE address = $3)
      `, [mission.reward_points, mission.reward_points, userAddress]);

      // Add to rewards history if USDT reward
      if (mission.reward_usdt > 0) {
        await client.query(`
          INSERT INTO deposit_history (user_id, action, amount, timestamp)
          VALUES (
            (SELECT id FROM users WHERE address = $1),
            'mission_reward',
            $2,
            NOW()
          )
        `, [userAddress, mission.reward_usdt]);
      }
    });

    res.json({
      success: true,
      data: {
        message: 'Reward claimed successfully',
        rewards: {
          points: mission.reward_points,
          usdt: parseFloat(mission.reward_usdt || 0)
        },
        missionId,
        claimedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Claim reward error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to claim reward'
    });
  }
});

// Helper functions
function getDifficultyText(level) {
  const difficulties = ['Beginner', 'Easy', 'Medium', 'Hard', 'Expert'];
  return difficulties[level - 1] || 'Unknown';
}

function getDurationText(hours) {
  if (hours === 0) return 'Instant';
  if (hours < 24) return `${hours} hours`;
  const days = Math.floor(hours / 24);
  return `${days} days`;
}

function getMissionCategory(type) {
  const categories = {
    'deposit': 'Investment',
    'diversification': 'Strategy',
    'rewards': 'Earning',
    'social': 'Community',
    'holding': 'Patience',
    'high_risk': 'Advanced',
    'referral': 'Growth',
    'activity': 'Engagement'
  };
  return categories[type] || 'General';
}

function getMissionIcon(type) {
  const icons = {
    'deposit': '💰',
    'diversification': '📊',
    'rewards': '🎁',
    'social': '👥',
    'holding': '💎',
    'high_risk': '🔥',
    'referral': '🚀',
    'activity': '⚡'
  };
  return icons[type] || '🎯';
}

function getMissionStatus(userMission, blockchainData) {
  if (blockchainData?.claimed || userMission.is_claimed) return 'claimed';
  if (blockchainData?.completed || userMission.is_completed) return 'completed';
  return 'in_progress';
}

function calculateTimeRemaining(startTime, durationHours) {
  if (!durationHours) return null;

  const endTime = new Date(startTime).getTime() + (durationHours * 60 * 60 * 1000);
  const remaining = endTime - Date.now();

  if (remaining <= 0) return 'Expired';

  const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
  const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  if (days > 0) return `${days}d ${hours}h`;
  return `${hours}h`;
}

function calculateEfficiencyScore(userStats) {
  const deposited = parseFloat(userStats.total_deposited || 0);
  const rewards = parseFloat(userStats.total_rewards || 0);
  const points = userStats.points || 0;

  if (deposited === 0) return 0;

  const roi = (rewards / deposited) * 100;
  const pointsPerDollar = points / deposited;

  return Math.round((roi * 0.7 + pointsPerDollar * 0.3) * 10) / 10;
}

function generateUserBadges(userStats) {
  const badges = [];

  if (userStats.streak_days >= 7) badges.push({ name: 'Consistent', icon: '🔥', color: 'orange' });
  if (userStats.level >= 10) badges.push({ name: 'Expert', icon: '⭐', color: 'gold' });
  if (userStats.total_deposited >= 10000) badges.push({ name: 'Whale', icon: '🐋', color: 'blue' });
  if (userStats.successful_strategies >= 5) badges.push({ name: 'Strategist', icon: '🎯', color: 'green' });

  return badges;
}

async function calculateUserAchievements(userAddress, userStats) {
  // This would calculate achievements based on user activity
  const achievements = [
    {
      id: 'first_deposit',
      name: 'First Steps',
      description: 'Made your first deposit',
      unlocked: userStats.total_deposited > 0,
      icon: '🥇',
      rarity: 'common'
    },
    {
      id: 'high_roller',
      name: 'High Roller',
      description: 'Deposited over $10,000',
      unlocked: userStats.total_deposited >= 10000,
      icon: '💎',
      rarity: 'epic'
    },
    {
      id: 'streak_master',
      name: 'Streak Master',
      description: 'Maintained a 30-day streak',
      unlocked: userStats.streak_days >= 30,
      icon: '🔥',
      rarity: 'rare'
    }
  ];

  return achievements;
}

function calculateNextLevel(currentLevel, currentExp) {
  const expNeeded = currentLevel * 1000; // Simple progression
  const expToNext = expNeeded - currentExp;

  return {
    nextLevel: currentLevel + 1,
    expNeeded,
    expToNext: Math.max(0, expToNext),
    progressPercent: Math.min(100, (currentExp / expNeeded) * 100)
  };
}

async function getUserRanking(userAddress) {
  try {
    const ranking = await db.query(`
      SELECT rank FROM (
        SELECT
          u.address,
          RANK() OVER (ORDER BY us.points DESC) as rank
        FROM user_stats us
        JOIN users u ON us.user_id = u.id
        WHERE u.is_active = true
      ) ranked
      WHERE address = $1
    `, [userAddress]);

    return ranking.rows[0]?.rank || null;
  } catch (error) {
    return null;
  }
}

module.exports = router;