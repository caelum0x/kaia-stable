# KAIA YIELD AI - Deployment Guide

## Overview

This guide covers the complete deployment process for KAIA YIELD AI, including smart contracts, backend services, frontend application, and analytics dashboard.

## Prerequisites

- Node.js 18+ and npm/yarn
- Python 3.8+ with pip
- Kaia wallet with testnet KAIA for gas fees
- LINE Developer Account
- Dune Analytics Account
- Git

## 1. Smart Contract Deployment

### Setup Environment

```bash
cd contracts
npm install
cp .env.example .env
```

### Configure Environment Variables

Edit `.env` file:

```env
PRIVATE_KEY=your_private_key_without_0x_prefix
KAIA_TESTNET_RPC=https://api.baobab.klaytn.net:8651
KAIA_MAINNET_RPC=https://api.cypress.klaytn.net:8651
```

### Deploy to Kaia Testnet

```bash
# Compile contracts
npm run compile

# Deploy to testnet
npm run deploy:testnet

# Verify contracts (optional)
npm run verify
```

### Save Contract Addresses

After deployment, save the contract addresses from the console output:
- YieldOptimizer: `0x...`
- GameRewards: `0x...`

## 2. Backend API Deployment

### Setup Environment

```bash
cd ../backend
npm install
```

### Configure Environment

Create `.env` file:

```env
PORT=3000
NODE_ENV=production

# Blockchain
KAIA_RPC_URL=https://api.baobab.klaytn.net:8651
YIELD_OPTIMIZER_ADDRESS=0x... # From contract deployment
GAME_REWARDS_ADDRESS=0x...   # From contract deployment

# LINE Bot
LINE_CHANNEL_ACCESS_TOKEN=your_line_channel_access_token
LINE_CHANNEL_SECRET=your_line_channel_secret

# API Security
ALLOWED_ORIGINS=https://your-frontend-domain.com
JWT_SECRET=your_jwt_secret_key

# Redis (for caching)
REDIS_URL=redis://localhost:6379

# Analytics
DUNE_API_KEY=your_dune_api_key
```

### Install Python Dependencies

```bash
pip install -r ai/requirements.txt
```

Create `ai/requirements.txt`:

```txt
numpy==1.24.3
pandas==2.0.3
scikit-learn==1.3.0
joblib==1.3.1
```

### Train AI Model

```bash
npm run ai-engine train
```

### Deploy Backend

#### Option A: Local Development

```bash
npm run dev
```

#### Option B: Production (PM2)

```bash
npm install -g pm2
pm2 start ecosystem.config.js
```

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'kaia-yield-ai-backend',
    script: 'server.js',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
```

#### Option C: Docker

```bash
docker build -t kaia-yield-ai-backend .
docker run -p 3000:3000 --env-file .env kaia-yield-ai-backend
```

## 3. Frontend Deployment

### Setup Environment

```bash
cd ../frontend
npm install
```

### Configure Environment

Create `.env.local`:

```env
NEXT_PUBLIC_LIFF_ID=your_line_liff_id
NEXT_PUBLIC_API_URL=https://your-backend-api.com
NEXT_PUBLIC_KAIA_RPC_URL=https://api.baobab.klaytn.net:8651
NEXT_PUBLIC_YIELD_OPTIMIZER_ADDRESS=0x...
NEXT_PUBLIC_GAME_REWARDS_ADDRESS=0x...
```

### Build and Deploy

#### Option A: Vercel (Recommended)

1. Push code to GitHub
2. Connect repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically

#### Option B: Netlify

```bash
npm run build
npm run export
# Upload dist folder to Netlify
```

#### Option C: Static Hosting

```bash
npm run build
npm run export
# Upload out/ folder to your hosting provider
```

### Configure LINE LIFF

1. Go to LINE Developers Console
2. Create new LIFF app
3. Set endpoint URL to your deployed frontend
4. Configure permissions:
   - Profile access
   - Chat message send
5. Copy LIFF ID to environment variables

## 4. Dune Analytics Dashboard

### Create Dashboard

1. Go to [Dune Analytics](https://dune.com)
2. Create new dashboard: "KAIA YIELD AI Protocol Analytics"
3. Add visualizations using queries from `docs/dune-dashboard.sql`

### Setup Queries

Replace placeholder addresses in SQL queries:

```sql
-- Replace these with your actual contract addresses
{{YieldOptimizer_Address}} -> 0x... (your deployed address)
{{GameRewards_Address}} -> 0x...    (your deployed address)
```

### Create Visualizations

1. **TVL Trend**: Line chart showing TVL over time
2. **Strategy Performance**: Bar chart of strategy metrics  
3. **User Growth**: Line chart of daily active users
4. **Risk Distribution**: Pie chart of risk levels
5. **Leaderboard**: Table of top performers
6. **Protocol Overview**: Metric cards with key stats

### Make Dashboard Public

1. Set dashboard visibility to "Public"
2. Add description and tags
3. Share dashboard URL: `https://dune.com/your-username/kaia-yield-ai`

## 5. LINE Bot Integration

### Create LINE Bot

1. Go to LINE Developers Console
2. Create Messaging API channel
3. Configure webhook URL: `https://your-backend-api.com/api/line/webhook`
4. Enable webhook
5. Copy channel access token and secret

### Configure Permissions

Enable these features:
- Send messages
- Rich menu
- Push messages
- Multicast messages

### Setup Rich Menu

```bash
curl -X POST https://api.line.me/v2/bot/richmenu \
-H "Authorization: Bearer YOUR_CHANNEL_ACCESS_TOKEN" \
-H "Content-Type: application/json" \
-d '{
  "size": {"width": 2500, "height": 1686},
  "selected": false,
  "name": "KAIA YIELD AI Menu",
  "chatBarText": "Menu",
  "areas": [
    {
      "bounds": {"x": 0, "y": 0, "width": 833, "height": 843},
      "action": {"type": "uri", "uri": "https://your-frontend.com/"}
    },
    {
      "bounds": {"x": 833, "y": 0, "width": 834, "height": 843},
      "action": {"type": "uri", "uri": "https://your-frontend.com/strategies"}
    },
    {
      "bounds": {"x": 1667, "y": 0, "width": 833, "height": 843},
      "action": {"type": "uri", "uri": "https://your-frontend.com/missions"}
    }
  ]
}'
```

## 6. Testing Deployment

### Smart Contracts

```bash
cd contracts
npm test
```

### Backend API

```bash
cd backend
npm test

# Test endpoints
curl https://your-backend-api.com/health
curl https://your-backend-api.com/api/strategies
```

### Frontend

```bash
cd frontend
npm run lint
npm run type-check
```

### End-to-End Testing

1. Open LINE app
2. Add your bot as friend
3. Open LIFF app
4. Test wallet connection
5. Test depositing to strategies
6. Test mission completion
7. Verify data appears in Dune dashboard

## 7. Monitoring and Maintenance

### Backend Monitoring

```bash
# Check PM2 status
pm2 status
pm2 logs

# Monitor API health
curl https://your-backend-api.com/health
```

### Smart Contract Monitoring

Use tools like:
- Kaiascope for transaction monitoring
- Set up alerts for contract events
- Monitor gas usage and costs

### Analytics Monitoring

- Check Dune dashboard daily
- Monitor user growth and TVL
- Track error rates and performance

## 8. Security Checklist

- [ ] Private keys stored securely (never commit to git)
- [ ] Environment variables configured properly
- [ ] API rate limiting enabled
- [ ] CORS configured correctly
- [ ] Smart contracts audited (for mainnet)
- [ ] SSL certificates configured
- [ ] Database backups enabled
- [ ] Error logging configured
- [ ] Access controls implemented

## 9. Hackathon Submission

### Required Deliverables

1. **GitHub Repository**: https://github.com/your-username/kaia-yield-ai
2. **Live Demo**: https://your-frontend.com
3. **Dune Dashboard**: https://dune.com/your-username/kaia-yield-ai
4. **Smart Contracts**: Verified on Kaiascope
5. **Pitch Deck**: Create using provided template

### Demo Script

1. Show homepage with protocol metrics
2. Connect wallet and view AI recommendations
3. Deposit USDT into recommended strategy
4. Complete a mission to earn rewards
5. Show portfolio performance
6. Display Dune analytics dashboard
7. Demonstrate LINE integration

## Troubleshooting

### Common Issues

1. **LIFF not loading**: Check LIFF ID and domain configuration
2. **Wallet connection fails**: Verify network configuration
3. **Contract calls fail**: Check contract addresses and ABIs
4. **API errors**: Check backend logs and environment variables
5. **Dune queries fail**: Verify contract addresses in SQL

### Support

- Kaia Documentation: https://docs.kaia.io
- LINE Developers: https://developers.line.biz
- Dune Documentation: https://docs.dune.com

## Next Steps

After successful deployment:

1. Apply for mainnet deployment
2. Implement additional yield strategies
3. Add more gamification features
4. Scale infrastructure for more users
5. Apply for Kaia Wave accelerator program

---

*Generated for Kaia Wave Stablecoin Summer Hackathon 2025*