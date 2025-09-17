import React, { useState, useEffect } from 'react';
import liff from '@line/liff';
import styled, { ThemeProvider } from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import WalletConnect from './components/WalletConnect';
import StrategyDashboard from './components/StrategyDashboard';
import AIChat from './components/AIChat';
import GameMissions from './components/GameMissions';
import SocialFeatures from './components/SocialFeatures';
import Analytics from './components/Analytics';
import { KaiaProvider } from './contexts/KaiaContext';

const theme = {
  primary: '#00D4FF',
  secondary: '#6C5CE7',
  success: '#00B894',
  warning: '#FDCB6E',
  error: '#E17055',
  dark: '#2D3436',
  light: '#DDD6FE',
  white: '#FFFFFF',
  gradient: 'linear-gradient(135deg, #00D4FF 0%, #6C5CE7 100%)',
  shadow: '0 10px 30px rgba(0, 212, 255, 0.3)'
};

const AppContainer = styled.div`
  min-height: 100vh;
  background: ${props => props.theme.gradient};
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
`;

const Header = styled.header`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  padding: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  position: sticky;
  top: 0;
  z-index: 100;
`;

const Title = styled.h1`
  color: white;
  text-align: center;
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
`;

const TabContainer = styled.div`
  display: flex;
  background: rgba(255, 255, 255, 0.1);
  margin: 1rem;
  border-radius: 20px;
  overflow: hidden;
`;

const Tab = styled.button`
  flex: 1;
  padding: 1rem;
  border: none;
  background: ${props => props.active ? 'rgba(255, 255, 255, 0.3)' : 'transparent'};
  color: white;
  font-weight: 600;
  transition: all 0.3s ease;
  cursor: pointer;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
`;

const Content = styled.main`
  padding: 1rem;
  min-height: calc(100vh - 160px);
`;

const LoadingScreen = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: ${props => props.theme.gradient};
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const LoadingLogo = styled(motion.div)`
  width: 80px;
  height: 80px;
  border-radius: 20px;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  font-weight: bold;
  color: ${props => props.theme.primary};
  box-shadow: ${props => props.theme.shadow};
  margin-bottom: 2rem;
`;

const UserProfile = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: white;
  font-size: 0.9rem;
`;

const ProfileImage = styled.img`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid white;
`;

function App() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [userProfile, setUserProfile] = useState(null);
  const [walletConnected, setWalletConnected] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Get LINE user profile
        if (liff.isLoggedIn()) {
          const profile = await liff.getProfile();
          setUserProfile(profile);
        }

        // Check wallet connection
        const savedWallet = localStorage.getItem('walletAddress');
        if (savedWallet) {
          setWalletConnected(true);
        }

        // Simulate loading time for smooth UX
        setTimeout(() => {
          setLoading(false);
        }, 2000);

      } catch (error) {
        console.error('App initialization error:', error);
        setLoading(false);
      }
    };

    initializeApp();
  }, []);

  const tabs = [
    { id: 'dashboard', label: '🏠 Dashboard', icon: '📊' },
    { id: 'ai-chat', label: '🤖 AI Assistant', icon: '💬' },
    { id: 'missions', label: '🎮 Missions', icon: '🏆' },
    { id: 'social', label: '👥 Social', icon: '🌟' },
    { id: 'analytics', label: '📈 Analytics', icon: '📊' }
  ];

  const renderContent = () => {
    if (!walletConnected) {
      return <WalletConnect onConnect={() => setWalletConnected(true)} />;
    }

    switch (activeTab) {
      case 'dashboard':
        return <StrategyDashboard />;
      case 'ai-chat':
        return <AIChat userProfile={userProfile} />;
      case 'missions':
        return <GameMissions userProfile={userProfile} />;
      case 'social':
        return <SocialFeatures userProfile={userProfile} />;
      case 'analytics':
        return <Analytics />;
      default:
        return <StrategyDashboard />;
    }
  };

  if (loading) {
    return (
      <ThemeProvider theme={theme}>
        <LoadingScreen
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <LoadingLogo
            animate={{
              rotate: [0, 360],
              scale: [1, 1.1, 1]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            🚀
          </LoadingLogo>
          <motion.h2
            style={{ color: 'white', textAlign: 'center' }}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            KAIA YIELD AI
          </motion.h2>
          <motion.p
            style={{ color: 'rgba(255,255,255,0.8)', textAlign: 'center' }}
            animate={{ opacity: [0.3, 0.8, 0.3] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
          >
            AI-Powered USDT Yield Optimization
          </motion.p>
        </LoadingScreen>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <KaiaProvider>
        <AppContainer>
          <Header>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Title>🚀 KAIA YIELD AI</Title>
              {userProfile && (
                <UserProfile>
                  <ProfileImage src={userProfile.pictureUrl} alt="Profile" />
                  <span>{userProfile.displayName}</span>
                </UserProfile>
              )}
            </div>
          </Header>

          {walletConnected && (
            <TabContainer>
              {tabs.map((tab) => (
                <Tab
                  key={tab.id}
                  active={activeTab === tab.id}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.icon} {tab.label.split(' ')[1]}
                </Tab>
              ))}
            </TabContainer>
          )}

          <Content>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                {renderContent()}
              </motion.div>
            </AnimatePresence>
          </Content>
        </AppContainer>
      </KaiaProvider>
    </ThemeProvider>
  );
}

export default App;