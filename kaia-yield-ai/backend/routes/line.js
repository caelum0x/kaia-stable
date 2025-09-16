const express = require('express');
const router = express.Router();
const { Client } = require('@line/bot-sdk');
const BlockchainService = require('../services/blockchain');
const Joi = require('joi');

const blockchainService = new BlockchainService();

// LINE Bot configuration
const lineConfig = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET
};

const lineClient = new Client(lineConfig);

const liffDataSchema = Joi.object({
  userId: Joi.string().required(),
  displayName: Joi.string().required(),
  pictureUrl: Joi.string().uri().optional(),
  statusMessage: Joi.string().optional(),
  walletAddress: Joi.string().pattern(/^0x[a-fA-F0-9]{40}$/).optional()
});

const shareSchema = Joi.object({
  userId: Joi.string().required(),
  strategyId: Joi.number().min(1).required(),
  message: Joi.string().max(500).optional(),
  friendIds: Joi.array().items(Joi.string()).min(1).max(10).required()
});

// LIFF profile verification and initialization
router.post('/profile/verify', async (req, res) => {
  try {
    const { error, value } = liffDataSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Invalid profile data',
        details: error.details
      });
    }

    const { userId, displayName, pictureUrl, statusMessage, walletAddress } = value;

    // Verify LINE profile with LINE API
    try {
      const profile = await lineClient.getProfile(userId);

      if (profile.displayName !== displayName) {
        return res.status(401).json({
          success: false,
          error: 'Profile verification failed'
        });
      }
    } catch (lineError) {
      console.warn('LINE profile verification failed:', lineError.message);
      // Continue with provided data if LINE API fails
    }

    // Store/update user profile in your database
    const userProfile = {
      lineUserId: userId,
      displayName,
      pictureUrl,
      statusMessage,
      walletAddress,
      lastSeen: new Date().toISOString(),
      isActive: true
    };

    // Get user's blockchain data if wallet is connected
    let blockchainData = null;
    if (walletAddress) {
      try {
        const [userStats, deposits] = await Promise.all([
          blockchainService.getUserStats(walletAddress).catch(() => ({ level: 1, points: 0 })),
          blockchainService.getUserDeposits(walletAddress).catch(() => [])
        ]);

        blockchainData = {
          level: userStats.level,
          points: userStats.points,
          totalDeposited: deposits.reduce((sum, d) => sum + parseFloat(d.amount), 0),
          activeStrategies: new Set(deposits.filter(d => parseFloat(d.amount) > 0).map(d => d.strategyId)).size
        };
      } catch (error) {
        console.error('Blockchain data fetch error:', error);
      }
    }

    res.json({
      success: true,
      data: {
        profile: userProfile,
        blockchain: blockchainData,
        features: {
          canShareStrategies: true,
          canEarnSocialBonus: true,
          hasWalletConnected: !!walletAddress
        }
      }
    });

  } catch (error) {
    console.error('Profile verification error:', error);
    res.status(500).json({
      success: false,
      error: 'Profile verification failed',
      message: error.message
    });
  }
});

// Share strategy with LINE friends
router.post('/share/strategy', async (req, res) => {
  try {
    const { error, value } = shareSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Invalid share data',
        details: error.details
      });
    }

    const { userId, strategyId, message, friendIds } = value;

    // Get strategy details
    const strategies = await blockchainService.getAllStrategies();
    const strategy = strategies.find(s => s.id === strategyId);

    if (!strategy || !strategy.active) {
      return res.status(404).json({
        success: false,
        error: 'Strategy not found or inactive'
      });
    }

    // Get user profile for sender info
    let senderProfile;
    try {
      senderProfile = await lineClient.getProfile(userId);
    } catch (error) {
      senderProfile = { displayName: 'A friend' };
    }

    // Create rich message for sharing
    const shareMessage = createStrategyShareMessage(strategy, senderProfile, message);

    // Send messages to friends (in real implementation, you'd need friend consent)
    const shareResults = [];
    for (const friendId of friendIds) {
      try {
        // In a real implementation, you'd need to validate that these users
        // have added your LINE bot and consented to receive messages
        await lineClient.pushMessage(friendId, shareMessage);
        shareResults.push({ friendId, success: true });
      } catch (error) {
        console.error(`Failed to send to ${friendId}:`, error);
        shareResults.push({ friendId, success: false, error: error.message });
      }
    }

    // Track sharing activity for rewards
    const successfulShares = shareResults.filter(r => r.success).length;
    if (successfulShares > 0) {
      // Award social bonus points (this would update the smart contract in real implementation)
      await awardSocialBonus(userId, successfulShares, strategyId);
    }

    res.json({
      success: true,
      data: {
        strategy: {
          id: strategy.id,
          name: strategy.name,
          apy: strategy.apy
        },
        shareResults,
        socialReward: successfulShares > 0 ? {
          points: successfulShares * 10,
          bonusUnlocked: true
        } : null
      }
    });

  } catch (error) {
    console.error('Strategy sharing error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to share strategy',
      message: error.message
    });
  }
});

// Get LINE-specific user data and social features
router.get('/social/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { walletAddress } = req.query;

    // Get user's LINE profile
    let lineProfile;
    try {
      lineProfile = await lineClient.getProfile(userId);
    } catch (error) {
      return res.status(404).json({
        success: false,
        error: 'LINE profile not found'
      });
    }

    // Get social features data
    const socialData = {
      profile: lineProfile,
      features: {
        shareCount: await getShareCount(userId),
        referralCode: generateReferralCode(userId),
        socialBonusActive: false,
        friendsInvited: 0
      }
    };

    // Get blockchain social data if wallet connected
    if (walletAddress) {
      try {
        const userStats = await blockchainService.getUserStats(walletAddress);
        socialData.features.socialBonusActive = userStats.hasSocialBonus;
        socialData.blockchain = {
          level: userStats.level,
          points: userStats.points,
          socialMultiplier: userStats.hasSocialBonus ? 1.2 : 1.0
        };
      } catch (error) {
        console.error('Blockchain social data error:', error);
      }
    }

    res.json({
      success: true,
      data: socialData
    });

  } catch (error) {
    console.error('Social data error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch social data',
      message: error.message
    });
  }
});

// Handle LINE webhook for bot interactions
router.post('/webhook', (req, res) => {
  const events = req.body.events;

  events.forEach(async (event) => {
    try {
      await handleLineEvent(event);
    } catch (error) {
      console.error('LINE event handling error:', error);
    }
  });

  res.status(200).send('OK');
});

// Get friends leaderboard (simulated - real implementation would need consent)
router.get('/friends/leaderboard/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // In a real implementation, you'd need to:
    // 1. Get user's friends list (with consent)
    // 2. Filter friends who use the app
    // 3. Get their blockchain data

    // For demo, we'll simulate some friend data
    const friendsLeaderboard = generateSimulatedFriendsLeaderboard(userId);

    res.json({
      success: true,
      data: {
        friends: friendsLeaderboard,
        userRank: 3,
        totalFriends: friendsLeaderboard.length,
        socialChallenges: generateSocialChallenges()
      }
    });

  } catch (error) {
    console.error('Friends leaderboard error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch friends leaderboard',
      message: error.message
    });
  }
});

// LINE-specific reward notifications
router.post('/notify/reward', async (req, res) => {
  try {
    const { userId, reward, type, amount } = req.body;

    if (!userId || !reward || !type) {
      return res.status(400).json({
        success: false,
        error: 'Missing required notification data'
      });
    }

    const notificationMessage = createRewardNotification(reward, type, amount);

    try {
      await lineClient.pushMessage(userId, notificationMessage);
      res.json({
        success: true,
        message: 'Reward notification sent'
      });
    } catch (lineError) {
      console.error('LINE notification error:', lineError);
      res.status(500).json({
        success: false,
        error: 'Failed to send LINE notification'
      });
    }

  } catch (error) {
    console.error('Reward notification error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process reward notification',
      message: error.message
    });
  }
});

// Helper functions
function createStrategyShareMessage(strategy, senderProfile, customMessage) {
  const apyFormatted = (strategy.apy / 100).toFixed(2);
  const riskText = strategy.riskLevel <= 3 ? 'Low Risk' :
                   strategy.riskLevel <= 6 ? 'Medium Risk' : 'High Risk';

  return {
    type: 'flex',
    altText: `${senderProfile.displayName} shared a yield strategy with you!`,
    contents: {
      type: 'bubble',
      header: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: 'KAIA YIELD AI',
            weight: 'bold',
            color: '#1DB954',
            size: 'sm'
          },
          {
            type: 'text',
            text: 'Strategy Recommendation',
            weight: 'bold',
            size: 'lg',
            color: '#000000'
          }
        ]
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: `${senderProfile.displayName} recommends:`,
            size: 'sm',
            color: '#666666',
            margin: 'md'
          },
          {
            type: 'text',
            text: strategy.name,
            weight: 'bold',
            size: 'xl',
            margin: 'sm'
          },
          {
            type: 'box',
            layout: 'vertical',
            margin: 'lg',
            contents: [
              {
                type: 'box',
                layout: 'baseline',
                contents: [
                  {
                    type: 'text',
                    text: 'APY',
                    size: 'sm',
                    color: '#666666',
                    flex: 1
                  },
                  {
                    type: 'text',
                    text: `${apyFormatted}%`,
                    weight: 'bold',
                    size: 'lg',
                    color: '#1DB954',
                    flex: 2
                  }
                ]
              },
              {
                type: 'box',
                layout: 'baseline',
                contents: [
                  {
                    type: 'text',
                    text: 'Risk Level',
                    size: 'sm',
                    color: '#666666',
                    flex: 1
                  },
                  {
                    type: 'text',
                    text: riskText,
                    size: 'sm',
                    flex: 2
                  }
                ]
              }
            ]
          }
        ]
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        contents: [
          customMessage ? {
            type: 'text',
            text: customMessage,
            size: 'sm',
            color: '#666666',
            wrap: true,
            margin: 'md'
          } : null,
          {
            type: 'button',
            style: 'primary',
            action: {
              type: 'uri',
              label: 'Check it out',
              uri: `${process.env.FRONTEND_URL}?strategy=${strategy.id}&ref=share`
            }
          }
        ].filter(Boolean)
      }
    }
  };
}

async function handleLineEvent(event) {
  if (event.type === 'message' && event.message.type === 'text') {
    const userId = event.source.userId;
    const text = event.message.text.toLowerCase();

    let replyMessage;

    if (text.includes('portfolio') || text.includes('balance')) {
      replyMessage = {
        type: 'text',
        text: 'Check your portfolio in the KAIA YIELD AI app! 📊\nTap the menu to open the Mini-dApp.'
      };
    } else if (text.includes('strategy') || text.includes('yield')) {
      replyMessage = {
        type: 'text',
        text: 'Discover AI-powered yield strategies! 🤖\nOur algorithms find the best opportunities for your risk level.'
      };
    } else if (text.includes('help') || text === 'hi' || text === 'hello') {
      replyMessage = createHelpMessage();
    } else {
      replyMessage = {
        type: 'text',
        text: 'Welcome to KAIA YIELD AI! 🚀\nMaximize your USDT returns with AI-powered strategies.\n\nType "help" for more options.'
      };
    }

    await lineClient.replyMessage(event.replyToken, replyMessage);
  }
}

function createHelpMessage() {
  return {
    type: 'flex',
    altText: 'KAIA YIELD AI Help',
    contents: {
      type: 'bubble',
      header: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: 'KAIA YIELD AI',
            weight: 'bold',
            color: '#1DB954',
            size: 'lg'
          }
        ]
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: 'How can I help you?',
            weight: 'bold',
            size: 'lg',
            margin: 'md'
          },
          {
            type: 'separator',
            margin: 'lg'
          },
          {
            type: 'text',
            text: '📊 Portfolio - Check your yields\n🤖 Strategies - AI recommendations\n🎮 Games - Earn rewards\n🏆 Leaderboard - Compare with friends',
            wrap: true,
            margin: 'lg',
            size: 'sm'
          }
        ]
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'button',
            style: 'primary',
            action: {
              type: 'uri',
              label: 'Open App',
              uri: process.env.FRONTEND_URL || 'https://kaia-yield-ai.com'
            }
          }
        ]
      }
    }
  };
}

async function awardSocialBonus(userId, shareCount, strategyId) {
  // In real implementation, this would:
  // 1. Update user's social bonus status in smart contract
  // 2. Award bonus points for sharing
  // 3. Track referral metrics

  console.log(`Social bonus awarded to ${userId}: ${shareCount} shares of strategy ${strategyId}`);

  // Simulate social bonus points
  return {
    bonusPoints: shareCount * 10,
    socialBonusUnlocked: true
  };
}

async function getShareCount(userId) {
  // In real implementation, query database for user's share history
  return Math.floor(Math.random() * 10) + 1;
}

function generateReferralCode(userId) {
  // Generate a simple referral code based on userId
  const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return `KAIA${hash.toString(36).toUpperCase().slice(-6)}`;
}

function generateSimulatedFriendsLeaderboard(userId) {
  // Simulated friends data for demo
  return [
    {
      rank: 1,
      name: 'Alice',
      level: 12,
      points: 2450,
      avatar: '👩‍💼'
    },
    {
      rank: 2,
      name: 'Bob',
      level: 8,
      points: 1680,
      avatar: '👨‍💻'
    },
    {
      rank: 3,
      name: 'You',
      level: 6,
      points: 1200,
      avatar: '🧑‍🚀',
      isCurrentUser: true
    },
    {
      rank: 4,
      name: 'Carol',
      level: 5,
      points: 950,
      avatar: '👩‍🎓'
    }
  ];
}

function generateSocialChallenges() {
  return [
    {
      id: 'invite_friend',
      name: 'Invite a Friend',
      description: 'Share KAIA YIELD AI with a friend',
      reward: 100,
      progress: 0,
      target: 1,
      type: 'social'
    },
    {
      id: 'share_strategy',
      name: 'Strategy Sharer',
      description: 'Share 3 strategies this week',
      reward: 200,
      progress: 1,
      target: 3,
      type: 'sharing'
    }
  ];
}

function createRewardNotification(reward, type, amount) {
  const emoji = type === 'yield' ? '💰' :
                type === 'mission' ? '🏆' :
                type === 'social' ? '🤝' : '🎉';

  return {
    type: 'text',
    text: `${emoji} Congratulations!\n\nYou earned ${amount} points from ${reward}!\n\nKeep up the great work! 🚀`
  };
}

module.exports = router;