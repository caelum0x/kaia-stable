-- Initial database schema for KAIA YIELD AI
-- Version: 1.0.0
-- Created: 2025-01-01

-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  address VARCHAR(42) UNIQUE NOT NULL,
  line_user_id VARCHAR(255),
  display_name VARCHAR(255),
  risk_tolerance INTEGER DEFAULT 5 CHECK (risk_tolerance >= 1 AND risk_tolerance <= 10),
  level INTEGER DEFAULT 1 CHECK (level >= 1),
  points INTEGER DEFAULT 0 CHECK (points >= 0),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Strategies table
CREATE TABLE IF NOT EXISTS strategies (
  id SERIAL PRIMARY KEY,
  contract_id INTEGER UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  contract_address VARCHAR(42) NOT NULL,
  base_apy INTEGER NOT NULL CHECK (base_apy >= 0),
  current_apy INTEGER NOT NULL CHECK (current_apy >= 0),
  risk_level INTEGER NOT NULL CHECK (risk_level >= 1 AND risk_level <= 10),
  min_deposit BIGINT NOT NULL CHECK (min_deposit > 0),
  max_deposit BIGINT NOT NULL CHECK (max_deposit >= min_deposit),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Deposits table
CREATE TABLE IF NOT EXISTS deposits (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  strategy_id INTEGER REFERENCES strategies(id) ON DELETE RESTRICT,
  amount BIGINT NOT NULL CHECK (amount > 0),
  transaction_hash VARCHAR(66),
  block_number INTEGER,
  deposit_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_reward_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  accumulated_rewards BIGINT DEFAULT 0 CHECK (accumulated_rewards >= 0),
  active BOOLEAN DEFAULT true
);

-- Missions table
CREATE TABLE IF NOT EXISTS missions (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  reward INTEGER NOT NULL CHECK (reward > 0),
  difficulty INTEGER NOT NULL CHECK (difficulty >= 1 AND difficulty <= 5),
  duration INTEGER NOT NULL CHECK (duration > 0), -- in seconds
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User missions table
CREATE TABLE IF NOT EXISTS user_missions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  mission_id INTEGER REFERENCES missions(id) ON DELETE CASCADE,
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed BOOLEAN DEFAULT false,
  claimed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP,
  claimed_at TIMESTAMP,
  UNIQUE(user_id, mission_id)
);

-- Transactions log table for audit
CREATE TABLE IF NOT EXISTS transaction_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  transaction_hash VARCHAR(66),
  transaction_type VARCHAR(50) NOT NULL, -- 'deposit', 'withdraw', 'claim_reward'
  amount BIGINT,
  strategy_id INTEGER REFERENCES strategies(id),
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'confirmed', 'failed'
  block_number INTEGER,
  gas_used INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  confirmed_at TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_address ON users(address);
CREATE INDEX IF NOT EXISTS idx_users_line_user_id ON users(line_user_id);
CREATE INDEX IF NOT EXISTS idx_deposits_user_id ON deposits(user_id);
CREATE INDEX IF NOT EXISTS idx_deposits_strategy_id ON deposits(strategy_id);
CREATE INDEX IF NOT EXISTS idx_deposits_active ON deposits(active);
CREATE INDEX IF NOT EXISTS idx_user_missions_user_id ON user_missions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_missions_mission_id ON user_missions(mission_id);
CREATE INDEX IF NOT EXISTS idx_transaction_logs_user_id ON transaction_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_transaction_logs_hash ON transaction_logs(transaction_hash);
CREATE INDEX IF NOT EXISTS idx_transaction_logs_status ON transaction_logs(status);

-- Create trigger to automatically update 'updated_at' timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_strategies_updated_at BEFORE UPDATE ON strategies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default strategies
INSERT INTO strategies (contract_id, name, description, contract_address, base_apy, current_apy, risk_level, min_deposit, max_deposit, active)
VALUES
(1, 'Stable Earn', 'Low-risk stable yield strategy focusing on stablecoin farming with minimal impermanent loss risk', '0xA6D8A3Ff0E83C72e8F14e7D1234Bb8DeC3F5C1c2', 500, 520, 2, 10000000, 10000000000, true),
(2, 'Growth Plus', 'Medium-risk growth strategy utilizing blue-chip DeFi protocols for balanced risk-reward', '0xB7E9A4Ff1F94D83f9F25e8E2345Cc9EeD4F6D2d3', 1200, 1180, 5, 50000000, 50000000000, true),
(3, 'High Yield Pro', 'High-risk high-reward strategy leveraging advanced DeFi strategies and newer protocols', '0xC8F0B5Ff2Fa5E94g0F36f9F3456DdAeF5G7E3e4', 2500, 2650, 8, 100000000, 100000000000, true)
ON CONFLICT (contract_id) DO NOTHING;

-- Insert default missions
INSERT INTO missions (name, description, reward, difficulty, duration, active)
VALUES
('First Deposit', 'Make your first USDT deposit to start earning yield', 100, 1, 86400, true),
('Yield Explorer', 'Try 3 different yield strategies to diversify your portfolio', 250, 2, 604800, true),
('Consistent Investor', 'Make deposits for 7 consecutive days', 500, 3, 604800, true),
('High Roller', 'Deposit more than 1000 USDT in a single transaction', 1000, 4, 2592000, true),
('Social Butterfly', 'Refer 5 friends to the platform and earn social rewards', 2500, 5, 2592000, true),
('Diamond Hands', 'Keep your deposit active for 30 days without withdrawal', 750, 3, 2592000, true),
('Strategy Master', 'Use all available strategies at least once', 300, 2, 1209600, true)
ON CONFLICT DO NOTHING;

-- Create view for user statistics
CREATE OR REPLACE VIEW user_stats AS
SELECT
    u.id,
    u.address,
    u.display_name,
    u.level,
    u.points,
    COALESCE(SUM(CASE WHEN d.active = true THEN d.amount ELSE 0 END), 0) as total_deposited,
    COALESCE(SUM(CASE WHEN d.active = true THEN d.accumulated_rewards ELSE 0 END), 0) as total_rewards,
    COUNT(DISTINCT d.strategy_id) as strategies_used,
    COUNT(CASE WHEN um.completed = true THEN 1 END) as missions_completed
FROM users u
LEFT JOIN deposits d ON u.id = d.user_id
LEFT JOIN user_missions um ON u.id = um.user_id
GROUP BY u.id, u.address, u.display_name, u.level, u.points;

-- Create view for strategy performance
CREATE OR REPLACE VIEW strategy_performance AS
SELECT
    s.id,
    s.name,
    s.current_apy,
    s.risk_level,
    COUNT(d.id) as total_deposits,
    COUNT(DISTINCT d.user_id) as unique_users,
    COALESCE(SUM(CASE WHEN d.active = true THEN d.amount ELSE 0 END), 0) as total_tvl,
    COALESCE(AVG(CASE WHEN d.active = true THEN d.amount::FLOAT ELSE NULL END), 0) as avg_deposit_size
FROM strategies s
LEFT JOIN deposits d ON s.id = d.strategy_id
WHERE s.active = true
GROUP BY s.id, s.name, s.current_apy, s.risk_level;

COMMENT ON TABLE users IS 'User accounts and profiles';
COMMENT ON TABLE strategies IS 'Available yield farming strategies';
COMMENT ON TABLE deposits IS 'User deposits in various strategies';
COMMENT ON TABLE missions IS 'Gamification missions and challenges';
COMMENT ON TABLE user_missions IS 'User progress on missions';
COMMENT ON TABLE transaction_logs IS 'Audit log of all blockchain transactions';