import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import liff from '@line/liff';
import QRCode from 'qrcode';

const SocialContainer = styled.div`
  max-width: 480px;
  margin: 0 auto;
`;

const DIDCard = styled(motion.div)`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 20px;
  padding: 2rem;
  margin-bottom: 1.5rem;
  color: white;
  position: relative;
  overflow: hidden;
`;

const DIDHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
`;

const DIDTitle = styled.h2`
  margin: 0;
  font-size: 1.3rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const VerificationBadge = styled.div`
  background: ${props => props.verified ? '#00B894' : '#E17055'};
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const DIDInfo = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const DIDField = styled.div`
  text-align: center;
`;

const DIDLabel = styled.div`
  font-size: 0.8rem;
  opacity: 0.8;
  margin-bottom: 0.25rem;
`;

const DIDValue = styled.div`
  font-weight: 600;
  font-size: 0.9rem;
`;

const CredentialsList = styled.div`
  margin-top: 1rem;
`;

const CredentialItem = styled(motion.div)`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 1rem;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const CredentialInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const CredentialIcon = styled.div`
  font-size: 1.5rem;
`;

const CredentialDetails = styled.div``;

const CredentialName = styled.div`
  font-weight: 600;
  margin-bottom: 0.25rem;
`;

const CredentialDate = styled.div`
  font-size: 0.8rem;
  opacity: 0.8;
`;

const CredentialScore = styled.div`
  background: rgba(255, 255, 255, 0.2);
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.9rem;
`;

const SocialCard = styled(motion.div)`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(15px);
  border-radius: 16px;
  padding: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  margin-bottom: 1.5rem;
`;

const SectionTitle = styled.h3`
  color: white;
  margin: 0 0 1rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.1rem;
`;

const FriendsList = styled.div`
  display: grid;
  gap: 0.75rem;
`;

const FriendItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 1rem;
`;

const FriendInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const FriendAvatar = styled.img`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.3);
`;

const FriendDetails = styled.div``;

const FriendName = styled.div`
  color: white;
  font-weight: 600;
  margin-bottom: 0.25rem;
`;

const FriendStats = styled.div`
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.7);
`;

const FriendActions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const ActionButton = styled(motion.button)`
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  
  ${props => {
    if (props.primary) {
      return `
        background: ${props.theme.gradient};
        color: white;
      `;
    } else {
      return `
        background: rgba(255, 255, 255, 0.1);
        color: white;
        border: 1px solid rgba(255, 255, 255, 0.3);
      `;
    }
  }}
`;

const ReferralCard = styled(motion.div)`
  background: linear-gradient(135deg, #00B894 0%, #00D4FF 100%);
  border-radius: 16px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  color: white;
  text-align: center;
`;

const ReferralCode = styled.div`
  background: rgba(255, 255, 255, 0.2);
  padding: 1rem;
  border-radius: 12px;
  font-family: 'Courier New', monospace;
  font-size: 1.2rem;
  font-weight: 700;
  letter-spacing: 2px;
  margin: 1rem 0;
  cursor: pointer;
  
  &:hover {
    background: rgba(255, 255, 255, 0.3);
  }
`;

const QRCodeContainer = styled.div`
  background: white;
  padding: 1rem;
  border-radius: 12px;
  margin: 1rem 0;
  display: inline-block;
`;

const ShareButton = styled(motion.button)`
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: 1rem 2rem;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  margin: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
`;

const SocialStats = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const StatCard = styled.div`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 1rem;
  text-align: center;
`;

const StatValue = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: ${props => props.theme.primary};
  margin-bottom: 0.25rem;
`;

const StatLabel = styled.div`
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.8);
`;

const TrustScoreRing = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  border: 6px solid rgba(255, 255, 255, 0.2);
  border-top: 6px solid ${props => props.theme.primary};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  font-weight: 700;
  color: white;
  margin: 0 auto 1rem auto;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: -6px;
    left: -6px;
    right: -6px;
    bottom: -6px;
    border-radius: 50%;
    border: 6px solid transparent;
    border-top: 6px solid ${props => props.theme.success};
    transform: rotate(${props => (props.score / 100) * 360}deg);
  }
`;

function SocialFeatures({ userProfile }) {
  const [didData, setDidData] = useState({
    verified: true,
    trustScore: 87,
    walletAge: 156,
    transactionCount: 1247,
    credentials: [
      {
        id: 1,
        name: 'Early Adopter',
        icon: '🚀',
        earnedDate: '2024-08-25',
        score: 100,
        issuer: 'KAIA Foundation'
      },
      {
        id: 2,
        name: 'DeFi Veteran',
        icon: '💎',
        earnedDate: '2024-08-28',
        score: 95,
        issuer: 'LINE Blockchain'
      },
      {
        id: 3,
        name: 'AI Collaborator',
        icon: '🤖',
        earnedDate: '2024-09-01',
        score: 90,
        issuer: 'KAIA Yield AI'
      },
      {
        id: 4,
        name: 'Social Connector',
        icon: '🌐',
        earnedDate: '2024-09-05',
        score: 85,
        issuer: 'LINE Social'
      }
    ]
  });

  const [friends, setFriends] = useState([
    {
      id: 1,
      name: 'CryptoMaster',
      avatar: '/api/placeholder/40/40',
      level: 15,
      points: 5420,
      status: 'online',
      mutual: true
    },
    {
      id: 2,
      name: 'YieldHunter',
      avatar: '/api/placeholder/40/40',
      level: 12,
      points: 4980,
      status: 'offline',
      mutual: true
    },
    {
      id: 3,
      name: 'DeFiPro',
      avatar: '/api/placeholder/40/40',
      level: 18,
      points: 4750,
      status: 'online',
      mutual: false
    }
  ]);

  const [referralData, setReferralData] = useState({
    code: 'KAIA-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
    totalReferrals: 12,
    activeReferrals: 8,
    totalRewards: 2500
  });

  const [qrCodeUrl, setQrCodeUrl] = useState('');

  useEffect(() => {
    generateQRCode();
  }, [referralData.code]);

  const generateQRCode = async () => {
    try {
      const referralLink = `https://kaia-yield-ai.app/ref/${referralData.code}`;
      const qr = await QRCode.toDataURL(referralLink, {
        width: 200,
        margin: 2,
        color: {
          dark: '#2D3436',
          light: '#FFFFFF'
        }
      });
      setQrCodeUrl(qr);
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  };

  const shareReferralCode = async () => {
    const referralMessage = `🚀 Join me on KAIA Yield AI!\n\n💰 Earn passive income with AI-optimized USDT strategies\n📈 I'm already earning up to 26.5% APY!\n🎮 Complete missions and earn rewards\n\nUse my referral code: ${referralData.code}\n\n🔗 https://kaia-yield-ai.app/ref/${referralData.code}`;

    if (liff.isApiAvailable('sendMessages')) {
      try {
        await liff.sendMessages([
          {
            type: 'text',
            text: referralMessage
          }
        ]);
      } catch (error) {
        console.error('Failed to share referral:', error);
      }
    }

    // Fallback to clipboard
    if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(referralMessage);
        alert('Referral message copied to clipboard!');
      } catch (error) {
        console.error('Failed to copy to clipboard:', error);
      }
    }
  };

  const copyReferralCode = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(referralData.code);
      alert('Referral code copied!');
    }
  };

  const inviteFriend = async (friendId) => {
    const inviteMessage = `🎮 Challenge accepted!\n\nJoin me on KAIA Yield AI and let's compete on the leaderboard!\n\n🏆 Current leaders:\n• Me: Level ${Math.floor(Math.random() * 20) + 5}\n• You: Ready to start?\n\nUse code: ${referralData.code}\n🔗 https://kaia-yield-ai.app/ref/${referralData.code}`;

    if (liff.isApiAvailable('sendMessages')) {
      try {
        await liff.sendMessages([
          {
            type: 'text',
            text: inviteMessage
          }
        ]);
      } catch (error) {
        console.error('Failed to invite friend:', error);
      }
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <SocialContainer>
      {/* DID Credentials Card */}
      <DIDCard
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <DIDHeader>
          <DIDTitle>
            🆔 Digital Identity
          </DIDTitle>
          <VerificationBadge verified={didData.verified}>
            {didData.verified ? '✅ Verified' : '⚠️ Pending'}
          </VerificationBadge>
        </DIDHeader>

        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <TrustScoreRing score={didData.trustScore}>
            {didData.trustScore}
          </TrustScoreRing>
          <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>
            Trust Score
          </div>
        </div>

        <DIDInfo>
          <DIDField>
            <DIDLabel>LINE User ID</DIDLabel>
            <DIDValue>{userProfile?.userId?.slice(0, 8) || 'U1a2b3c4'}...</DIDValue>
          </DIDField>
          <DIDField>
            <DIDLabel>Wallet Age</DIDLabel>
            <DIDValue>{didData.walletAge} days</DIDValue>
          </DIDField>
          <DIDField>
            <DIDLabel>Transactions</DIDLabel>
            <DIDValue>{didData.transactionCount.toLocaleString()}</DIDValue>
          </DIDField>
          <DIDField>
            <DIDLabel>Risk Profile</DIDLabel>
            <DIDValue>Moderate</DIDValue>
          </DIDField>
        </DIDInfo>

        <SectionTitle style={{ margin: '1rem 0', fontSize: '1rem' }}>
          🏆 Earned Credentials
        </SectionTitle>

        <CredentialsList>
          {didData.credentials.map((credential, index) => (
            <CredentialItem
              key={credential.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <CredentialInfo>
                <CredentialIcon>{credential.icon}</CredentialIcon>
                <CredentialDetails>
                  <CredentialName>{credential.name}</CredentialName>
                  <CredentialDate>
                    {formatDate(credential.earnedDate)} • {credential.issuer}
                  </CredentialDate>
                </CredentialDetails>
              </CredentialInfo>
              <CredentialScore>{credential.score}/100</CredentialScore>
            </CredentialItem>
          ))}
        </CredentialsList>
      </DIDCard>

      {/* Social Stats */}
      <SocialStats>
        <StatCard>
          <StatValue>{referralData.totalReferrals}</StatValue>
          <StatLabel>Total Referrals</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{referralData.activeReferrals}</StatValue>
          <StatLabel>Active Friends</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{referralData.totalRewards}</StatValue>
          <StatLabel>Reward Points</StatLabel>
        </StatCard>
      </SocialStats>

      {/* Referral Program */}
      <ReferralCard
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <h3 style={{ margin: '0 0 1rem 0' }}>🎁 Invite Friends & Earn</h3>
        <p style={{ margin: '0 0 1rem 0', opacity: 0.9 }}>
          Earn 500 points for each friend who joins and makes their first deposit!
        </p>
        
        <div style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>
          Your Referral Code:
        </div>
        <ReferralCode onClick={copyReferralCode}>
          {referralData.code}
        </ReferralCode>

        {qrCodeUrl && (
          <QRCodeContainer>
            <img src={qrCodeUrl} alt="Referral QR Code" />
          </QRCodeContainer>
        )}

        <ShareButton
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={shareReferralCode}
        >
          📤 Share via LINE
        </ShareButton>
      </ReferralCard>

      {/* Friends List */}
      <SocialCard
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <SectionTitle>👥 Friends & Community</SectionTitle>
        
        <FriendsList>
          {friends.map((friend, index) => (
            <FriendItem key={friend.id}>
              <FriendInfo>
                <FriendAvatar 
                  src={friend.avatar} 
                  alt={friend.name}
                  onError={(e) => {
                    e.target.src = `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><rect width="40" height="40" fill="%23${Math.floor(Math.random()*16777215).toString(16)}"/><text x="20" y="25" text-anchor="middle" fill="white" font-family="Arial" font-size="16">${friend.name[0]}</text></svg>`;
                  }}
                />
                <FriendDetails>
                  <FriendName>{friend.name}</FriendName>
                  <FriendStats>
                    Level {friend.level} • {friend.points.toLocaleString()} points
                    {friend.status === 'online' && (
                      <span style={{ color: '#00B894' }}> • Online</span>
                    )}
                  </FriendStats>
                </FriendDetails>
              </FriendInfo>
              
              <FriendActions>
                <ActionButton
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => inviteFriend(friend.id)}
                >
                  💬 Chat
                </ActionButton>
                {!friend.mutual && (
                  <ActionButton
                    primary
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    ➕ Add
                  </ActionButton>
                )}
              </FriendActions>
            </FriendItem>
          ))}
        </FriendsList>
      </SocialCard>
    </SocialContainer>
  );
}

export default SocialFeatures;