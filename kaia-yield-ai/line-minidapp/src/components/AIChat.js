import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import liff from '@line/liff';

const ChatContainer = styled.div`
  max-width: 480px;
  margin: 0 auto;
  height: 60vh;
  display: flex;
  flex-direction: column;
`;

const MessagesContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  space-y: 1rem;
  
  &::-webkit-scrollbar {
    width: 4px;
  }
  
  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 2px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.3);
    border-radius: 2px;
  }
`;

const Message = styled(motion.div)`
  display: flex;
  margin-bottom: 1rem;
  ${props => props.isUser ? 'justify-content: flex-end;' : 'justify-content: flex-start;'}
`;

const MessageBubble = styled.div`
  max-width: 80%;
  padding: 1rem 1.5rem;
  border-radius: 20px;
  border-bottom-left-radius: ${props => props.isUser ? '20px' : '5px'};
  border-bottom-right-radius: ${props => props.isUser ? '5px' : '20px'};
  background: ${props => props.isUser 
    ? 'linear-gradient(135deg, #00D4FF 0%, #6C5CE7 100%)'
    : 'rgba(255, 255, 255, 0.15)'
  };
  color: white;
  backdrop-filter: blur(15px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
`;

const MessageText = styled.p`
  margin: 0;
  line-height: 1.5;
`;

const MessageTime = styled.div`
  font-size: 0.7rem;
  opacity: 0.7;
  margin-top: 0.5rem;
`;

const InputContainer = styled.div`
  padding: 1rem;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(15px);
  border-top: 1px solid rgba(255, 255, 255, 0.2);
  display: flex;
  gap: 1rem;
  align-items: center;
`;

const MessageInput = styled.input`
  flex: 1;
  padding: 1rem;
  border: none;
  border-radius: 25px;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  font-size: 1rem;
  backdrop-filter: blur(10px);
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.6);
  }
  
  &:focus {
    outline: none;
    background: rgba(255, 255, 255, 0.3);
  }
`;

const SendButton = styled(motion.button)`
  width: 50px;
  height: 50px;
  border: none;
  border-radius: 50%;
  background: linear-gradient(135deg, #00D4FF 0%, #6C5CE7 100%);
  color: white;
  font-size: 1.2rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 15px rgba(0, 212, 255, 0.4);
`;

const TypingIndicator = styled(motion.div)`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 1.5rem;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 20px;
  border-bottom-left-radius: 5px;
  color: white;
  backdrop-filter: blur(15px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  margin-bottom: 1rem;
`;

const TypingDot = styled(motion.div)`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.8);
`;

const QuickReplies = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin: 1rem 0;
`;

const QuickReply = styled(motion.button)`
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 20px;
  color: white;
  font-size: 0.9rem;
  cursor: pointer;
  backdrop-filter: blur(10px);
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
`;

const WelcomeCard = styled(motion.div)`
  background: linear-gradient(135deg, #6C5CE7 0%, #A55EEA 100%);
  border-radius: 20px;
  padding: 2rem;
  margin-bottom: 1rem;
  color: white;
  text-align: center;
`;

const AIAvatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6C5CE7 0%, #A55EEA 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  margin-right: 0.5rem;
  flex-shrink: 0;
`;

function AIChat({ userProfile }) {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [quickReplies, setQuickReplies] = useState([]);
  const messagesEndRef = useRef(null);

  const initialQuickReplies = [
    '💡 Get investment advice',
    '📊 Check my portfolio',
    '🎯 Optimal strategy?',
    '💰 Current yields',
    '🎮 Available missions'
  ];

  useEffect(() => {
    // Initialize chat with welcome message
    const welcomeMessage = {
      id: Date.now(),
      text: `Hello ${userProfile?.displayName || 'there'}! 🤖\n\nI'm your AI yield optimization assistant. I can help you:\n\n• Find optimal USDT strategies\n• Analyze your portfolio\n• Suggest yield improvements\n• Track your earnings\n• Complete missions\n\nWhat would you like to know?`,
      isUser: false,
      timestamp: new Date()
    };
    
    setMessages([welcomeMessage]);
    setQuickReplies(initialQuickReplies);
  }, [userProfile]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const generateAIResponse = async (userMessage) => {
    const lowerMessage = userMessage.toLowerCase();
    
    // Simulate AI processing delay
    setIsTyping(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsTyping(false);

    let response = '';
    let newQuickReplies = [];

    if (lowerMessage.includes('advice') || lowerMessage.includes('recommend')) {
      response = `🎯 Based on your profile and current market conditions, here's my recommendation:\n\n**Growth Plus Strategy** - 11.8% APY\n✅ Matches your risk tolerance\n✅ Optimal liquidity\n✅ Strong historical performance\n\nCurrent allocation suggestion:\n• 40% Stable Earn (safety)\n• 45% Growth Plus (growth)\n• 15% High Yield Pro (upside)\n\nWould you like me to execute this strategy?`;
      newQuickReplies = ['✅ Execute strategy', '📊 Show details', '🔄 Different option'];
    } else if (lowerMessage.includes('portfolio') || lowerMessage.includes('balance')) {
      response = `📊 **Your Portfolio Summary:**\n\nTotal Value: $2,547.89\nToday's Earnings: +$12.45 (2.34%)\n\n**Strategy Breakdown:**\n🛡️ Stable Earn: $1,000 (5.2% APY)\n📈 Growth Plus: $800 (11.8% APY)\n🚀 High Yield Pro: $500 (26.5% APY)\n\n**Performance:**\n• 7-day return: +$67.23\n• 30-day return: +$234.12\n• Best performer: High Yield Pro\n\nYour portfolio is well-diversified! 🎉`;
      newQuickReplies = ['📈 Rebalance', '💰 Add funds', '📤 Withdraw'];
    } else if (lowerMessage.includes('yield') || lowerMessage.includes('apy')) {
      response = `💰 **Current Yield Rates:**\n\n🛡️ **Stable Earn** - 5.2% APY\n• Risk Level: 2/10 (Low)\n• TVL: $1.23M\n• Min deposit: $10\n\n📈 **Growth Plus** - 11.8% APY\n• Risk Level: 5/10 (Medium)\n• TVL: $567K\n• Min deposit: $50\n\n🚀 **High Yield Pro** - 26.5% APY\n• Risk Level: 8/10 (High)\n• TVL: $234K\n• Min deposit: $100\n\nRates updated every hour based on market conditions! ⏰`;
      newQuickReplies = ['🎯 Best for me?', '💰 Invest now', '📊 Compare'];
    } else if (lowerMessage.includes('mission') || lowerMessage.includes('game')) {
      response = `🎮 **Available Missions:**\n\n🏆 **Active Missions:**\n• First Deposit - Reward: 100 points\n• Yield Explorer - Try 3 strategies (Progress: 2/3)\n• Daily Check-in - 7 days streak\n\n🎯 **Recommended:**\n• Social Referral - Invite friends (+250 points)\n• Portfolio Diversification (+150 points)\n\n**Your Stats:**\n• Level: 3 🌟\n• Total Points: 1,250\n• Leaderboard Rank: #47\n\nComplete missions to unlock premium features! 🚀`;
      newQuickReplies = ['🎯 Start mission', '👥 Invite friends', '🏆 Leaderboard'];
    } else if (lowerMessage.includes('risk') || lowerMessage.includes('safe')) {
      response = `🛡️ **Risk Assessment:**\n\nYour current risk profile: **Moderate (5/10)**\n\nBased on your deposits:\n• 43% Low-risk assets\n• 35% Medium-risk assets  \n• 22% High-risk assets\n\n**Recommendations:**\n✅ Good diversification\n⚠️ Consider reducing high-risk exposure\n📈 Opportunity for growth in medium-risk\n\nWould you like a personalized risk adjustment?`;
      newQuickReplies = ['🔄 Rebalance', '📊 Risk analysis', '🛡️ Safer options'];
    } else {
      response = `I understand you're asking about "${userMessage}". Let me help you with that! 🤖\n\nI can assist with:\n• Investment strategies and recommendations\n• Portfolio analysis and optimization\n• Yield calculations and projections\n• Risk assessments\n• Mission and reward tracking\n• Market insights\n\nWhat specific information would you like?`;
      newQuickReplies = initialQuickReplies;
    }

    return { response, quickReplies: newQuickReplies };
  };

  const handleSendMessage = async (text = inputValue) => {
    if (!text.trim()) return;

    const userMessage = {
      id: Date.now(),
      text: text.trim(),
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setQuickReplies([]);

    // Generate AI response
    const { response, quickReplies: newQuickReplies } = await generateAIResponse(text);

    const aiMessage = {
      id: Date.now() + 1,
      text: response,
      isUser: false,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, aiMessage]);
    setQuickReplies(newQuickReplies);

    // Send to LINE chat if available
    if (liff.isApiAvailable('sendMessages')) {
      try {
        await liff.sendMessages([
          {
            type: 'text',
            text: `🤖 KAIA AI: ${response.substring(0, 100)}...`
          }
        ]);
      } catch (error) {
        console.error('Failed to send LINE message:', error);
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  return (
    <ChatContainer>
      <WelcomeCard
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 style={{ margin: '0 0 1rem 0' }}>🤖 AI Yield Assistant</h2>
        <p style={{ margin: 0, opacity: 0.9 }}>
          Get personalized USDT yield strategies powered by advanced AI
        </p>
      </WelcomeCard>

      <MessagesContainer>
        <AnimatePresence>
          {messages.map((message) => (
            <Message
              key={message.id}
              isUser={message.isUser}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {!message.isUser && <AIAvatar>🤖</AIAvatar>}
              <MessageBubble isUser={message.isUser}>
                <MessageText>{message.text}</MessageText>
                <MessageTime>{formatTime(message.timestamp)}</MessageTime>
              </MessageBubble>
            </Message>
          ))}
        </AnimatePresence>

        {isTyping && (
          <Message isUser={false}>
            <AIAvatar>🤖</AIAvatar>
            <TypingIndicator
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              AI is typing
              {[0, 1, 2].map((i) => (
                <TypingDot
                  key={i}
                  animate={{ y: [0, -5, 0] }}
                  transition={{
                    duration: 0.6,
                    repeat: Infinity,
                    delay: i * 0.2
                  }}
                />
              ))}
            </TypingIndicator>
          </Message>
        )}

        {quickReplies.length > 0 && (
          <QuickReplies>
            {quickReplies.map((reply, index) => (
              <QuickReply
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleSendMessage(reply)}
              >
                {reply}
              </QuickReply>
            ))}
          </QuickReplies>
        )}

        <div ref={messagesEndRef} />
      </MessagesContainer>

      <InputContainer>
        <MessageInput
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask AI about yield strategies..."
          disabled={isTyping}
        />
        <SendButton
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => handleSendMessage()}
          disabled={isTyping || !inputValue.trim()}
        >
          🚀
        </SendButton>
      </InputContainer>
    </ChatContainer>
  );
}

export default AIChat;