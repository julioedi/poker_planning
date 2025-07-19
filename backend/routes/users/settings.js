const express = require('express');
const { body, validationResult } = require('express-validator');
const { db } = require('../../database/init');
const { authenticateToken } = require('../../middleware/auth');

const router = express.Router();

// Get user settings
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    db.get(
      'SELECT skillset, color_scheme, language, timezone, notifications FROM users WHERE id = ?',
      [userId],
      (err, settings) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

        if (!settings) {
          return res.status(404).json({ error: 'User not found' });
        }

        res.json({ settings });
      }
    );

  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user settings
router.put('/', authenticateToken, [
  body('skillset').optional().isLength({ max: 500 }),
  body('color_scheme').optional().isIn(['light', 'dark']),
  body('language').optional().isLength({ max: 10 }),
  body('timezone').optional().isLength({ max: 50 }),
  body('notifications').optional().isBoolean()
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

    const { skillset, color_scheme, language, timezone, notifications } = req.body;
    const userId = req.user.id;

    // Check if user exists
    db.get('SELECT id FROM users WHERE id = ?', [userId], (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Build update query
      let updateQuery = 'UPDATE users SET updated_at = CURRENT_TIMESTAMP';
      let params = [];

      if (skillset !== undefined) {
        updateQuery += ', skillset = ?';
        params.push(skillset);
      }

      if (color_scheme !== undefined) {
        updateQuery += ', color_scheme = ?';
        params.push(color_scheme);
      }

      if (language !== undefined) {
        updateQuery += ', language = ?';
        params.push(language);
      }

      if (timezone !== undefined) {
        updateQuery += ', timezone = ?';
        params.push(timezone);
      }

      if (notifications !== undefined) {
        updateQuery += ', notifications = ?';
        params.push(notifications);
      }

      updateQuery += ' WHERE id = ?';
      params.push(userId);

      // Update user settings
      db.run(updateQuery, params, function(err) {
        if (err) {
          return res.status(500).json({ error: 'Failed to update settings' });
        }

        // Get the updated settings
        db.get(
          'SELECT skillset, color_scheme, language, timezone, notifications FROM users WHERE id = ?',
          [userId],
          (err, updatedSettings) => {
            if (err) {
              return res.status(500).json({ error: 'Database error' });
            }

            res.json({
              message: 'Settings updated successfully',
              settings: updatedSettings
            });
          }
        );
      });
    });

  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 