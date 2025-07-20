const express = require('express');
const { authenticateToken } = require('../../middleware/auth');

const router = express.Router();

// Get current user route
router.get('/', authenticateToken, async (req, res) => {
  try {
    res.json({
      user: req.user
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 