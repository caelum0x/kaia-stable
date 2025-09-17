const express = require('express');
const router = express.Router();
const { db } = require('../database/connection');

// Get social strategies with filtering
router.get('/strategies', async (req, res) => {
  try {
    const { riskLevel, category, minAPY, maxAPY, sort = 'apy' } = req.query;

    let query = `
      SELECT
        ys.id,
        ys.name,
        ys.description,
        ys.apy,
        ys.risk_level as risk,
        ys.category,
        ys.active as isActive,
        ys.created_at as createdAt,
        ys.updated_at as updatedAt,
        ys.is_public as isPublic,
        u.address as userId,
        u.display_name as userName,
        u.is_verified as verified,
        COUNT(DISTINCT f.follower_id) as followers,
        COUNT(DISTINCT c.user_id) as copiers,
        AVG(r.rating) as performance,
        COUNT(DISTINCT l.user_id) as likes,
        COUNT(DISTINCT cm.id) as comments,
        '30d' as timeframe,
        array_agg(DISTINCT t.name) FILTER (WHERE t.name IS NOT NULL) as tags
      FROM yield_strategies ys
      JOIN users u ON ys.user_id = u.id
      LEFT JOIN strategy_followers f ON ys.id = f.strategy_id
      LEFT JOIN strategy_copies c ON ys.id = c.strategy_id AND c.is_active = true
      LEFT JOIN strategy_ratings r ON ys.id = r.strategy_id
      LEFT JOIN strategy_likes l ON ys.id = l.strategy_id
      LEFT JOIN strategy_comments cm ON ys.id = cm.strategy_id
      LEFT JOIN strategy_tags st ON ys.id = st.strategy_id
      LEFT JOIN tags t ON st.tag_id = t.id
      WHERE ys.is_social = true AND ys.active = true
    `;

    const params = [];
    let paramIndex = 1;

    if (riskLevel && riskLevel !== 'all') {
      if (riskLevel === 'low') {
        query += ` AND ys.risk_level <= 3`;
      } else if (riskLevel === 'medium') {
        query += ` AND ys.risk_level > 3 AND ys.risk_level <= 6`;
      } else if (riskLevel === 'high') {
        query += ` AND ys.risk_level > 6`;
      }
    }

    if (category) {
      query += ` AND ys.category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    if (minAPY) {
      query += ` AND ys.apy >= $${paramIndex}`;
      params.push(parseFloat(minAPY));
      paramIndex++;
    }

    if (maxAPY) {
      query += ` AND ys.apy <= $${paramIndex}`;
      params.push(parseFloat(maxAPY));
      paramIndex++;
    }

    query += `
      GROUP BY ys.id, u.address, u.display_name, u.is_verified
    `;

    // Add sorting
    switch (sort) {
      case 'performance':
        query += ' ORDER BY performance DESC NULLS LAST';
        break;
      case 'followers':
        query += ' ORDER BY followers DESC';
        break;
      case 'recent':
        query += ' ORDER BY ys.created_at DESC';
        break;
      default:
        query += ' ORDER BY ys.apy DESC';
    }

    const strategies = await db.query(query, params);

    // Format the response
    const formattedStrategies = strategies.rows.map(strategy => ({
      ...strategy,
      tags: strategy.tags || [],
      timeframe: strategy.timeframe || '30d',
      followers: parseInt(strategy.followers || 0),
      copiers: parseInt(strategy.copiers || 0),
      likes: parseInt(strategy.likes || 0),
      comments: parseInt(strategy.comments || 0),
      performance: parseFloat(strategy.performance || 0).toFixed(1)
    }));

    res.json({
      success: true,
      data: formattedStrategies
    });

  } catch (error) {
    console.error('Social strategies error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch social strategies'
    });
  }
});

// Get social feed
router.get('/feed', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const feedQuery = `
      SELECT
        sp.id,
        sp.content,
        sp.created_at as timestamp,
        u.address as userId,
        u.display_name as userName,
        u.avatar_url as userAvatar,
        ys.id as strategyId,
        ys.name as strategyName,
        ys.apy as performance,
        COUNT(DISTINCT spl.user_id) as likes,
        COUNT(DISTINCT spc.id) as comments,
        COUNT(DISTINCT sps.user_id) as shares,
        EXISTS(SELECT 1 FROM social_post_likes spl2 WHERE spl2.post_id = sp.id AND spl2.user_id = $3) as isLiked
      FROM social_posts sp
      JOIN users u ON sp.user_id = u.id
      LEFT JOIN yield_strategies ys ON sp.strategy_id = ys.id
      LEFT JOIN social_post_likes spl ON sp.id = spl.post_id
      LEFT JOIN social_post_comments spc ON sp.id = spc.post_id
      LEFT JOIN social_post_shares sps ON sp.id = sps.post_id
      WHERE sp.is_active = true
      GROUP BY sp.id, u.address, u.display_name, u.avatar_url, ys.id, ys.name, ys.apy
      ORDER BY sp.created_at DESC
      LIMIT $1 OFFSET $2
    `;

    const totalQuery = 'SELECT COUNT(*) FROM social_posts WHERE is_active = true';

    const [posts, total] = await Promise.all([
      db.query(feedQuery, [limit, offset, null]), // userId would be passed from auth
      db.query(totalQuery)
    ]);

    const formattedPosts = posts.rows.map(post => ({
      id: post.id,
      userId: post.userid,
      userName: post.username,
      userAvatar: post.useravatar || '👤',
      content: post.content,
      strategyId: post.strategyid,
      strategyName: post.strategyname,
      performance: parseFloat(post.performance || 0),
      timestamp: post.timestamp,
      likes: parseInt(post.likes || 0),
      comments: parseInt(post.comments || 0),
      shares: parseInt(post.shares || 0),
      isLiked: post.isliked || false
    }));

    const totalPosts = parseInt(total.rows[0].count);
    const totalPages = Math.ceil(totalPosts / limit);

    res.json({
      success: true,
      data: {
        posts: formattedPosts,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalPosts,
          pages: totalPages
        }
      }
    });

  } catch (error) {
    console.error('Social feed error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch social feed'
    });
  }
});

// Like a post
router.post('/posts/:postId/like', async (req, res) => {
  try {
    const { postId } = req.params;
    // Note: In real implementation, userId would come from auth middleware
    const userId = req.body.userId || 1;

    // Check if already liked
    const existingLike = await db.query(
      'SELECT id FROM social_post_likes WHERE post_id = $1 AND user_id = $2',
      [postId, userId]
    );

    if (existingLike.rows.length > 0) {
      // Unlike
      await db.query(
        'DELETE FROM social_post_likes WHERE post_id = $1 AND user_id = $2',
        [postId, userId]
      );
    } else {
      // Like
      await db.query(
        'INSERT INTO social_post_likes (post_id, user_id, created_at) VALUES ($1, $2, NOW())',
        [postId, userId]
      );
    }

    // Get updated like count
    const likeCount = await db.query(
      'SELECT COUNT(*) FROM social_post_likes WHERE post_id = $1',
      [postId]
    );

    res.json({
      success: true,
      data: {
        likes: parseInt(likeCount.rows[0].count)
      }
    });

  } catch (error) {
    console.error('Like post error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to like post'
    });
  }
});

// Share a post
router.post('/posts/:postId/share', async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.body.userId || 1;

    // Record the share
    await db.query(
      'INSERT INTO social_post_shares (post_id, user_id, created_at) VALUES ($1, $2, NOW())',
      [postId, userId]
    );

    // Get updated share count
    const shareCount = await db.query(
      'SELECT COUNT(*) FROM social_post_shares WHERE post_id = $1',
      [postId]
    );

    res.json({
      success: true,
      data: {
        shares: parseInt(shareCount.rows[0].count)
      }
    });

  } catch (error) {
    console.error('Share post error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to share post'
    });
  }
});

// Follow a strategy
router.post('/strategies/:strategyId/follow', async (req, res) => {
  try {
    const { strategyId } = req.params;
    const userId = req.body.userId || 1;

    // Check if already following
    const existingFollow = await db.query(
      'SELECT id FROM strategy_followers WHERE strategy_id = $1 AND follower_id = $2',
      [strategyId, userId]
    );

    if (existingFollow.rows.length > 0) {
      res.json({
        success: true,
        data: { message: 'Already following this strategy' }
      });
      return;
    }

    // Add follow
    await db.query(
      'INSERT INTO strategy_followers (strategy_id, follower_id, created_at) VALUES ($1, $2, NOW())',
      [strategyId, userId]
    );

    res.json({
      success: true,
      data: { message: 'Successfully followed strategy' }
    });

  } catch (error) {
    console.error('Follow strategy error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to follow strategy'
    });
  }
});

// Copy a strategy
router.post('/strategies/:strategyId/copy', async (req, res) => {
  try {
    const { strategyId } = req.params;
    const { amount } = req.body;
    const userId = req.body.userId || 1;

    // Create strategy copy record
    const copyResult = await db.query(
      `INSERT INTO strategy_copies (strategy_id, user_id, amount, created_at, is_active)
       VALUES ($1, $2, $3, NOW(), true)
       RETURNING id`,
      [strategyId, userId, amount]
    );

    const copyId = copyResult.rows[0].id;

    // In a real implementation, this would trigger the actual strategy copying logic
    // For now, we'll just record the copy

    res.json({
      success: true,
      data: {
        message: 'Strategy copied successfully',
        copyId: copyId.toString()
      }
    });

  } catch (error) {
    console.error('Copy strategy error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to copy strategy'
    });
  }
});

module.exports = router;