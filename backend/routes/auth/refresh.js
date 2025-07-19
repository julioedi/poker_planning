const express = require('express');
const jwt = require('jsonwebtoken');
const { authenticateToken } = require('../../middleware/auth');

const router = express.Router();

// Refresh token route
router.post('/', authenticateToken, async (req, res) => {
  try {
    // Generate new token
    const token = jwt.sign(
      { 
        userId: req.user.id, 
        email: req.user.email, 
        role: req.user.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Token refreshed successfully',
      token
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 