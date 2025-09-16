# KAIA YIELD AI - Production Deployment Guide

## Prerequisites

### 1. System Requirements
- Node.js 18+
- PostgreSQL 14+
- Redis 6+
- Python 3.9+ (for AI engine)
- Git

### 2. Kaia Network Setup
- Kaia wallet with KLAY for gas fees
- Access to Kaia mainnet RPC endpoints
- USDT tokens for testing strategies

### 3. LINE Platform Setup
- LINE Developer account
- LINE Bot channel configured
- LIFF (LINE Front-end Framework) app created

## Step 1: Environment Configuration

### Backend (.env)
```bash
# Copy example file
cp backend/.env.example backend/.env

# Configure required variables:
PORT=3001
NODE_ENV=production
DATABASE_URL=postgresql://username:password@host:5432/kaia_yield_ai
REDIS_URL=redis://host:6379

# Kaia Network
KAIA_RPC_URL=https://public-en-cypress.klaytn.net
YIELD_OPTIMIZER_ADDRESS=<deployed_contract_address>
GAME_REWARDS_ADDRESS=<deployed_contract_address>
USDT_TOKEN_ADDRESS=0x0339d5Eb6D195Ba90B13ed1BCeAa97EBD839Cf7

# LINE Integration
LINE_CHANNEL_ACCESS_TOKEN=<your_line_token>
LINE_CHANNEL_SECRET=<your_line_secret>
LINE_LIFF_ID=<your_liff_id>

# Security
JWT_SECRET=<32_character_random_string>
ENCRYPTION_KEY=<32_character_random_string>

# External APIs
COINGECKO_API_KEY=<optional_for_higher_limits>
```

### Frontend (.env.local)
```bash
# Copy example file
cp frontend/.env.local.example frontend/.env.local

# Configure:
NEXT_PUBLIC_API_URL=https://your-api-domain.com/api
NEXT_PUBLIC_CHAIN_ID=8217
NEXT_PUBLIC_RPC_URL=https://public-en-cypress.klaytn.net
NEXT_PUBLIC_LIFF_ID=<your_liff_id>

# Contract addresses (after deployment)
NEXT_PUBLIC_YIELD_OPTIMIZER_ADDRESS=<contract_address>
NEXT_PUBLIC_GAME_REWARDS_ADDRESS=<contract_address>
NEXT_PUBLIC_USDT_TOKEN_ADDRESS=0x0339d5Eb6D195Ba90B13ed1BCeAa97EBD839Cf7
```

### Contracts (.env)
```bash
# Copy example file
cp contracts/.env.example contracts/.env

# Configure:
PRIVATE_KEY=<your_wallet_private_key_without_0x>
KAIA_MAINNET_RPC=https://public-en-cypress.klaytn.net
USDT_MAINNET_ADDRESS=0x0339d5Eb6D195Ba90B13ed1BCeAa97EBD839Cf7
```

## Step 2: Database Setup

### PostgreSQL Setup
```bash
# Install PostgreSQL (Ubuntu/Debian)
sudo apt update
sudo apt install postgresql postgresql-contrib

# Create database and user
sudo -u postgres psql
CREATE DATABASE kaia_yield_ai;
CREATE USER kaia_user WITH ENCRYPTED PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE kaia_yield_ai TO kaia_user;
\q

# Run database schema
cd backend
psql -U kaia_user -d kaia_yield_ai -f database/schema.sql
```

### Redis Setup
```bash
# Install Redis (Ubuntu/Debian)
sudo apt install redis-server

# Configure Redis
sudo systemctl enable redis-server
sudo systemctl start redis-server
```

## Step 3: Smart Contract Deployment

```bash
cd contracts

# Install dependencies
npm install

# Compile contracts
npx hardhat compile

# Deploy to Kaia Mainnet
npm run deploy:mainnet

# Verify contracts (optional)
npx hardhat verify --network kaia-mainnet <contract_address> <constructor_args>
```

**Save the deployed contract addresses and update your environment files!**

## Step 4: Backend Deployment

```bash
cd backend

# Install dependencies
npm install

# Install Python dependencies for AI engine
pip install -r ai/requirements.txt

# Test database connection
npm run test

# Start production server
npm start

# Or use PM2 for process management
npm install -g pm2
pm2 start ecosystem.config.js
```

### PM2 Configuration (ecosystem.config.js)
```javascript
module.exports = {
  apps: [{
    name: 'kaia-yield-ai-backend',
    script: 'server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
```

## Step 5: Frontend Deployment

```bash
cd frontend

# Install dependencies
npm install

# Build for production
npm run build

# Test production build locally
npm start

# Deploy to hosting platform (Vercel, Netlify, etc.)
```

### Vercel Deployment
```bash
npm install -g vercel
vercel --prod
```

### Nginx Configuration (if self-hosting)
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Step 6: LINE Integration Setup

### 1. LINE Developer Console Configuration
1. Create a new Messaging API channel
2. Configure webhook URL: `https://your-domain.com/api/line/webhook`
3. Enable webhook and auto-reply messages
4. Get Channel Access Token and Channel Secret

### 2. LIFF App Configuration
1. Create new LIFF app in LINE Developer Console
2. Set endpoint URL: `https://your-frontend-domain.com`
3. Configure scope: `profile openid`
4. Get LIFF ID

### 3. Test LINE Integration
```bash
# Test webhook
curl -X POST https://your-domain.com/api/line/webhook \
  -H "Content-Type: application/json" \
  -d '{"events":[{"type":"message","message":{"type":"text","text":"test"}}]}'
```

## Step 7: AI Engine Setup

```bash
cd backend/ai

# Install Python dependencies
pip install -r requirements.txt

# Train initial model
python recommendation_engine.py train

# Test AI recommendations
python recommendation_engine.py
```

### AI Model Requirements (requirements.txt)
```
numpy>=1.21.0
pandas>=1.3.0
scikit-learn>=1.0.0
joblib>=1.1.0
```

## Step 8: Monitoring and Logging

### Set up Log Rotation
```bash
# Install logrotate
sudo apt install logrotate

# Configure log rotation
sudo tee /etc/logrotate.d/kaia-yield-ai << EOF
/path/to/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 app app
    postrotate
        pm2 reload kaia-yield-ai-backend
    endscript
}
EOF
```

### Health Check Monitoring
```bash
# Set up health check cron job
crontab -e

# Add this line to check every 5 minutes:
*/5 * * * * curl -f http://localhost:3001/health || echo "Service is down" | mail -s "KAIA YIELD AI Alert" admin@yourdomain.com
```

## Step 9: Security Checklist

- [ ] SSL/TLS certificates configured
- [ ] Database connections encrypted
- [ ] Environment variables secured
- [ ] Rate limiting enabled
- [ ] CORS properly configured
- [ ] Input validation implemented
- [ ] Security headers set
- [ ] Private keys stored securely
- [ ] Backup strategy implemented
- [ ] Monitoring alerts configured

## Step 10: Testing Production Deployment

### API Testing
```bash
# Test health endpoint
curl https://your-domain.com/api/health

# Test strategies endpoint
curl https://your-domain.com/api/strategies

# Test authentication
curl -X POST https://your-domain.com/api/line/profile/verify \
  -H "Content-Type: application/json" \
  -d '{"userId":"test","displayName":"Test User"}'
```

### Frontend Testing
1. Open LIFF app in LINE browser
2. Test wallet connection
3. Test strategy recommendations
4. Test portfolio view
5. Test social sharing

### Smart Contract Testing
```bash
# Test contract interaction
npx hardhat run scripts/test-deployment.js --network kaia-mainnet
```

## Maintenance

### Daily Tasks
- Check application logs
- Monitor resource usage
- Verify database backups
- Check security alerts

### Weekly Tasks
- Update APY data manually if needed
- Review analytics data
- Check for dependency updates
- Performance optimization

### Monthly Tasks
- Security audit
- Database optimization
- Cost analysis
- Feature planning

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check PostgreSQL service status
   - Verify connection string
   - Check firewall settings

2. **Contract Interaction Failed**
   - Verify contract addresses
   - Check gas prices
   - Ensure wallet has KLAY balance

3. **LINE Integration Issues**
   - Verify webhook URL accessibility
   - Check LINE Developer Console settings
   - Validate SSL certificates

4. **High Memory Usage**
   - Check for memory leaks
   - Optimize database queries
   - Consider horizontal scaling

### Support Contacts
- Technical Issues: tech@yourdomain.com
- LINE Integration: line-support@yourdomain.com
- Smart Contracts: contracts@yourdomain.com

---

**🚀 Your KAIA YIELD AI platform is now ready for production!**