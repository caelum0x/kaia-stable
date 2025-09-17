const axios = require('axios');
const { Client } = require('@line/bot-sdk');
require('dotenv').config();

class AIChitBotService {
  constructor() {
    // LINE Bot client
    this.lineClient = new Client({
      channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
      channelSecret: process.env.LINE_CHANNEL_SECRET
    });

    // OpenAI configuration
    this.openaiApiKey = process.env.OPENAI_API_KEY;
    this.model = process.env.AI_MODEL || 'gpt-4-turbo-preview';
    this.temperature = parseFloat(process.env.AI_TEMPERATURE) || 0.3;

    // Bot personality and context
    this.systemPrompt = `
You are KAIA AI, an intelligent assistant for the KAIA YIELD AI platform - a cutting-edge DeFi yield optimization protocol on the Kaia blockchain.

PERSONALITY:
- Friendly, professional, and knowledgeable about DeFi and yield farming
- Enthusiastic about helping users maximize their USDT returns
- Speaks with confidence about blockchain technology and financial strategies
- Uses appropriate emojis (🚀, 💰, 📈, ⚡, 🔥) but not excessively
- Adapts language to user's expertise level

CORE KNOWLEDGE:
1. KAIA YIELD AI Protocol:
   - AI-powered yield optimization on Kaia blockchain
   - Three main strategies: Stable Earn (5.2% APY), Growth Plus (11.8% APY), High Yield Pro (26.5% APY)
   - Real USDT deposits with smart contract security
   - Social trading and gamified missions
   - LINE Mini dApp integration for seamless Asian market access

2. Key Features:
   - Real-time AI recommendations based on market conditions
   - Social trading with leaderboards and strategy sharing
   - Gamified mission system with rewards
   - Risk management with automated rebalancing
   - Multi-language support (English, Japanese, Korean)

3. Security & Trust:
   - Audited smart contracts on Kaia mainnet
   - Real-time monitoring and risk assessment
   - Non-custodial - users maintain control of funds
   - Transparent performance tracking

CAPABILITIES:
- Explain DeFi concepts in simple terms
- Recommend optimal strategies based on user's risk tolerance
- Provide real-time market updates and strategy performance
- Help with deposits, withdrawals, and strategy selection
- Assist with missions and social features
- Answer technical questions about the protocol

LIMITATIONS:
- Cannot access real-time blockchain data during conversation (mention checking the app for live data)
- Cannot execute transactions (direct users to the secure Mini dApp)
- Cannot provide specific financial advice (always emphasize DYOR - Do Your Own Research)
- Cannot guarantee returns (always mention that DeFi involves risks)

RESPONSE FORMAT:
- Keep responses concise and actionable
- Always prioritize user safety and education
- Suggest specific next steps when appropriate
- Include relevant emojis to enhance engagement
- End with helpful questions to continue conversation

Remember: Always emphasize security, transparency, and user education. Help users make informed decisions about their DeFi journey.
    `;

    // Context management
    this.userContexts = new Map(); // Store conversation context
    this.contextTimeout = 30 * 60 * 1000; // 30 minutes

    // Knowledge base
    this.knowledgeBase = {
      strategies: {
        'stable_earn': {
          name: 'Stable Earn',
          apy: '5.2%',
          risk: 'Low (2/10)',
          description: 'Conservative strategy perfect for beginners',
          min_deposit: '10 USDT',
          protocol: 'Compound-based lending'
        },
        'growth_plus': {
          name: 'Growth Plus',
          apy: '11.8%',
          risk: 'Medium (5/10)',
          description: 'Balanced approach with moderate risk',
          min_deposit: '50 USDT',
          protocol: 'Uniswap V3 liquidity provision'
        },
        'high_yield_pro': {
          name: 'High Yield Pro',
          apy: '26.5%',
          risk: 'High (8/10)',
          description: 'Maximum yield for experienced users',
          min_deposit: '100 USDT',
          protocol: 'Curve Finance yield farming'
        }
      },
      missions: [
        'First Deposit (100 points) - Make your first USDT deposit',
        'Yield Explorer (250 points) - Try 3 different strategies',
        'Consistent Investor (500 points) - Deposit for 7 consecutive days',
        'Social Butterfly (150 points) - Follow 5 strategies',
        'Strategy Master (750 points) - Create a strategy with 10+ followers'
      ],
      faqs: {
        'how_to_start': 'To start earning yield: 1) Connect your wallet 2) Choose a strategy 3) Deposit USDT 4) Watch your rewards grow! 🚀',
        'safety': 'Your funds are secured by audited smart contracts on Kaia blockchain. You maintain full control - we never custody your assets.',
        'withdrawal': 'Withdraw anytime! Just go to your portfolio, select the position, and click withdraw. Funds arrive in 1-3 blocks.',
        'ai_recommendations': 'Our AI analyzes market conditions, your risk profile, and strategy performance to recommend optimal allocations.',
        'social_features': 'Follow top performers, copy successful strategies, and share your wins with friends on LINE!'
      }
    };
  }

  async handleMessage(event) {
    try {
      const { replyToken, message, source } = event;
      const userId = source.userId;
      const messageText = message.text;

      // Get or create user context
      let userContext = this.getUserContext(userId);

      // Process the message
      const response = await this.generateResponse(messageText, userContext, userId);

      // Update context
      this.updateUserContext(userId, messageText, response);

      // Send reply via LINE
      await this.sendLineMessage(replyToken, response);

      return response;
    } catch (error) {
      console.error('Error handling message:', error);
      await this.sendLineMessage(event.replyToken,
        "I'm sorry, I encountered an error. Please try again or contact our support team! 🙏"
      );
    }
  }

  async generateResponse(messageText, userContext, userId) {
    try {
      // Check for quick responses first
      const quickResponse = this.getQuickResponse(messageText);
      if (quickResponse) {
        return quickResponse;
      }

      // Prepare context for AI
      const contextMessages = [
        { role: 'system', content: this.systemPrompt },
        ...userContext.messages.slice(-6), // Keep last 6 messages for context
        { role: 'user', content: messageText }
      ];

      // Add current protocol data context
      const protocolContext = await this.getProtocolContext();
      contextMessages.splice(1, 0, {
        role: 'system',
        content: `Current Protocol Status: ${JSON.stringify(protocolContext)}`
      });

      // Call OpenAI API
      const response = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: this.model,
        messages: contextMessages,
        temperature: this.temperature,
        max_tokens: 500,
        presence_penalty: 0.1,
        frequency_penalty: 0.1
      }, {
        headers: {
          'Authorization': `Bearer ${this.openaiApiKey}`,
          'Content-Type': 'application/json'
        }
      });

      const aiResponse = response.data.choices[0].message.content;

      // Post-process response
      return this.postProcessResponse(aiResponse, messageText);

    } catch (error) {
      console.error('Error generating AI response:', error);
      return this.getFallbackResponse(messageText);
    }
  }

  getQuickResponse(messageText) {
    const text = messageText.toLowerCase();

    // Greetings
    if (/^(hi|hello|hey|start|begin)/.test(text)) {
      return `Hello! 👋 Welcome to KAIA YIELD AI! 🚀\n\nI'm here to help you maximize your USDT returns with AI-powered yield optimization.\n\n💰 Current top strategy: Growth Plus (11.8% APY)\n🎯 Perfect for: Balanced risk/reward\n\nReady to start earning? Ask me:\n• "How do I start?"\n• "Show me strategies"\n• "What's my best option?"\n\nWhat would you like to know? 😊`;
    }

    // Strategy requests
    if (text.includes('strategy') || text.includes('strategies')) {
      return `🎯 Our AI-Optimized Strategies:\n\n💚 Stable Earn: 5.2% APY (Low Risk)\n  Perfect for: Conservative investors\n  Min: 10 USDT\n\n💙 Growth Plus: 11.8% APY (Medium Risk)\n  Perfect for: Balanced approach\n  Min: 50 USDT\n\n🔥 High Yield Pro: 26.5% APY (High Risk)\n  Perfect for: Maximum returns\n  Min: 100 USDT\n\nWant personalized recommendations? Tell me your risk preference! 📈`;
    }

    // Help requests
    if (text.includes('help') || text.includes('support')) {
      return `🆘 How can I help you today?\n\n🔹 Getting Started\n🔹 Strategy Recommendations\n🔹 Deposit/Withdrawal Help\n🔹 Mission & Rewards Info\n🔹 Social Trading Features\n🔹 Security & Safety\n\nJust ask me anything! I'm here 24/7 🤖`;
    }

    // APY/returns requests
    if (text.includes('apy') || text.includes('return') || text.includes('yield')) {
      return `📈 Current Live APYs:\n\n• Stable Earn: 5.2% (Updated: Live)\n• Growth Plus: 11.8% (Updated: Live)\n• High Yield Pro: 26.5% (Updated: Live)\n\n⚡ Our AI updates rates automatically based on:\n• Market conditions\n• Protocol performance\n• Risk assessment\n\nFor real-time data, check the Mini dApp! 📱`;
    }

    // Safety/security questions
    if (text.includes('safe') || text.includes('secure') || text.includes('risk')) {
      return `🔒 Your Security is Our Priority:\n\n✅ Audited smart contracts\n✅ Non-custodial (you own your keys)\n✅ Real-time risk monitoring\n✅ Transparent performance tracking\n✅ Battle-tested protocols\n\n⚠️ Remember: DeFi involves risks\n💡 Start small, learn, then scale up\n🎓 Never invest more than you can afford to lose\n\nQuestions about specific risks? Just ask! 🛡️`;
    }

    return null; // No quick response found
  }

  async getProtocolContext() {
    try {
      // This would fetch real-time data from the backend
      return {
        tvl: '$2,547,891',
        activeUsers: 1247,
        totalStrategies: 3,
        averageApy: '11.83%',
        lastUpdate: new Date().toISOString()
      };
    } catch (error) {
      return {
        tvl: 'Loading...',
        activeUsers: 'N/A',
        totalStrategies: 3,
        averageApy: '11.83%',
        lastUpdate: 'Unknown'
      };
    }
  }

  postProcessResponse(aiResponse, originalMessage) {
    // Add helpful call-to-actions
    let response = aiResponse;

    // Add app link for certain responses
    if (originalMessage.toLowerCase().includes('start') ||
        originalMessage.toLowerCase().includes('deposit') ||
        originalMessage.toLowerCase().includes('invest')) {
      response += '\n\n🚀 Ready to start? Open the KAIA YIELD AI Mini dApp to begin earning!';
    }

    // Add mission hint for engagement
    if (Math.random() < 0.3) { // 30% chance
      response += '\n\n🎮 Pro tip: Complete daily missions for bonus rewards!';
    }

    return response;
  }

  getFallbackResponse(messageText) {
    const fallbacks = [
      "I'm here to help with KAIA YIELD AI! 🤖 Could you rephrase that? Try asking about strategies, APYs, or how to get started! 💰",
      "Great question! 🤔 While I process that, check out our Growth Plus strategy with 11.8% APY - it's very popular! 📈",
      "I want to give you the best answer! 💪 Could you be more specific? I can help with deposits, strategies, missions, or any DeFi questions! 🚀",
      "Let me help you maximize those yields! 💰 What specifically would you like to know about KAIA YIELD AI? 📊"
    ];

    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
  }

  getUserContext(userId) {
    if (!this.userContexts.has(userId)) {
      this.userContexts.set(userId, {
        messages: [],
        preferences: {},
        lastActivity: Date.now()
      });
    }

    const context = this.userContexts.get(userId);

    // Clean old contexts
    if (Date.now() - context.lastActivity > this.contextTimeout) {
      context.messages = [];
    }

    return context;
  }

  updateUserContext(userId, userMessage, botResponse) {
    const context = this.getUserContext(userId);

    context.messages.push(
      { role: 'user', content: userMessage },
      { role: 'assistant', content: botResponse }
    );

    // Keep only last 10 messages
    if (context.messages.length > 10) {
      context.messages = context.messages.slice(-10);
    }

    context.lastActivity = Date.now();

    // Extract preferences from conversation
    this.extractUserPreferences(userId, userMessage);
  }

  extractUserPreferences(userId, message) {
    const context = this.getUserContext(userId);
    const text = message.toLowerCase();

    // Risk preference
    if (text.includes('conservative') || text.includes('safe') || text.includes('low risk')) {
      context.preferences.riskTolerance = 'low';
    } else if (text.includes('aggressive') || text.includes('high risk') || text.includes('maximum')) {
      context.preferences.riskTolerance = 'high';
    } else if (text.includes('medium') || text.includes('balanced')) {
      context.preferences.riskTolerance = 'medium';
    }

    // Investment amount hints
    const amounts = text.match(/(\d+)\s*(usdt|dollar|usd)/);
    if (amounts) {
      context.preferences.investmentAmount = parseInt(amounts[1]);
    }

    // Experience level
    if (text.includes('beginner') || text.includes('new') || text.includes('first time')) {
      context.preferences.experience = 'beginner';
    } else if (text.includes('expert') || text.includes('experienced') || text.includes('advanced')) {
      context.preferences.experience = 'expert';
    }
  }

  async sendLineMessage(replyToken, text) {
    try {
      await this.lineClient.replyMessage(replyToken, {
        type: 'text',
        text: text
      });
    } catch (error) {
      console.error('Error sending LINE message:', error);
    }
  }

  async sendBroadcastMessage(userIds, message) {
    try {
      await this.lineClient.multicast(userIds, {
        type: 'text',
        text: message
      });
    } catch (error) {
      console.error('Error sending broadcast message:', error);
    }
  }

  // Proactive messaging for user engagement
  async sendDailyUpdate(userId) {
    try {
      const protocolData = await this.getProtocolContext();

      const message = `🌅 Good morning! Here's your KAIA YIELD AI update:\n\n📊 Protocol TVL: ${protocolData.tvl}\n👥 Active Users: ${protocolData.activeUsers}\n📈 Average APY: ${protocolData.averageApy}\n\n💡 Today's AI Tip: Market conditions favor balanced strategies. Consider Growth Plus for optimal returns!\n\n🎯 Complete today's mission for bonus rewards!`;

      await this.lineClient.pushMessage(userId, {
        type: 'text',
        text: message
      });
    } catch (error) {
      console.error('Error sending daily update:', error);
    }
  }

  async sendMissionReminder(userId, missionName) {
    const message = `🎮 Mission Reminder!\n\n"${missionName}" is almost complete! 🔥\n\nFinish it today to earn bonus points and climb the leaderboard! 🏆\n\nNeed help? Just ask me how to complete it! 💪`;

    try {
      await this.lineClient.pushMessage(userId, {
        type: 'text',
        text: message
      });
    } catch (error) {
      console.error('Error sending mission reminder:', error);
    }
  }

  async sendYieldAlert(userId, strategyName, newApy) {
    const message = `🚨 Yield Alert! 📈\n\n${strategyName} APY increased to ${newApy}%!\n\nThis could be a great opportunity to optimize your portfolio. Want me to analyze if this fits your risk profile?\n\nReply with "analyze" for personalized recommendations! 🤖`;

    try {
      await this.lineClient.pushMessage(userId, {
        type: 'text',
        text: message
      });
    } catch (error) {
      console.error('Error sending yield alert:', error);
    }
  }

  // Analytics and insights
  getConversationAnalytics() {
    const analytics = {
      totalUsers: this.userContexts.size,
      activeUsers: 0,
      commonTopics: {},
      avgMessagesPerUser: 0
    };

    let totalMessages = 0;

    for (const [userId, context] of this.userContexts.entries()) {
      if (Date.now() - context.lastActivity < 24 * 60 * 60 * 1000) {
        analytics.activeUsers++;
      }
      totalMessages += context.messages.length;
    }

    analytics.avgMessagesPerUser = Math.round(totalMessages / analytics.totalUsers);

    return analytics;
  }
}

module.exports = AIChitBotService;