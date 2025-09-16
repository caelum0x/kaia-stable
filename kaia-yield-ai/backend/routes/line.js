const express = require('express');
const router = express.Router();

router.post('/webhook', (req, res) => {
  res.json({ success: true });
});

router.get('/profile/:userId', (req, res) => {
  res.json({
    success: true,
    data: { userId: req.params.userId, displayName: 'User' }
  });
});

module.exports = router;