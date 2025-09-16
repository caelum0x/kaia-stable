const express = require('express');
const router = express.Router();

// Simple routes for MVP
router.get('/missions', (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 1, name: 'First Deposit', reward: 100, progress: 0 },
      { id: 2, name: 'Yield Explorer', reward: 250, progress: 0 }
    ]
  });
});

router.get('/leaderboard', (req, res) => {
  res.json({
    success: true,
    data: []
  });
});

module.exports = router;