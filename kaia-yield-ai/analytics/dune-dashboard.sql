-- KAIA YIELD AI - Comprehensive DeFi Analytics Dashboard
-- This dashboard tracks all key metrics for the Kaia Wave Stablecoin Summer Hackathon

-- =============================================
-- PROTOCOL OVERVIEW METRICS
-- =============================================

-- Total Value Locked (TVL) Over Time
WITH daily_tvl AS (
    SELECT 
        DATE_TRUNC('day', block_time) as date,
        SUM(CASE 
            WHEN topic0 = '0x...' -- DepositMade event signature
            THEN CAST(data AS DECIMAL(38,0)) / 1e6 -- Convert from wei to USDT
            ELSE 0 
        END) as daily_deposits,
        SUM(CASE 
            WHEN topic0 = '0x...' -- WithdrawalMade event signature  
            THEN -CAST(data AS DECIMAL(38,0)) / 1e6
            ELSE 0
        END) as daily_withdrawals
    FROM kaia.logs
    WHERE contract_address = '{{YieldOptimizer_Address}}'
    AND block_time >= '2024-08-25' -- Hackathon start date
    GROUP BY 1
),
cumulative_tvl AS (
    SELECT 
        date,
        SUM(daily_deposits + daily_withdrawals) OVER (ORDER BY date) as tvl
    FROM daily_tvl
)
SELECT 
    date,
    tvl,
    LAG(tvl) OVER (ORDER BY date) as prev_tvl,
    (tvl - LAG(tvl) OVER (ORDER BY date)) / LAG(tvl) OVER (ORDER BY date) * 100 as tvl_change_pct
FROM cumulative_tvl
ORDER BY date DESC;

-- =============================================
-- STRATEGY PERFORMANCE METRICS
-- =============================================

-- Strategy Performance Breakdown
SELECT 
    s.strategy_name,
    s.risk_level,
    COUNT(DISTINCT d.user_address) as unique_users,
    SUM(d.amount) / 1e6 as total_deposits_usdt,
    AVG(d.amount) / 1e6 as avg_deposit_size,
    SUM(r.reward_amount) / 1e6 as total_rewards_paid,
    (SUM(r.reward_amount) / SUM(d.amount)) * 100 as actual_apy,
    s.base_apy / 100 as promised_apy
FROM (
    -- Strategy master data
    SELECT 
        1 as strategy_id, 'Stable Earn' as strategy_name, 2 as risk_level, 520 as base_apy
    UNION ALL
    SELECT 
        2, 'Growth Plus', 5, 1180
    UNION ALL  
    SELECT 
        3, 'High Yield Pro', 8, 2650
) s
LEFT JOIN (
    -- Deposits by strategy
    SELECT 
        CAST(topic2 AS INTEGER) as strategy_id,
        topic1 as user_address,
        CAST(data AS DECIMAL(38,0)) as amount,
        block_time
    FROM kaia.logs
    WHERE contract_address = '{{YieldOptimizer_Address}}'
    AND topic0 = '0x...' -- DepositMade event signature
) d ON s.strategy_id = d.strategy_id
LEFT JOIN (
    -- Rewards distributed
    SELECT 
        topic1 as user_address,
        CAST(data AS DECIMAL(38,0)) as reward_amount,
        block_time
    FROM kaia.logs  
    WHERE contract_address = '{{YieldOptimizer_Address}}'
    AND topic0 = '0x...' -- RewardsDistributed event signature
) r ON d.user_address = r.user_address
GROUP BY s.strategy_id, s.strategy_name, s.risk_level, s.base_apy
ORDER BY total_deposits_usdt DESC;

-- =============================================
-- USER ENGAGEMENT METRICS
-- =============================================

-- Daily Active Users and Transactions
SELECT 
    DATE_TRUNC('day', block_time) as date,
    COUNT(DISTINCT topic1) as daily_active_users,
    COUNT(*) as total_transactions,
    SUM(CASE WHEN topic0 = '0x...' THEN 1 ELSE 0 END) as deposits,
    SUM(CASE WHEN topic0 = '0x...' THEN 1 ELSE 0 END) as withdrawals,
    SUM(CASE WHEN topic0 = '0x...' THEN 1 ELSE 0 END) as ai_recommendations
FROM kaia.logs
WHERE contract_address IN ('{{YieldOptimizer_Address}}', '{{GameRewards_Address}}')
AND block_time >= '2024-08-25'
GROUP BY 1
ORDER BY date DESC;

-- User Retention Analysis
WITH user_first_deposit AS (
    SELECT 
        topic1 as user_address,
        MIN(DATE_TRUNC('day', block_time)) as first_deposit_date
    FROM kaia.logs
    WHERE contract_address = '{{YieldOptimizer_Address}}'
    AND topic0 = '0x...' -- DepositMade event signature
    GROUP BY 1
),
user_activity AS (
    SELECT 
        u.user_address,
        u.first_deposit_date,
        DATE_TRUNC('day', l.block_time) as activity_date,
        COUNT(*) as daily_transactions
    FROM user_first_deposit u
    JOIN kaia.logs l ON u.user_address = l.topic1
    WHERE l.contract_address = '{{YieldOptimizer_Address}}'
    AND l.block_time >= u.first_deposit_date
    GROUP BY 1, 2, 3
)
SELECT 
    first_deposit_date,
    COUNT(DISTINCT user_address) as new_users,
    COUNT(DISTINCT CASE 
        WHEN activity_date = first_deposit_date + INTERVAL '1 day' 
        THEN user_address END) as day_1_retention,
    COUNT(DISTINCT CASE 
        WHEN activity_date = first_deposit_date + INTERVAL '7 days' 
        THEN user_address END) as day_7_retention,
    COUNT(DISTINCT CASE 
        WHEN activity_date = first_deposit_date + INTERVAL '30 days' 
        THEN user_address END) as day_30_retention
FROM user_activity
GROUP BY 1
ORDER BY first_deposit_date DESC;

-- =============================================
-- GAMIFICATION METRICS
-- =============================================

-- Mission Completion and Rewards
SELECT 
    m.mission_name,
    m.difficulty,
    m.reward_points,
    COUNT(DISTINCT c.user_address) as completions,
    SUM(c.reward_points) as total_rewards_distributed,
    AVG(c.completion_time_hours) as avg_completion_time_hours
FROM (
    -- Mission master data
    SELECT 1 as mission_id, 'First Deposit' as mission_name, 1 as difficulty, 100 as reward_points
    UNION ALL SELECT 2, 'Yield Explorer', 2, 250
    UNION ALL SELECT 3, 'Consistency King', 2, 150  
    UNION ALL SELECT 4, 'Social Butterfly', 3, 500
    UNION ALL SELECT 5, 'High Roller', 4, 1000
    UNION ALL SELECT 6, 'AI Whisperer', 2, 200
) m
LEFT JOIN (
    -- Mission completions
    SELECT 
        CAST(topic2 AS INTEGER) as mission_id,
        topic1 as user_address,
        CAST(SUBSTRING(data, 1, 64) AS DECIMAL(38,0)) as reward_points,
        EXTRACT(EPOCH FROM block_time - start_time) / 3600 as completion_time_hours,
        block_time
    FROM kaia.logs
    WHERE contract_address = '{{GameRewards_Address}}'
    AND topic0 = '0x...' -- MissionCompleted event signature
) c ON m.mission_id = c.mission_id
GROUP BY m.mission_id, m.mission_name, m.difficulty, m.reward_points
ORDER BY completions DESC;

-- Leaderboard and User Levels
SELECT 
    topic1 as user_address,
    CAST(SUBSTRING(data, 1, 64) AS DECIMAL(38,0)) as total_points,
    CAST(SUBSTRING(data, 65, 64) AS DECIMAL(38,0)) as user_level,
    CAST(SUBSTRING(data, 129, 64) AS DECIMAL(38,0)) as streak_days,
    ROW_NUMBER() OVER (ORDER BY CAST(SUBSTRING(data, 1, 64) AS DECIMAL(38,0)) DESC) as leaderboard_rank
FROM kaia.logs
WHERE contract_address = '{{GameRewards_Address}}'
AND topic0 = '0x...' -- UserStatsUpdated event signature
AND block_time = (
    SELECT MAX(block_time) 
    FROM kaia.logs l2 
    WHERE l2.topic1 = kaia.logs.topic1 
    AND l2.contract_address = '{{GameRewards_Address}}'
    AND l2.topic0 = '0x...'
)
ORDER BY total_points DESC
LIMIT 100;

-- =============================================
-- AI RECOMMENDATION METRICS
-- =============================================

-- AI Recommendation Performance
WITH ai_recommendations AS (
    SELECT 
        topic1 as user_address,
        CAST(topic2 AS INTEGER) as recommended_strategy_id,
        CAST(SUBSTRING(data, 1, 64) AS DECIMAL(38,0)) as confidence_score,
        block_time as recommendation_time
    FROM kaia.logs
    WHERE contract_address = '{{YieldOptimizer_Address}}'
    AND topic0 = '0x...' -- AIRecommendationUpdated event signature
),
user_deposits_after_rec AS (
    SELECT 
        r.user_address,
        r.recommended_strategy_id,
        r.confidence_score,
        r.recommendation_time,
        d.strategy_id as actual_strategy_id,
        d.amount,
        d.block_time as deposit_time,
        EXTRACT(EPOCH FROM d.block_time - r.recommendation_time) / 3600 as hours_to_deposit
    FROM ai_recommendations r
    LEFT JOIN (
        SELECT 
            topic1 as user_address,
            CAST(topic2 AS INTEGER) as strategy_id,
            CAST(data AS DECIMAL(38,0)) as amount,
            block_time
        FROM kaia.logs
        WHERE contract_address = '{{YieldOptimizer_Address}}'
        AND topic0 = '0x...' -- DepositMade event signature
    ) d ON r.user_address = d.user_address 
    AND d.block_time > r.recommendation_time
    AND d.block_time <= r.recommendation_time + INTERVAL '7 days'
)
SELECT 
    recommended_strategy_id,
    AVG(confidence_score) as avg_confidence,
    COUNT(*) as total_recommendations,
    COUNT(actual_strategy_id) as followed_recommendations,
    COUNT(CASE WHEN recommended_strategy_id = actual_strategy_id THEN 1 END) as exact_matches,
    (COUNT(CASE WHEN recommended_strategy_id = actual_strategy_id THEN 1 END) * 100.0 / COUNT(actual_strategy_id)) as accuracy_rate,
    AVG(hours_to_deposit) as avg_hours_to_act,
    SUM(amount) / 1e6 as total_volume_influenced_usdt
FROM user_deposits_after_rec
GROUP BY recommended_strategy_id
ORDER BY accuracy_rate DESC;

-- =============================================
-- FINANCIAL PERFORMANCE
-- =============================================

-- Revenue and Fees Generated
SELECT 
    DATE_TRUNC('day', block_time) as date,
    SUM(CASE 
        WHEN topic0 = '0x...' -- PerformanceFee event
        THEN CAST(data AS DECIMAL(38,0)) / 1e6 
        ELSE 0 
    END) as performance_fees_usdt,
    SUM(CASE 
        WHEN topic0 = '0x...' -- WithdrawalFee event  
        THEN CAST(data AS DECIMAL(38,0)) / 1e6
        ELSE 0
    END) as withdrawal_fees_usdt,
    COUNT(DISTINCT topic1) as fee_paying_users
FROM kaia.logs
WHERE contract_address IN ('{{YieldOptimizer_Address}}', '{{Strategy1_Address}}', '{{Strategy2_Address}}', '{{Strategy3_Address}}')
AND block_time >= '2024-08-25'
GROUP BY 1
ORDER BY date DESC;

-- Protocol Health Metrics
SELECT 
    'Current' as period,
    (SELECT SUM(CAST(data AS DECIMAL(38,0))) / 1e6 FROM kaia.logs 
     WHERE contract_address = '{{YieldOptimizer_Address}}' 
     AND topic0 = '0x...' -- DepositMade
    ) - 
    (SELECT SUM(CAST(data AS DECIMAL(38,0))) / 1e6 FROM kaia.logs 
     WHERE contract_address = '{{YieldOptimizer_Address}}' 
     AND topic0 = '0x...' -- WithdrawalMade  
    ) as current_tvl_usdt,
    
    (SELECT COUNT(DISTINCT topic1) FROM kaia.logs
     WHERE contract_address = '{{YieldOptimizer_Address}}'
     AND block_time >= CURRENT_DATE - INTERVAL '30 days'
    ) as monthly_active_users,
    
    (SELECT AVG(CAST(data AS DECIMAL(38,0))) / 1e6 FROM kaia.logs
     WHERE contract_address = '{{YieldOptimizer_Address}}'
     AND topic0 = '0x...' -- DepositMade
     AND block_time >= CURRENT_DATE - INTERVAL '30 days'
    ) as avg_deposit_size_30d,
    
    (SELECT COUNT(*) FROM kaia.logs
     WHERE contract_address = '{{YieldOptimizer_Address}}'
     AND block_time >= CURRENT_DATE - INTERVAL '1 day'
    ) as transactions_24h;

-- =============================================
-- SOCIAL AND LINE INTEGRATION METRICS  
-- =============================================

-- LINE User Engagement (if LINE user IDs are tracked)
SELECT 
    DATE_TRUNC('day', block_time) as date,
    COUNT(DISTINCT CASE 
        WHEN SUBSTRING(data, 193, 64) != '0x0000000000000000000000000000000000000000000000000000000000000000'
        THEN topic1 END) as line_connected_users,
    COUNT(DISTINCT topic1) as total_users,
    (COUNT(DISTINCT CASE 
        WHEN SUBSTRING(data, 193, 64) != '0x0000000000000000000000000000000000000000000000000000000000000000'
        THEN topic1 END) * 100.0 / COUNT(DISTINCT topic1)) as line_integration_rate
FROM kaia.logs
WHERE contract_address = '{{YieldOptimizer_Address}}'
AND topic0 = '0x...' -- UserRegistered event with LINE ID
AND block_time >= '2024-08-25'
GROUP BY 1
ORDER BY date DESC;