import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const DashboardContainer = styled.div`
  max-width: 480px;
  margin: 0 auto;
`;

const BalanceCard = styled(motion.div)`
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  padding: 2rem;
  margin-bottom: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  text-align: center;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
`;

const BalanceAmount = styled.div`
  font-size: 2.5rem;
  font-weight: 700;
  color: white;
  margin-bottom: 0.5rem;
`;

const BalanceLabel = styled.div`
  color: rgba(255, 255, 255, 0.8);
  font-size: 1rem;
  margin-bottom: 1rem;
`;

const EarningsChange = styled.div`
  color: ${props => props.positive ? '#00B894' : '#E17055'};
  font-size: 1.1rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
`;

const StrategyGrid = styled.div`
  display: grid;
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const StrategyCard = styled(motion.div)`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(15px);
  border-radius: 16px;
  padding: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 30px rgba(0, 212, 255, 0.3);
    border-color: ${props => props.theme.primary};
  }
`;

const StrategyHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const StrategyName = styled.h3`
  color: white;
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
`;

const APYBadge = styled.div`
  background: ${props => props.theme.gradient};
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 600;
  box-shadow: 0 2px 10px rgba(0, 212, 255, 0.3);
`;

const StrategyDetails = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1rem;
`;

const DetailItem = styled.div`
  text-align: center;
`;

const DetailLabel = styled.div`
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.8rem;
  margin-bottom: 0.25rem;
`;

const DetailValue = styled.div`
  color: white;
  font-weight: 600;
`;

const RiskIndicator = styled.div`
  display: flex;
  gap: 0.25rem;
  margin-bottom: 1rem;
`;

const RiskDot = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${props => {
    if (props.level <= 3) return '#00B894';
    if (props.level <= 6) return '#FDCB6E';
    return '#E17055';
  }};
  opacity: ${props => props.active ? 1 : 0.3};
`;

const ActionButton = styled(motion.button)`
  width: 100%;
  padding: 1rem;
  background: ${props => props.theme.gradient};
  color: white;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(0, 212, 255, 0.4);
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ChartContainer = styled.div`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(15px);
  border-radius: 16px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
`;

const QuickActions = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const QuickActionButton = styled(motion.button)`
  padding: 1rem;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(15px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  color: white;
  font-weight: 600;
  cursor: pointer;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
`;

const AIRecommendation = styled(motion.div)`
  background: linear-gradient(135deg, #6C5CE7 0%, #A55EEA 100%);
  border-radius: 16px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  color: white;
`;

const RecommendationTitle = styled.h3`
  margin: 0 0 1rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.1rem;
`;

function StrategyDashboard() {
  const [portfolioData, setPortfolioData] = useState({
    totalBalance: 2547.89,
    totalEarnings: 247.89,
    dailyChange: 12.45,
    dailyChangePercent: 2.34
  });

  const [strategies, setStrategies] = useState([
    {
      id: 1,
      name: 'Stable Earn',
      apy: 5.2,
      tvl: 1234567,
      userDeposit: 1000,
      riskLevel: 2,
      icon: '🛡️',
      description: 'Low-risk stable yield'
    },
    {
      id: 2,
      name: 'Growth Plus',
      apy: 11.8,
      tvl: 567890,
      userDeposit: 800,
      riskLevel: 5,
      icon: '📈',
      description: 'Balanced growth strategy'
    },
    {
      id: 3,
      name: 'High Yield Pro',
      apy: 26.5,
      tvl: 234567,
      userDeposit: 500,
      riskLevel: 8,
      icon: '🚀',
      description: 'High-risk high-reward'
    }
  ]);

  const [aiRecommendation, setAIRecommendation] = useState({
    strategy: 'Growth Plus',
    confidence: 87,
    reason: 'Based on your risk profile and market conditions, Growth Plus offers optimal risk-adjusted returns.'
  });

  const chartData = {
    labels: ['1D', '7D', '30D', '90D', '1Y'],
    datasets: [
      {
        label: 'Portfolio Value',
        data: [2200, 2350, 2400, 2500, 2547],
        borderColor: '#00D4FF',
        backgroundColor: 'rgba(0, 212, 255, 0.1)',
        tension: 0.4,
        fill: true
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.8)'
        }
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.8)'
        }
      }
    }
  };

  const handleInvest = (strategyId) => {
    // Implementation for investment flow
    console.log('Investing in strategy:', strategyId);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <DashboardContainer>
      {/* Portfolio Balance */}
      <BalanceCard
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <BalanceAmount>{formatCurrency(portfolioData.totalBalance)}</BalanceAmount>
        <BalanceLabel>Total Portfolio Value</BalanceLabel>
        <EarningsChange positive={portfolioData.dailyChange > 0}>
          {portfolioData.dailyChange > 0 ? '↗️' : '↘️'}
          {formatCurrency(Math.abs(portfolioData.dailyChange))} 
          ({portfolioData.dailyChangePercent.toFixed(2)}%)
        </EarningsChange>
      </BalanceCard>

      {/* AI Recommendation */}
      <AIRecommendation
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <RecommendationTitle>
          🤖 AI Recommendation
          <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>
            {aiRecommendation.confidence}% confidence
          </span>
        </RecommendationTitle>
        <p style={{ margin: 0, lineHeight: 1.5 }}>
          {aiRecommendation.reason}
        </p>
      </AIRecommendation>

      {/* Portfolio Chart */}
      <ChartContainer>
        <h3 style={{ color: 'white', margin: '0 0 1rem 0' }}>📊 Portfolio Performance</h3>
        <Line data={chartData} options={chartOptions} />
      </ChartContainer>

      {/* Quick Actions */}
      <QuickActions>
        <QuickActionButton
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          💰 Deposit USDT
        </QuickActionButton>
        <QuickActionButton
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          📤 Withdraw
        </QuickActionButton>
      </QuickActions>

      {/* Strategy Cards */}
      <StrategyGrid>
        {strategies.map((strategy, index) => (
          <StrategyCard
            key={strategy.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
            whileHover={{ scale: 1.02 }}
            onClick={() => handleInvest(strategy.id)}
          >
            <StrategyHeader>
              <StrategyName>
                {strategy.icon} {strategy.name}
              </StrategyName>
              <APYBadge>{strategy.apy}% APY</APYBadge>
            </StrategyHeader>

            <StrategyDetails>
              <DetailItem>
                <DetailLabel>Your Deposit</DetailLabel>
                <DetailValue>{formatCurrency(strategy.userDeposit)}</DetailValue>
              </DetailItem>
              <DetailItem>
                <DetailLabel>TVL</DetailLabel>
                <DetailValue>
                  {(strategy.tvl / 1000000).toFixed(1)}M
                </DetailValue>
              </DetailItem>
            </StrategyDetails>

            <DetailLabel>Risk Level</DetailLabel>
            <RiskIndicator>
              {[...Array(10)].map((_, i) => (
                <RiskDot
                  key={i}
                  level={strategy.riskLevel}
                  active={i < strategy.riskLevel}
                />
              ))}
            </RiskIndicator>

            <ActionButton
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {strategy.userDeposit > 0 ? 'Add More' : 'Start Earning'}
            </ActionButton>
          </StrategyCard>
        ))}
      </StrategyGrid>
    </DashboardContainer>
  );
}

export default StrategyDashboard;