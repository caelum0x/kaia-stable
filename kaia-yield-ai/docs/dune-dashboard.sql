-- KAIA YIELD AI - Dune Analytics Dashboard Queries
-- This file contains SQL queries for creating comprehensive analytics dashboard

-- Query 1: Total Value Locked (TVL) Over Time
-- Dashboard: TVL Trend
SELECT 
    DATE_TRUNC('day', block_time) as date,
    SUM(CASE 
        WHEN topic0 = '0x...' -- DepositMade event hash
        THEN bytea2numeric(data) / 1e6 -- Convert from wei to USDT
        ELSE 0 
    END) as daily_deposits,
    SUM(CASE 
        WHEN topic0 = '0x...' -- WithdrawalMade event hash  
        THEN -bytea2numeric(data) / 1e6 -- Convert from wei to USDT
        ELSE 0 
    END) as daily_withdrawals,
    SUM(SUM(CASE 
        WHEN topic0 = '0x...' -- DepositMade
        THEN bytea2numeric(data) / 1e6
        WHEN topic0 = '0x...' -- WithdrawalMade
        THEN -bytea2numeric(data) / 1e6
        ELSE 0 
    END)) OVER (ORDER BY DATE_TRUNC('day', block_time)) as cumulative_tvl
FROM kaia.logs
WHERE contract_address = '{{YieldOptimizer_Address}}'
    AND block_time >= NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', block_time)
ORDER BY date;

-- Query 2: Strategy Performance Analytics  
-- Dashboard: Strategy Metrics
WITH strategy_events AS (
    SELECT 
        block_time,
        bytea2numeric(SUBSTRING(data, 33, 32)) as strategy_id,
        bytea2numeric(SUBSTRING(data, 1, 32)) / 1e6 as amount,
        CASE 
            WHEN topic0 = '0x...' THEN 'deposit'
            WHEN topic0 = '0x...' THEN 'withdrawal'
        END as event_type
    FROM kaia.logs
    WHERE contract_address = '{{YieldOptimizer_Address}}'
        AND topic0 IN ('0x...', '0x...') -- Deposit and Withdrawal event hashes
)
SELECT 
    strategy_id,
    COUNT(DISTINCT CASE WHEN event_type = 'deposit' THEN tx_hash END) as total_deposits,
    COUNT(DISTINCT CASE WHEN event_type = 'withdrawal' THEN tx_hash END) as total_withdrawals,
    SUM(CASE WHEN event_type = 'deposit' THEN amount ELSE 0 END) as total_deposited,
    SUM(CASE WHEN event_type = 'withdrawal' THEN amount ELSE 0 END) as total_withdrawn,
    SUM(CASE 
        WHEN event_type = 'deposit' THEN amount 
        WHEN event_type = 'withdrawal' THEN -amount 
        ELSE 0 
    END) as current_tvl,
    COUNT(DISTINCT 
        CASE WHEN event_type = 'deposit' 
        THEN '0x' || ENCODE(SUBSTRING(topics[2], 13, 20), 'hex') 
        END
    ) as unique_depositors
FROM strategy_events
GROUP BY strategy_id
ORDER BY current_tvl DESC;

-- Query 3: User Activity and Engagement
-- Dashboard: User Metrics
WITH user_activity AS (
    SELECT 
        '0x' || ENCODE(SUBSTRING(topics[2], 13, 20), 'hex') as user_address,
        DATE_TRUNC('day', block_time) as activity_date,
        COUNT(*) as daily_transactions,
        SUM(bytea2numeric(SUBSTRING(data, 1, 32)) / 1e6) as daily_volume
    FROM kaia.logs
    WHERE contract_address = '{{YieldOptimizer_Address}}'
        AND topic0 IN ('0x...', '0x...') -- Deposit and Withdrawal events
        AND block_time >= NOW() - INTERVAL '30 days'
    GROUP BY user_address, DATE_TRUNC('day', block_time)
),
user_metrics AS (
    SELECT 
        user_address,
        COUNT(DISTINCT activity_date) as active_days,
        SUM(daily_transactions) as total_transactions,
        SUM(daily_volume) as total_volume,
        MAX(activity_date) as last_activity,
        MIN(activity_date) as first_activity
    FROM user_activity
    GROUP BY user_address
)
SELECT 
    COUNT(*) as total_users,
    COUNT(CASE WHEN active_days >= 7 THEN 1 END) as weekly_active_users,
    COUNT(CASE WHEN active_days >= 1 THEN 1 END) as daily_active_users,
    AVG(total_transactions) as avg_transactions_per_user,
    AVG(total_volume) as avg_volume_per_user,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY total_volume) as median_volume_per_user
FROM user_metrics;

-- Query 4: Daily Active Users Trend
-- Dashboard: User Growth
SELECT 
    DATE_TRUNC('day', block_time) as date,
    COUNT(DISTINCT '0x' || ENCODE(SUBSTRING(topics[2], 13, 20), 'hex')) as daily_active_users,
    COUNT(DISTINCT CASE 
        WHEN topic0 = '0x...' -- First deposit event for new users
        THEN '0x' || ENCODE(SUBSTRING(topics[2], 13, 20), 'hex')
    END) as new_users
FROM kaia.logs
WHERE contract_address = '{{YieldOptimizer_Address}}'
    AND topic0 IN ('0x...', '0x...') -- All user interaction events
    AND block_time >= NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', block_time)
ORDER BY date;

-- Query 5: Reward Distribution Analytics
-- Dashboard: Rewards & Gamification
WITH reward_events AS (
    SELECT 
        block_time,
        '0x' || ENCODE(SUBSTRING(topics[2], 13, 20), 'hex') as user_address,
        bytea2numeric(SUBSTRING(data, 1, 32)) as reward_amount,
        bytea2numeric(SUBSTRING(data, 33, 32)) as mission_id
    FROM kaia.logs
    WHERE contract_address = '{{GameRewards_Address}}'
        AND topic0 = '0x...' -- RewardsDistributed event hash
        AND block_time >= NOW() - INTERVAL '30 days'
)
SELECT 
    DATE_TRUNC('day', block_time) as date,
    COUNT(*) as total_rewards_distributed,
    COUNT(DISTINCT user_address) as unique_reward_recipients,
    SUM(reward_amount) as total_reward_amount,
    AVG(reward_amount) as avg_reward_amount,
    COUNT(DISTINCT mission_id) as missions_completed
FROM reward_events
GROUP BY DATE_TRUNC('day', block_time)
ORDER BY date;

-- Query 6: Risk Distribution Analysis
-- Dashboard: Risk Metrics
WITH user_strategies AS (
    SELECT 
        '0x' || ENCODE(SUBSTRING(topics[2], 13, 20), 'hex') as user_address,
        bytea2numeric(SUBSTRING(data, 33, 32)) as strategy_id,
        bytea2numeric(SUBSTRING(data, 1, 32)) / 1e6 as deposit_amount
    FROM kaia.logs
    WHERE contract_address = '{{YieldOptimizer_Address}}'
        AND topic0 = '0x...' -- DepositMade event
),
strategy_risk_mapping AS (
    SELECT 1 as strategy_id, 2 as risk_level, 'Stable Earn' as strategy_name
    UNION ALL SELECT 2, 5, 'Growth Plus'  
    UNION ALL SELECT 3, 8, 'High Yield Pro'
)
SELECT 
    srm.risk_level,
    srm.strategy_name,
    COUNT(DISTINCT us.user_address) as unique_users,
    SUM(us.deposit_amount) as total_deposits,
    AVG(us.deposit_amount) as avg_deposit_size,
    COUNT(*) as total_transactions
FROM user_strategies us
JOIN strategy_risk_mapping srm ON us.strategy_id = srm.strategy_id
GROUP BY srm.risk_level, srm.strategy_name
ORDER BY srm.risk_level;

-- Query 7: Top Performers Leaderboard  
-- Dashboard: Leaderboard
WITH user_performance AS (
    SELECT 
        '0x' || ENCODE(SUBSTRING(topics[2], 13, 20), 'hex') as user_address,
        SUM(CASE 
            WHEN topic0 = '0x...' -- Deposit event
            THEN bytea2numeric(SUBSTRING(data, 1, 32)) / 1e6
            ELSE 0 
        END) as total_deposited,
        SUM(CASE 
            WHEN topic0 = '0x...' -- Reward event
            THEN bytea2numeric(SUBSTRING(data, 1, 32)) 
            ELSE 0 
        END) as total_rewards,
        COUNT(DISTINCT CASE 
            WHEN topic0 = '0x...' -- Mission completed
            THEN bytea2numeric(SUBSTRING(data, 33, 32))
        END) as missions_completed
    FROM kaia.logs
    WHERE contract_address IN ('{{YieldOptimizer_Address}}', '{{GameRewards_Address}}')
        AND topic0 IN ('0x...', '0x...', '0x...') -- All relevant events
    GROUP BY user_address
)
SELECT 
    ROW_NUMBER() OVER (ORDER BY total_rewards DESC) as rank,
    SUBSTRING(user_address, 1, 6) || '...' || SUBSTRING(user_address, -4) as user_display,
    total_deposited,
    total_rewards,
    missions_completed,
    CASE 
        WHEN total_deposited > 0 
        THEN (total_rewards::float / total_deposited * 100) 
        ELSE 0 
    END as roi_percentage
FROM user_performance
WHERE total_deposited > 0
ORDER BY total_rewards DESC
LIMIT 20;

-- Query 8: Protocol Health Metrics
-- Dashboard: Protocol Overview
SELECT 
    'Total Value Locked' as metric,
    ROUND(SUM(CASE 
        WHEN topic0 = '0x...' -- Deposit
        THEN bytea2numeric(data) / 1e6
        WHEN topic0 = '0x...' -- Withdrawal  
        THEN -bytea2numeric(data) / 1e6
        ELSE 0 
    END), 2) as value,
    'USDT' as unit
FROM kaia.logs
WHERE contract_address = '{{YieldOptimizer_Address}}'
    AND topic0 IN ('0x...', '0x...')

UNION ALL

SELECT 
    'Total Users' as metric,
    COUNT(DISTINCT '0x' || ENCODE(SUBSTRING(topics[2], 13, 20), 'hex')) as value,
    'users' as unit
FROM kaia.logs
WHERE contract_address = '{{YieldOptimizer_Address}}'
    AND topic0 = '0x...' -- Deposit event

UNION ALL

SELECT 
    'Total Transactions' as metric,
    COUNT(*) as value,
    'txns' as unit
FROM kaia.logs
WHERE contract_address IN ('{{YieldOptimizer_Address}}', '{{GameRewards_Address}}')
    AND block_time >= NOW() - INTERVAL '30 days'

UNION ALL

SELECT 
    'Rewards Distributed' as metric,
    ROUND(SUM(bytea2numeric(data) / 1e18), 2) as value,
    'tokens' as unit
FROM kaia.logs
WHERE contract_address = '{{GameRewards_Address}}'
    AND topic0 = '0x...'; -- Reward distributed event