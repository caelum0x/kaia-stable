#!/bin/bash

# KAIA YIELD AI - Deployment Script
# Kaia Wave Stablecoin Summer Hackathon

set -e

echo "🚀 KAIA YIELD AI - Deployment Script"
echo "====================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
NETWORK=${1:-"kaia-testnet"}
DEPLOY_CONTRACTS=${2:-"true"}
DEPLOY_BACKEND=${3:-"true"}
DEPLOY_FRONTEND=${4:-"true"}

echo -e "${BLUE}Network: ${NETWORK}${NC}"
echo -e "${BLUE}Deploy Contracts: ${DEPLOY_CONTRACTS}${NC}"
echo -e "${BLUE}Deploy Backend: ${DEPLOY_BACKEND}${NC}"
echo -e "${BLUE}Deploy Frontend: ${DEPLOY_FRONTEND}${NC}"
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${RED}❌ .env file not found!${NC}"
    echo "Please copy .env.example to .env and configure your settings"
    exit 1
fi

# Load environment variables
source .env

# Validate required environment variables
check_env_var() {
    if [ -z "${!1}" ]; then
        echo -e "${RED}❌ Environment variable $1 is not set${NC}"
        exit 1
    fi
}

echo -e "${YELLOW}🔍 Checking environment variables...${NC}"
check_env_var "PRIVATE_KEY"

if [ "$NETWORK" = "kaia-mainnet" ]; then
    check_env_var "KAIA_MAINNET_RPC"
else
    check_env_var "KAIA_TESTNET_RPC"
fi

echo -e "${GREEN}✅ Environment variables validated${NC}"

# Install dependencies
install_dependencies() {
    echo -e "${YELLOW}📦 Installing dependencies...${NC}"
    
    # Backend dependencies
    echo "Installing backend dependencies..."
    cd backend && npm install && cd ..
    
    # Contract dependencies
    echo "Installing contract dependencies..."
    cd contracts && npm install && cd ..
    
    # LINE Mini dApp dependencies
    echo "Installing LINE Mini dApp dependencies..."
    cd line-minidapp && npm install && cd ..
    
    echo -e "${GREEN}✅ Dependencies installed${NC}"
}

# Deploy smart contracts
deploy_contracts() {
    if [ "$DEPLOY_CONTRACTS" != "true" ]; then
        echo -e "${YELLOW}⏭️ Skipping contract deployment${NC}"
        return
    fi

    echo -e "${YELLOW}📜 Deploying smart contracts to ${NETWORK}...${NC}"
    
    cd contracts
    
    # Compile contracts
    echo "Compiling contracts..."
    npx hardhat compile
    
    # Deploy contracts
    echo "Deploying contracts..."
    npx hardhat run scripts/deploy.js --network ${NETWORK}
    
    # Verify contracts (if not localhost)
    if [ "$NETWORK" != "localhost" ] && [ "$NETWORK" != "hardhat" ]; then
        echo "Verifying contracts..."
        # Contract verification will be done manually after deployment
        echo "⚠️ Remember to verify contracts manually on Klaytnscope"
    fi
    
    cd ..
    echo -e "${GREEN}✅ Smart contracts deployed${NC}"
}

# Setup database
setup_database() {
    echo -e "${YELLOW}🗄️ Setting up database...${NC}"
    
    cd backend
    
    # Create database tables
    echo "Creating database tables..."
    node -e "
        const { db } = require('./database/connection');
        setTimeout(() => {
            console.log('Database setup completed');
            process.exit(0);
        }, 5000);
    "
    
    cd ..
    echo -e "${GREEN}✅ Database setup completed${NC}"
}

# Deploy backend
deploy_backend() {
    if [ "$DEPLOY_BACKEND" != "true" ]; then
        echo -e "${YELLOW}⏭️ Skipping backend deployment${NC}"
        return
    fi

    echo -e "${YELLOW}🔧 Deploying backend...${NC}"
    
    # Setup database
    setup_database
    
    cd backend
    
    # Build backend (if needed)
    if [ -f "package.json" ] && grep -q "build" package.json; then
        echo "Building backend..."
        npm run build
    fi
    
    # Start backend in production mode
    if [ "$NODE_ENV" = "production" ]; then
        echo "Starting backend in production mode..."
        npm run start
    else
        echo "Backend ready for development..."
        echo "Run 'npm run dev' to start the development server"
    fi
    
    cd ..
    echo -e "${GREEN}✅ Backend deployed${NC}"
}

# Deploy LINE Mini dApp
deploy_frontend() {
    if [ "$DEPLOY_FRONTEND" != "true" ]; then
        echo -e "${YELLOW}⏭️ Skipping frontend deployment${NC}"
        return
    fi

    echo -e "${YELLOW}🎨 Building LINE Mini dApp...${NC}"
    
    cd line-minidapp
    
    # Build the Mini dApp
    echo "Building Mini dApp..."
    npm run build
    
    # Deploy to GitHub Pages or hosting service
    if [ "$NODE_ENV" = "production" ]; then
        echo "Deploying to production..."
        npm run deploy
        echo -e "${GREEN}✅ Mini dApp deployed to production${NC}"
    else
        echo "Mini dApp built successfully"
        echo "For development: npm start"
        echo "For production deployment: npm run deploy"
    fi
    
    cd ..
}

# Create deployment summary
create_deployment_summary() {
    echo -e "${BLUE}📋 Creating deployment summary...${NC}"
    
    cat > deployment-summary.md << EOF
# KAIA YIELD AI - Deployment Summary

**Deployment Date**: $(date)
**Network**: ${NETWORK}
**Deployer**: $(whoami)

## 📋 Deployment Checklist

### Smart Contracts
- [ ] YieldOptimizer deployed
- [ ] GameRewards deployed  
- [ ] Strategy contracts deployed
- [ ] Contracts verified on Klaytnscope

### Backend Services
- [ ] API server deployed
- [ ] Database configured
- [ ] Redis cache configured
- [ ] Scheduler jobs running

### Frontend
- [ ] LINE Mini dApp built
- [ ] LIFF configuration updated
- [ ] Production deployment complete

### External Integrations
- [ ] LINE Bot configured
- [ ] Dune Analytics dashboard published
- [ ] API integrations tested

## 🔗 Important Links

### Contract Addresses
- YieldOptimizer: \${YIELD_OPTIMIZER_ADDRESS}
- GameRewards: \${GAME_REWARDS_ADDRESS}
- USDT Token: \${USDT_TOKEN_ADDRESS}

### Frontend URLs
- LINE Mini dApp: https://liff.line.me/\${LIFF_ID}
- Dune Dashboard: https://dune.com/kaia-yield-ai/dashboard

### Blockchain Explorer
- Klaytnscope: https://klaytnscope.com/account/\${YIELD_OPTIMIZER_ADDRESS}

## 🚀 Next Steps

1. **Test all functionality** in the deployed environment
2. **Submit to hackathon** with all required deliverables
3. **Prepare demo** for finalist presentation
4. **Monitor performance** and user engagement

## 📞 Support

For issues or questions:
- Email: team@kaia-yield-ai.app
- Discord: KaiaYieldAI#1234
- GitHub: github.com/kaia-yield-ai

---

**Good luck with the Kaia Wave Stablecoin Summer Hackathon! 🏆**
EOF

    echo -e "${GREEN}✅ Deployment summary created: deployment-summary.md${NC}"
}

# Main deployment flow
main() {
    echo -e "${BLUE}Starting deployment process...${NC}"
    
    # Install dependencies
    install_dependencies
    
    # Deploy contracts
    deploy_contracts
    
    # Deploy backend
    deploy_backend
    
    # Deploy frontend
    deploy_frontend
    
    # Create summary
    create_deployment_summary
    
    echo ""
    echo -e "${GREEN}🎉 DEPLOYMENT COMPLETED SUCCESSFULLY!${NC}"
    echo ""
    echo -e "${YELLOW}📋 Next Steps:${NC}"
    echo "1. Test all functionality in deployed environment"
    echo "2. Update Dune Analytics dashboard with contract addresses"
    echo "3. Submit to Kaia Wave Stablecoin Summer Hackathon"
    echo "4. Prepare demo for finalist presentation"
    echo ""
    echo -e "${BLUE}📄 Check deployment-summary.md for detailed information${NC}"
    echo ""
    echo -e "${GREEN}Good luck with the hackathon! 🚀${NC}"
}

# Handle errors
handle_error() {
    echo -e "${RED}❌ Deployment failed at: $1${NC}"
    echo "Check the logs above for details"
    exit 1
}

# Set error handler
trap 'handle_error $LINENO' ERR

# Run main deployment
main

echo "Deployment script completed!"