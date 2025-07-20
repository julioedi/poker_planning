const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { dbUtils } = require('../../database/init');

const router = express.Router();

// Register route
router.post('/', [
  body('email').isEmail().normalizeEmail(),
  body('name').isLength({ min: 2, max: 100 }),
  body('password').isLength({ min: 6 }),
  body('role').optional().isIn(['user', 'admin'])
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const { email, name, password, role = 'user' } = req.body;

    // Check if user already exists
    const existingUser = await dbUtils.getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Create new user
    const userId = await dbUtils.createUser({
      email,
      name,
      password,
      role
    });

    // Get the created user
    const newUser = await dbUtils.getUserById(userId);

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: newUser.id, 
        email: newUser.email, 
        role: newUser.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      user: newUser,
      token
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 