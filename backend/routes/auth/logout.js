const express = require('express');
const { authenticateToken } = require('../../middleware/auth');

const router = express.Router();

// Logout route (client-side token removal)
router.post('/', authenticateToken, (req, res) => {
  res.json({ message: 'Logout successful' });
});

module.exports = router; 