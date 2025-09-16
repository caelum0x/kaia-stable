-- KAIA YIELD AI Database Schema
-- PostgreSQL Production Schema

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table for LINE integration
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    line_user_id VARCHAR(255) UNIQUE NOT NULL,
    wallet_address VARCHAR(42),
    display_name VARCHAR(255) NOT NULL,
    picture_url TEXT,
    status_message TEXT,
    risk_tolerance INTEGER DEFAULT 5 CHECK (risk_tolerance >= 1 AND risk_tolerance <= 10),
    experience_level VARCHAR(50) DEFAULT 'Beginner',
    social_bonus_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- Strategies table for real DeFi protocols
CREATE TABLE strategies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    contract_address VARCHAR(42),
    protocol_name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL,
    base_apy INTEGER NOT NULL, -- basis points
    current_apy INTEGER NOT NULL, -- basis points
    risk_level INTEGER NOT NULL CHECK (risk_level >= 1 AND risk_level <= 10),
    min_deposit DECIMAL(18,6) NOT NULL,
    max_deposit DECIMAL(18,6) NOT NULL,
    total_deposited DECIMAL(18,6) DEFAULT 0,
    total_users INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT true,
    last_apy_update TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User deposits tracking
CREATE TABLE user_deposits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    strategy_id INTEGER REFERENCES strategies(id),
    wallet_address VARCHAR(42) NOT NULL,
    amount DECIMAL(18,6) NOT NULL,
    shares DECIMAL(18,18) NOT NULL,
    deposit_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_reward_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    accumulated_rewards DECIMAL(18,6) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'active',
    tx_hash VARCHAR(66),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User missions and gamification
CREATE TABLE missions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    mission_type VARCHAR(50) NOT NULL,
    reward_points INTEGER NOT NULL,
    reward_tokens DECIMAL(18,6) DEFAULT 0,
    difficulty INTEGER NOT NULL CHECK (difficulty >= 1 AND difficulty <= 10),
    duration_seconds INTEGER NOT NULL,
    requirements JSONB,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User mission progress
CREATE TABLE user_missions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    mission_id INTEGER REFERENCES missions(id),
    progress INTEGER DEFAULT 0,
    target INTEGER NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_time TIMESTAMP WITH TIME ZONE,
    completed BOOLEAN DEFAULT false,
    claimed BOOLEAN DEFAULT false,
    rewards_claimed DECIMAL(18,6) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User stats and leaderboard
CREATE TABLE user_stats (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    total_points INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    experience_points INTEGER DEFAULT 0,
    streak_days INTEGER DEFAULT 0,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    total_deposited DECIMAL(18,6) DEFAULT 0,
    total_rewards DECIMAL(18,6) DEFAULT 0,
    successful_trades INTEGER DEFAULT 0,
    referrals_count INTEGER DEFAULT 0,
    social_sharing_count INTEGER DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI recommendations tracking
CREATE TABLE ai_recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    strategy_id INTEGER REFERENCES strategies(id),
    score DECIMAL(5,2) NOT NULL,
    confidence VARCHAR(20) NOT NULL,
    explanation TEXT,
    expected_return DECIMAL(18,6),
    risk_assessment JSONB,
    market_conditions JSONB,
    model_version VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours'),
    accepted BOOLEAN DEFAULT false,
    accepted_at TIMESTAMP WITH TIME ZONE
);

-- Protocol metrics and analytics
CREATE TABLE protocol_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,
    total_value_locked DECIMAL(18,6) NOT NULL,
    total_users INTEGER NOT NULL,
    total_strategies INTEGER NOT NULL,
    total_transactions INTEGER NOT NULL,
    average_apy INTEGER NOT NULL,
    volume_24h DECIMAL(18,6) NOT NULL,
    fees_collected DECIMAL(18,6) DEFAULT 0,
    metrics_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Strategy performance tracking
CREATE TABLE strategy_performance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    strategy_id INTEGER REFERENCES strategies(id),
    date DATE NOT NULL,
    apy INTEGER NOT NULL,
    tvl DECIMAL(18,6) NOT NULL,
    users_count INTEGER NOT NULL,
    deposits_count INTEGER NOT NULL,
    withdrawals_count INTEGER NOT NULL,
    volume DECIMAL(18,6) NOT NULL,
    performance_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(strategy_id, date)
);

-- Social features - strategy sharing
CREATE TABLE strategy_shares (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sharer_id UUID REFERENCES users(id) ON DELETE CASCADE,
    strategy_id INTEGER REFERENCES strategies(id),
    share_type VARCHAR(50) NOT NULL, -- 'line_friend', 'timeline', 'group'
    share_count INTEGER DEFAULT 1,
    message TEXT,
    recipients INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transaction history
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    strategy_id INTEGER REFERENCES strategies(id),
    transaction_type VARCHAR(50) NOT NULL, -- 'deposit', 'withdraw', 'reward_claim'
    amount DECIMAL(18,6) NOT NULL,
    tx_hash VARCHAR(66) UNIQUE,
    block_number BIGINT,
    gas_used BIGINT,
    gas_price DECIMAL(18,0),
    status VARCHAR(20) DEFAULT 'pending',
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    confirmed_at TIMESTAMP WITH TIME ZONE
);

-- Notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    notification_type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    read_at TIMESTAMP WITH TIME ZONE,
    sent_via_line BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_users_line_user_id ON users(line_user_id);
CREATE INDEX idx_users_wallet_address ON users(wallet_address);
CREATE INDEX idx_user_deposits_user_strategy ON user_deposits(user_id, strategy_id);
CREATE INDEX idx_user_deposits_wallet ON user_deposits(wallet_address);
CREATE INDEX idx_user_deposits_status ON user_deposits(status);
CREATE INDEX idx_user_missions_user_id ON user_missions(user_id);
CREATE INDEX idx_user_missions_completed ON user_missions(completed);
CREATE INDEX idx_ai_recommendations_user_id ON ai_recommendations(user_id);
CREATE INDEX idx_ai_recommendations_expires ON ai_recommendations(expires_at);
CREATE INDEX idx_protocol_metrics_date ON protocol_metrics(date);
CREATE INDEX idx_strategy_performance_strategy_date ON strategy_performance(strategy_id, date);
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_tx_hash ON transactions(tx_hash);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read_at);

-- Insert default strategies with real protocol data
INSERT INTO strategies (name, description, protocol_name, category, base_apy, current_apy, risk_level, min_deposit, max_deposit) VALUES
('Stable Earn', 'Conservative lending strategy using Kaia-based lending protocols', 'Kaia Lending', 'Conservative', 500, 500, 2, 10, 10000),
('Growth Plus', 'Balanced liquidity provision on KLAYswap DEX', 'KLAYswap', 'Balanced', 1200, 1200, 5, 50, 50000),
('High Yield Pro', 'Aggressive yield farming on Kleva Protocol and DeFi Kingdoms', 'Kleva/DeFiKingdoms', 'Aggressive', 2500, 2500, 8, 100, 100000);

-- Insert default missions
INSERT INTO missions (name, description, mission_type, reward_points, difficulty, duration_seconds, requirements) VALUES
('First Deposit', 'Make your first deposit to any strategy', 'deposit', 100, 1, 0, '{"min_amount": 10}'),
('Portfolio Builder', 'Deposit to 2 different strategies', 'diversification', 200, 3, 604800, '{"unique_strategies": 2}'),
('Yield Master', 'Earn $50 in total rewards', 'rewards', 500, 5, 2592000, '{"total_rewards": 50}'),
('Social Trader', 'Share a strategy with friends', 'social', 150, 2, 0, '{"shares": 1}'),
('Diamond Hands', 'Keep deposits for 30 days without withdrawal', 'holding', 300, 4, 2592000, '{"holding_period": 30}'),
('Risk Taker', 'Try the High Yield Pro strategy', 'high_risk', 250, 6, 0, '{"strategy_risk_min": 7}'),
('Community Builder', 'Refer 3 friends to the platform', 'referral', 750, 7, 0, '{"referrals": 3}'),
('Streak Keeper', 'Maintain 7-day login streak', 'activity', 200, 3, 604800, '{"streak_days": 7}');

-- Create functions for automatic updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_strategies_updated_at BEFORE UPDATE ON strategies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_deposits_updated_at BEFORE UPDATE ON user_deposits FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_missions_updated_at BEFORE UPDATE ON missions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_missions_updated_at BEFORE UPDATE ON user_missions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_stats_updated_at BEFORE UPDATE ON user_stats FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Views for common queries
CREATE VIEW active_user_portfolios AS
SELECT
    u.id as user_id,
    u.line_user_id,
    u.display_name,
    u.wallet_address,
    COUNT(DISTINCT ud.strategy_id) as strategies_count,
    SUM(ud.amount) as total_deposited,
    SUM(ud.accumulated_rewards) as total_rewards,
    AVG(s.risk_level) as avg_risk_level
FROM users u
LEFT JOIN user_deposits ud ON u.id = ud.user_id AND ud.status = 'active'
LEFT JOIN strategies s ON ud.strategy_id = s.id
WHERE u.is_active = true
GROUP BY u.id, u.line_user_id, u.display_name, u.wallet_address;

CREATE VIEW leaderboard_view AS
SELECT
    u.display_name,
    us.total_points,
    us.level,
    us.total_deposited,
    us.total_rewards,
    us.streak_days,
    RANK() OVER (ORDER BY us.total_points DESC) as rank
FROM user_stats us
JOIN users u ON us.user_id = u.id
WHERE u.is_active = true
ORDER BY us.total_points DESC;

CREATE VIEW strategy_analytics AS
SELECT
    s.id,
    s.name,
    s.current_apy,
    s.risk_level,
    s.total_deposited,
    s.total_users,
    AVG(sp.apy) as avg_apy_30d,
    COUNT(ud.id) as total_deposits
FROM strategies s
LEFT JOIN strategy_performance sp ON s.id = sp.strategy_id
    AND sp.date >= CURRENT_DATE - INTERVAL '30 days'
LEFT JOIN user_deposits ud ON s.id = ud.strategy_id
WHERE s.active = true
GROUP BY s.id, s.name, s.current_apy, s.risk_level, s.total_deposited, s.total_users;

-- Grant permissions (adjust user as needed)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO kaia_yield_ai_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO kaia_yield_ai_user;