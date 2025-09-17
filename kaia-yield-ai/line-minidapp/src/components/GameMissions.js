import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import liff from '@line/liff';

const MissionsContainer = styled.div`
  max-width: 480px;
  margin: 0 auto;
`;

const PlayerCard = styled(motion.div)`
  background: linear-gradient(135deg, #6C5CE7 0%, #A55EEA 100%);
  border-radius: 20px;
  padding: 2rem;
  margin-bottom: 1.5rem;
  color: white;
  text-align: center;
  position: relative;
  overflow: hidden;
`;

const PlayerLevel = styled.div`
  font-size: 3rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
`;

const PlayerStats = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 1rem;
  margin-top: 1.5rem;
`;

const StatItem = styled.div`
  text-align: center;
`;

const StatValue = styled.div`
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
`;

const StatLabel = styled.div`
  font-size: 0.8rem;
  opacity: 0.8;
`;

const XPBar = styled.div`
  background: rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  height: 12px;
  margin: 1rem 0;
  position: relative;
  overflow: hidden;
`;

const XPProgress = styled(motion.div)`
  background: linear-gradient(90deg, #00D4FF 0%, #00B894 100%);
  height: 100%;
  border-radius: 10px;
`;

const XPText = styled.div`
  font-size: 0.9rem;
  opacity: 0.9;
  margin-top: 0.5rem;
`;

const SectionTitle = styled.h2`
  color: white;
  margin: 0 0 1rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.3rem;
`;

const MissionGrid = styled.div`
  display: grid;
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const MissionCard = styled(motion.div)`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(15px);
  border-radius: 16px;
  padding: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  position: relative;
  overflow: hidden;
`;

const MissionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
`;

const MissionTitle = styled.h3`
  color: white;
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const MissionReward = styled.div`
  background: ${props => props.theme.gradient};
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 600;
  white-space: nowrap;
`;

const MissionDescription = styled.p`
  color: rgba(255, 255, 255, 0.8);
  margin: 0 0 1rem 0;
  line-height: 1.4;
`;

const ProgressContainer = styled.div`
  margin-bottom: 1rem;
`;

const ProgressBar = styled.div`
  background: rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  height: 8px;
  position: relative;
  overflow: hidden;
  margin-bottom: 0.5rem;
`;

const ProgressFill = styled(motion.div)`
  background: ${props => {
    if (props.progress >= 100) return 'linear-gradient(90deg, #00B894 0%, #00D4FF 100%)';
    return 'linear-gradient(90deg, #FDCB6E 0%, #E17055 100%)';
  }};
  height: 100%;
  border-radius: 10px;
`;

const ProgressText = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.7);
`;

const MissionButton = styled(motion.button)`
  width: 100%;
  padding: 1rem;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  
  ${props => {
    if (props.completed) {
      return `
        background: linear-gradient(135deg, #00B894 0%, #00D4FF 100%);
        color: white;
      `;
    } else if (props.available) {
      return `
        background: ${props.theme.gradient};
        color: white;
      `;
    } else {
      return `
        background: rgba(255, 255, 255, 0.1);
        color: rgba(255, 255, 255, 0.5);
        cursor: not-allowed;
      `;
    }
  }}
`;

const DifficultyBadge = styled.div`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: ${props => {
    switch(props.difficulty) {
      case 1: return '#00B894';
      case 2: return '#FDCB6E';
      case 3: return '#E17055';
      case 4: return '#6C5CE7';
      case 5: return '#E84393';
      default: return '#74B9FF';
    }
  }};
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.7rem;
  font-weight: 600;
`;

const LeaderboardCard = styled(motion.div)`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(15px);
  border-radius: 16px;
  padding: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  margin-bottom: 1.5rem;
`;

const LeaderboardItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  margin-bottom: 0.5rem;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const LeaderboardRank = styled.div`
  font-size: 1.2rem;
  font-weight: 700;
  color: ${props => {
    if (props.rank === 1) return '#FFD700';
    if (props.rank === 2) return '#C0C0C0';
    if (props.rank === 3) return '#CD7F32';
    return 'white';
  }};
`;

const LeaderboardUser = styled.div`
  flex: 1;
  margin-left: 1rem;
  color: white;
`;

const LeaderboardScore = styled.div`
  color: ${props => props.theme.primary};
  font-weight: 600;
`;

const AchievementBadge = styled(motion.div)`
  background: linear-gradient(135deg, #FFD700 0%, #FFA726 100%);
  color: #2D3436;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0.25rem;
`;

const ShareButton = styled(motion.button)`
  background: #00C851;
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  width: 100%;
  margin-top: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
`;

function GameMissions({ userProfile }) {
  const [playerData, setPlayerData] = useState({
    level: 3,
    xp: 1250,
    xpToNext: 2000,
    points: 1250,
    streak: 5,
    rank: 47,
    achievements: ['🏆 First Deposit', '📈 Yield Explorer', '⚡ Speed Trader']
  });

  const [missions, setMissions] = useState([
    {
      id: 1,
      title: 'First Deposit Champion',
      description: 'Make your first USDT deposit in any strategy',
      reward: 100,
      difficulty: 1,
      progress: 100,
      maxProgress: 100,
      completed: true,
      claimed: true,
      icon: '💰',
      type: 'deposit'
    },
    {
      id: 2,
      title: 'Yield Explorer',
      description: 'Try 3 different yield strategies to diversify your portfolio',
      reward: 250,
      difficulty: 2,
      progress: 67,
      maxProgress: 100,
      completed: false,
      claimed: false,
      icon: '🎯',
      type: 'diversification'
    },
    {
      id: 3,
      title: 'Consistency King',
      description: 'Check your portfolio for 7 consecutive days',
      reward: 150,
      difficulty: 2,
      progress: 71,
      maxProgress: 100,
      completed: false,
      claimed: false,
      icon: '📱',
      type: 'engagement'
    },
    {
      id: 4,
      title: 'Social Butterfly',
      description: 'Invite 5 friends to join KAIA Yield AI through LINE',
      reward: 500,
      difficulty: 3,
      progress: 40,
      maxProgress: 100,
      completed: false,
      claimed: false,
      icon: '👥',
      type: 'social'
    },
    {
      id: 5,
      title: 'High Roller',
      description: 'Deposit more than 1000 USDT in a single transaction',
      reward: 1000,
      difficulty: 4,
      progress: 0,
      maxProgress: 100,
      completed: false,
      claimed: false,
      icon: '💎',
      type: 'deposit'
    },
    {
      id: 6,
      title: 'AI Whisperer',
      description: 'Have 20 conversations with the AI assistant',
      reward: 200,
      difficulty: 2,
      progress: 85,
      maxProgress: 100,
      completed: false,
      claimed: false,
      icon: '🤖',
      type: 'ai'
    }
  ]);

  const [leaderboard, setLeaderboard] = useState([
    { rank: 1, name: 'CryptoMaster', score: 5420, avatar: '👑' },
    { rank: 2, name: 'YieldHunter', score: 4980, avatar: '🎯' },
    { rank: 3, name: 'DeFiPro', score: 4750, avatar: '💎' },
    { rank: 4, name: 'StrategyGuru', score: 4200, avatar: '🧠' },
    { rank: 5, name: 'You', score: playerData.points, avatar: '🚀' }
  ]);

  const handleStartMission = async (missionId) => {
    const mission = missions.find(m => m.id === missionId);
    if (!mission || mission.completed) return;

    // Update mission progress (simulate)
    setMissions(prev => prev.map(m => 
      m.id === missionId 
        ? { ...m, progress: Math.min(m.progress + 10, 100) }
        : m
    ));

    // Share to LINE if it's a social mission
    if (mission.type === 'social' && liff.isApiAvailable('sendMessages')) {
      try {
        await liff.sendMessages([
          {
            type: 'text',
            text: `🚀 Join me on KAIA Yield AI! \n\nEarn passive income with AI-optimized USDT strategies. I'm already earning ${(Math.random() * 50 + 10).toFixed(2)}% APY! \n\n💰 Get started: [link]`
          }
        ]);
      } catch (error) {
        console.error('Failed to share mission:', error);
      }
    }
  };

  const handleClaimReward = (missionId) => {
    const mission = missions.find(m => m.id === missionId);
    if (!mission || !mission.completed || mission.claimed) return;

    setMissions(prev => prev.map(m => 
      m.id === missionId ? { ...m, claimed: true } : m
    ));

    setPlayerData(prev => ({
      ...prev,
      points: prev.points + mission.reward,
      xp: prev.xp + mission.reward
    }));

    // Show achievement animation
    console.log(`Claimed ${mission.reward} points for ${mission.title}!`);
  };

  const shareProgress = async () => {
    if (liff.isApiAvailable('sendMessages')) {
      try {
        await liff.sendMessages([
          {
            type: 'text',
            text: `🎮 My KAIA Yield AI Progress!\n\n🏆 Level: ${playerData.level}\n⭐ Points: ${playerData.points}\n📈 Rank: #${playerData.rank}\n🔥 Streak: ${playerData.streak} days\n\nJoin me in earning with AI-powered USDT strategies! 🚀`
          }
        ]);
      } catch (error) {
        console.error('Failed to share progress:', error);
      }
    }
  };

  const getDifficultyText = (difficulty) => {
    switch(difficulty) {
      case 1: return 'Easy';
      case 2: return 'Medium';
      case 3: return 'Hard';
      case 4: return 'Expert';
      case 5: return 'Legendary';
      default: return 'Unknown';
    }
  };

  // Simulate mission progress updates
  useEffect(() => {
    const interval = setInterval(() => {
      setMissions(prev => prev.map(mission => {
        if (mission.completed || mission.claimed) return mission;
        
        // Randomly update progress for active missions
        if (Math.random() < 0.3) {
          const newProgress = Math.min(mission.progress + Math.random() * 5, 100);
          return {
            ...mission,
            progress: newProgress,
            completed: newProgress >= 100
          };
        }
        return mission;
      }));
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  return (
    <MissionsContainer>
      {/* Player Stats Card */}
      <PlayerCard
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <PlayerLevel>Level {playerData.level}</PlayerLevel>
        <div style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>
          {userProfile?.displayName || 'Yield Farmer'} 🚀
        </div>
        
        <XPBar>
          <XPProgress
            initial={{ width: 0 }}
            animate={{ width: `${(playerData.xp / playerData.xpToNext) * 100}%` }}
            transition={{ duration: 1, delay: 0.5 }}
          />
        </XPBar>
        <XPText>{playerData.xp} / {playerData.xpToNext} XP to next level</XPText>

        <PlayerStats>
          <StatItem>
            <StatValue>{playerData.points}</StatValue>
            <StatLabel>Points</StatLabel>
          </StatItem>
          <StatItem>
            <StatValue>#{playerData.rank}</StatValue>
            <StatLabel>Rank</StatLabel>
          </StatItem>
          <StatItem>
            <StatValue>{playerData.streak}</StatValue>
            <StatLabel>Day Streak</StatLabel>
          </StatItem>
        </PlayerStats>

        <ShareButton
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={shareProgress}
        >
          📤 Share Progress
        </ShareButton>
      </PlayerCard>

      {/* Achievements */}
      <div style={{ marginBottom: '1.5rem' }}>
        <SectionTitle>🏆 Recent Achievements</SectionTitle>
        <div>
          {playerData.achievements.map((achievement, index) => (
            <AchievementBadge
              key={index}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              {achievement}
            </AchievementBadge>
          ))}
        </div>
      </div>

      {/* Active Missions */}
      <SectionTitle>🎮 Active Missions</SectionTitle>
      <MissionGrid>
        {missions.map((mission, index) => (
          <MissionCard
            key={mission.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <DifficultyBadge difficulty={mission.difficulty}>
              {getDifficultyText(mission.difficulty)}
            </DifficultyBadge>
            
            <MissionHeader>
              <MissionTitle>
                {mission.icon} {mission.title}
              </MissionTitle>
              <MissionReward>+{mission.reward} pts</MissionReward>
            </MissionHeader>

            <MissionDescription>{mission.description}</MissionDescription>

            <ProgressContainer>
              <ProgressBar>
                <ProgressFill
                  progress={mission.progress}
                  initial={{ width: 0 }}
                  animate={{ width: `${mission.progress}%` }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                />
              </ProgressBar>
              <ProgressText>
                <span>Progress</span>
                <span>{mission.progress}%</span>
              </ProgressText>
            </ProgressContainer>

            <MissionButton
              completed={mission.completed && mission.claimed}
              available={!mission.completed}
              whileHover={{ scale: mission.completed && !mission.claimed ? 1.05 : 1 }}
              whileTap={{ scale: mission.completed && !mission.claimed ? 0.95 : 1 }}
              onClick={() => {
                if (mission.completed && !mission.claimed) {
                  handleClaimReward(mission.id);
                } else if (!mission.completed) {
                  handleStartMission(mission.id);
                }
              }}
              disabled={mission.completed && mission.claimed}
            >
              {mission.completed && mission.claimed
                ? '✅ Claimed'
                : mission.completed
                ? '🎁 Claim Reward'
                : '🚀 Start Mission'
              }
            </MissionButton>
          </MissionCard>
        ))}
      </MissionGrid>

      {/* Leaderboard */}
      <LeaderboardCard
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <SectionTitle>🏆 Leaderboard</SectionTitle>
        {leaderboard.map((user, index) => (
          <LeaderboardItem key={index}>
            <LeaderboardRank rank={user.rank}>
              #{user.rank} {user.avatar}
            </LeaderboardRank>
            <LeaderboardUser>
              <strong>{user.name}</strong>
            </LeaderboardUser>
            <LeaderboardScore>{user.score} pts</LeaderboardScore>
          </LeaderboardItem>
        ))}
      </LeaderboardCard>
    </MissionsContainer>
  );
}

export default GameMissions;