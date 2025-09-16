const express = require('express');
const router = express.Router();

router.get('/portfolio/:address', (req, res) => {
  res.json({
    success: true,
    data: {
      summary: { totalDeposited: '0', totalRewards: '0', activePositions: 0 },
      positions: []
    }
  });
});

router.post('/calculate', (req, res) => {
  const { amount, strategyId } = req.body;
  const apy = 1200; // 12% default
  const projectedRewards = (parseFloat(amount) * apy / 10000 / 365 * 30).toFixed(6);
  
  res.json({
    success: true,
    data: {
      projectedRewards,
      apy: apy / 100,
      duration: 30
    }
  });
});

module.exports = router;