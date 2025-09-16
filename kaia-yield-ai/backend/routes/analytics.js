const express = require('express');
const router = express.Router();

router.get('/metrics', (req, res) => {
  res.json({
    success: true,
    data: {
      tvl: 1000000,
      users: 150,
      transactions: 500
    }
  });
});

module.exports = router;