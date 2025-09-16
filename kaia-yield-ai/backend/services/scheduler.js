const cron = require('node-cron');
const DeFiIntegrationService = require('./defi');
const { db, strategyService } = require('../database/connection');
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/scheduler.log' })
  ]
});

class SchedulerService {
  constructor() {
    this.defiService = new DeFiIntegrationService();
    this.jobs = new Map();
  }

  start() {
    logger.info('Starting scheduler service...');

    // Update strategy APYs every 5 minutes
    this.scheduleAPYUpdates();

    // Update protocol metrics every hour
    this.scheduleMetricsUpdates();

    // Process user missions every hour
    this.scheduleMissionProcessing();

    // Update AI model data every 6 hours
    this.scheduleAIModelUpdates();

    // Daily leaderboard calculations
    this.scheduleDailyTasks();

    // Weekly analytics reports
    this.scheduleWeeklyTasks();

    logger.info('All scheduled jobs started successfully');
  }

  scheduleAPYUpdates() {
    const job = cron.schedule('*/5 * * * *', async () => {
      try {
        logger.info('Starting APY update job...');

        const strategies = await strategyService.getAllStrategies();
        const realTimeData = await this.defiService.updateStrategyAPYs();

        for (const strategy of strategies) {
          const strategyData = realTimeData.strategies[strategy.id];
          if (strategyData) {
            await strategyService.updateStrategyAPY(
              strategy.id,
              strategyData.apy,
              strategyData.source
            );

            logger.info(`Updated strategy ${strategy.name}: ${strategyData.apy} bps from ${strategyData.source}`);
          }
        }

        // Cache the market conditions
        await db.set('market:conditions', realTimeData.marketConditions, 300);

        logger.info('APY update job completed successfully');
      } catch (error) {
        logger.error('APY update job failed:', error);
      }
    });

    this.jobs.set('apy-updates', job);
  }

  scheduleMetricsUpdates() {
    const job = cron.schedule('0 * * * *', async () => {
      try {
        logger.info('Starting protocol metrics update...');

        const metricsQuery = `
          INSERT INTO protocol_metrics (
            date, total_value_locked, total_users, total_strategies,
            total_transactions, average_apy, volume_24h, metrics_data
          )
          SELECT
            CURRENT_DATE,
            COALESCE(SUM(ud.amount), 0) as tvl,
            COUNT(DISTINCT u.id) as total_users,
            COUNT(DISTINCT s.id) as total_strategies,
            COUNT(t.id) as total_transactions,
            COALESCE(AVG(s.current_apy), 0) as average_apy,
            COALESCE(SUM(CASE WHEN t.created_at >= NOW() - INTERVAL '24 hours' THEN t.amount ELSE 0 END), 0) as volume_24h,
            jsonb_build_object(
              'active_strategies', COUNT(DISTINCT CASE WHEN s.active THEN s.id END),
              'new_users_24h', COUNT(DISTINCT CASE WHEN u.created_at >= NOW() - INTERVAL '24 hours' THEN u.id END),
              'avg_user_balance', COALESCE(AVG(us.total_deposited), 0),
              'completion_rate', COALESCE(AVG(CASE WHEN um.completed THEN 1.0 ELSE 0.0 END), 0)
            ) as metrics_data
          FROM users u
          LEFT JOIN user_deposits ud ON u.id = ud.user_id AND ud.status = 'active'
          LEFT JOIN strategies s ON s.active = true
          LEFT JOIN transactions t ON t.created_at >= CURRENT_DATE
          LEFT JOIN user_stats us ON u.id = us.user_id
          LEFT JOIN user_missions um ON u.id = um.user_id
          WHERE u.is_active = true
          ON CONFLICT (date) DO UPDATE SET
            total_value_locked = EXCLUDED.total_value_locked,
            total_users = EXCLUDED.total_users,
            total_strategies = EXCLUDED.total_strategies,
            total_transactions = EXCLUDED.total_transactions,
            average_apy = EXCLUDED.average_apy,
            volume_24h = EXCLUDED.volume_24h,
            metrics_data = EXCLUDED.metrics_data,
            created_at = NOW()
        `;

        await db.query(metricsQuery);

        // Invalidate metrics cache
        await db.invalidatePattern('metrics:*');
        await db.invalidatePattern('analytics:*');

        logger.info('Protocol metrics updated successfully');
      } catch (error) {
        logger.error('Protocol metrics update failed:', error);
      }
    });

    this.jobs.set('metrics-updates', job);
  }

  scheduleMissionProcessing() {
    const job = cron.schedule('0 * * * *', async () => {
      try {
        logger.info('Starting mission processing...');

        // Auto-complete time-based missions
        const completeMissionsQuery = `
          UPDATE user_missions
          SET completed = true, updated_at = NOW()
          WHERE NOT completed
            AND start_time + (SELECT duration_seconds FROM missions WHERE id = user_missions.mission_id) * INTERVAL '1 second' <= NOW()
            AND progress >= target
        `;

        const completedResult = await db.query(completeMissionsQuery);
        logger.info(`Auto-completed ${completedResult.rowCount} missions`);

        // Process daily/weekly streaks
        const streakQuery = `
          UPDATE user_stats
          SET
            streak_days = CASE
              WHEN last_activity::date = CURRENT_DATE - INTERVAL '1 day' THEN streak_days + 1
              WHEN last_activity::date = CURRENT_DATE THEN streak_days
              ELSE 0
            END,
            updated_at = NOW()
          WHERE last_activity >= CURRENT_DATE - INTERVAL '2 days'
        `;

        await db.query(streakQuery);

        // Update experience and levels
        const levelQuery = `
          UPDATE user_stats
          SET
            level = GREATEST(1, FLOOR(SQRT(total_points / 100))),
            updated_at = NOW()
          WHERE total_points > experience_points
        `;

        await db.query(levelQuery);

        logger.info('Mission processing completed successfully');
      } catch (error) {
        logger.error('Mission processing failed:', error);
      }
    });

    this.jobs.set('mission-processing', job);
  }

  scheduleAIModelUpdates() {
    const job = cron.schedule('0 */6 * * *', async () => {
      try {
        logger.info('Starting AI model data update...');

        // Collect training data from user interactions
        const trainingDataQuery = `
          SELECT
            u.risk_tolerance,
            us.total_deposited as investment_amount,
            us.level as user_level,
            EXTRACT(EPOCH FROM (NOW() - MAX(ud.deposit_time))) / 86400 as days_since_last_deposit,
            COUNT(DISTINCT ud.strategy_id)::float / NULLIF(COUNT(ud.id), 0) as portfolio_diversification,
            s.risk_level as strategy_risk,
            s.current_apy as strategy_apy,
            ud.amount as strategy_amount,
            CASE WHEN ar.accepted THEN 1 ELSE 0 END as recommendation_accepted
          FROM users u
          JOIN user_stats us ON u.id = us.user_id
          LEFT JOIN user_deposits ud ON u.id = ud.user_id
          LEFT JOIN strategies s ON ud.strategy_id = s.id
          LEFT JOIN ai_recommendations ar ON u.id = ar.user_id AND s.id = ar.strategy_id
          WHERE u.is_active = true
            AND ud.created_at >= NOW() - INTERVAL '30 days'
          GROUP BY u.id, u.risk_tolerance, us.total_deposited, us.level,
                   s.risk_level, s.current_apy, ud.amount, ar.accepted
          LIMIT 10000
        `;

        const trainingData = await db.query(trainingDataQuery);

        if (trainingData.rows.length > 100) {
          // Save training data for AI model
          await db.set('ai:training_data', trainingData.rows, 21600); // 6 hours

          // Trigger model retraining (in production, this would be a separate service)
          logger.info(`Prepared ${trainingData.rows.length} training samples for AI model`);
        }

        logger.info('AI model data update completed');
      } catch (error) {
        logger.error('AI model data update failed:', error);
      }
    });

    this.jobs.set('ai-model-updates', job);
  }

  scheduleDailyTasks() {
    const job = cron.schedule('0 0 * * *', async () => {
      try {
        logger.info('Starting daily tasks...');

        // Calculate and distribute daily rewards
        const rewardsQuery = `
          UPDATE user_deposits
          SET
            accumulated_rewards = accumulated_rewards + (
              amount * s.current_apy * EXTRACT(EPOCH FROM (NOW() - last_reward_time)) / (365.25 * 24 * 3600 * 10000)
            ),
            last_reward_time = NOW(),
            updated_at = NOW()
          FROM strategies s
          WHERE s.id = user_deposits.strategy_id
            AND status = 'active'
            AND last_reward_time < CURRENT_DATE
        `;

        const rewardsResult = await db.query(rewardsQuery);
        logger.info(`Updated rewards for ${rewardsResult.rowCount} deposits`);

        // Generate daily protocol analytics
        const analyticsQuery = `
          INSERT INTO strategy_performance (strategy_id, date, apy, tvl, users_count, deposits_count, volume)
          SELECT
            s.id,
            CURRENT_DATE,
            s.current_apy,
            COALESCE(SUM(ud.amount), 0),
            COUNT(DISTINCT ud.user_id),
            COUNT(ud.id),
            COALESCE(SUM(CASE WHEN t.created_at >= CURRENT_DATE THEN t.amount ELSE 0 END), 0)
          FROM strategies s
          LEFT JOIN user_deposits ud ON s.id = ud.strategy_id AND ud.status = 'active'
          LEFT JOIN transactions t ON s.id = t.strategy_id AND t.created_at >= CURRENT_DATE
          WHERE s.active = true
          GROUP BY s.id, s.current_apy
          ON CONFLICT (strategy_id, date) DO UPDATE SET
            apy = EXCLUDED.apy,
            tvl = EXCLUDED.tvl,
            users_count = EXCLUDED.users_count,
            deposits_count = EXCLUDED.deposits_count,
            volume = EXCLUDED.volume
        `;

        await db.query(analyticsQuery);

        // Clean expired AI recommendations
        await db.query('DELETE FROM ai_recommendations WHERE expires_at < NOW()');

        // Clean old notifications (older than 30 days)
        await db.query('DELETE FROM notifications WHERE created_at < NOW() - INTERVAL \'30 days\'');

        logger.info('Daily tasks completed successfully');
      } catch (error) {
        logger.error('Daily tasks failed:', error);
      }
    });

    this.jobs.set('daily-tasks', job);
  }

  scheduleWeeklyTasks() {
    const job = cron.schedule('0 0 * * 0', async () => {
      try {
        logger.info('Starting weekly tasks...');

        // Generate weekly user engagement report
        const engagementQuery = `
          SELECT
            COUNT(DISTINCT u.id) as active_users,
            AVG(us.total_deposited) as avg_deposit,
            COUNT(DISTINCT um.user_id) as mission_participants,
            AVG(CASE WHEN um.completed THEN 1.0 ELSE 0.0 END) as completion_rate,
            COUNT(DISTINCT ss.sharer_id) as social_sharers
          FROM users u
          LEFT JOIN user_stats us ON u.id = us.user_id
          LEFT JOIN user_missions um ON u.id = um.user_id AND um.created_at >= NOW() - INTERVAL '7 days'
          LEFT JOIN strategy_shares ss ON u.id = ss.sharer_id AND ss.created_at >= NOW() - INTERVAL '7 days'
          WHERE u.last_seen >= NOW() - INTERVAL '7 days'
        `;

        const engagement = await db.query(engagementQuery);
        await db.set('analytics:weekly:engagement', engagement.rows[0], 604800); // 1 week

        // Update user reputation scores
        const reputationQuery = `
          UPDATE user_stats
          SET
            total_points = total_points + (
              CASE
                WHEN streak_days >= 7 THEN 50
                WHEN total_deposited > 1000 THEN 25
                WHEN referrals_count > 0 THEN 10
                ELSE 5
              END
            ),
            updated_at = NOW()
          WHERE last_activity >= NOW() - INTERVAL '7 days'
        `;

        await db.query(reputationQuery);

        logger.info('Weekly tasks completed successfully');
      } catch (error) {
        logger.error('Weekly tasks failed:', error);
      }
    });

    this.jobs.set('weekly-tasks', job);
  }

  stop() {
    logger.info('Stopping scheduler service...');

    for (const [name, job] of this.jobs.entries()) {
      job.destroy();
      logger.info(`Stopped job: ${name}`);
    }

    this.jobs.clear();
    logger.info('All scheduled jobs stopped');
  }

  getJobStatus() {
    const status = {};
    for (const [name, job] of this.jobs.entries()) {
      status[name] = {
        running: job.getStatus() === 'scheduled',
        nextExecution: job.nextDate()?.toISOString() || null
      };
    }
    return status;
  }
}

module.exports = SchedulerService;