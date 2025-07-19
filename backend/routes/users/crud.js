const express = require('express');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');
const { body, validationResult } = require('express-validator');
const { db } = require('../../database/init');
const { requireAdmin } = require('../../middleware/auth');

const router = express.Router();

// Get all users (Admin only)
router.get('/', requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', role = '', status = '' } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        id, email, name, role, status, profile_picture, 
        skillset, color_scheme, language, timezone, notifications,
        created_at, updated_at
      FROM users 
      WHERE 1=1
    `;
    let params = [];

    // Add filters
    if (search) {
      query += ` AND (name LIKE ? OR email LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    if (role) {
      query += ` AND role = ?`;
      params.push(role);
    }

    if (status) {
      query += ` AND status = ?`;
      params.push(status);
    }

    // Add pagination
    query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), offset);

    // Get total count
    let countQuery = `SELECT COUNT(*) as total FROM users WHERE 1=1`;
    let countParams = [];

    if (search) {
      countQuery += ` AND (name LIKE ? OR email LIKE ?)`;
      countParams.push(`%${search}%`, `%${search}%`);
    }

    if (role) {
      countQuery += ` AND role = ?`;
      countParams.push(role);
    }

    if (status) {
      countQuery += ` AND status = ?`;
      countParams.push(status);
    }

    db.get(countQuery, countParams, (err, countResult) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      db.all(query, params, (err, users) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

        res.json({
          users,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: countResult.total,
            pages: Math.ceil(countResult.total / limit)
          }
        });
      });
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user by ID (Admin only)
router.get('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Special protection for user ID 1 (admin)
    if (parseInt(id) === 1) {
      return res.status(403).json({ error: 'Cannot access admin user details' });
    }

    db.get(
      'SELECT id, email, name, role, status, profile_picture, skillset, color_scheme, language, timezone, notifications, created_at, updated_at FROM users WHERE id = ?',
      [id],
      (err, user) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

        if (!user) {
          return res.status(404).json({ error: 'User not found' });
        }

        res.json({ user });
      }
    );

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new user (Admin only)
router.post('/', requireAdmin, [
  body('email').isEmail().normalizeEmail(),
  body('name').isLength({ min: 2, max: 100 }),
  body('password').isLength({ min: 6 }),
  body('role').isIn(['user', 'admin']),
  body('status').optional().isIn(['active', 'inactive'])
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

    const { email, name, password, role = 'user', status = 'active' } = req.body;

    // Check if email already exists
    db.get('SELECT id FROM users WHERE email = ?', [email], (err, existingUser) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (existingUser) {
        return res.status(400).json({ error: 'Email already exists' });
      }

      // Hash password
      const hashedPassword = bcrypt.hashSync(password, 10);

      // Create user
      db.run(
        'INSERT INTO users (email, name, password, role, status) VALUES (?, ?, ?, ?, ?)',
        [email, name, hashedPassword, role, status],
        function(err) {
          if (err) {
            return res.status(500).json({ error: 'Failed to create user' });
          }

          // Get the created user
          db.get(
            'SELECT id, email, name, role, status, profile_picture, skillset, color_scheme, language, timezone, notifications, created_at, updated_at FROM users WHERE id = ?',
            [this.lastID],
            (err, user) => {
              if (err) {
                return res.status(500).json({ error: 'Database error' });
              }

              res.status(201).json({
                message: 'User created successfully',
                user
              });
            }
          );
        }
      );
    });

  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user (Admin only)
router.put('/:id', requireAdmin, [
  body('email').optional().isEmail().normalizeEmail(),
  body('name').optional().isLength({ min: 2, max: 100 }),
  body('role').optional().isIn(['user', 'admin']),
  body('status').optional().isIn(['active', 'inactive'])
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

    const { id } = req.params;
    const { email, name, role, status } = req.body;

    // Special protection for user ID 1 (admin)
    if (parseInt(id) === 1) {
      return res.status(403).json({ error: 'Cannot modify admin user' });
    }

    // Check if user exists
    db.get('SELECT id FROM users WHERE id = ?', [id], (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Check if email is being changed and if it already exists
      if (email) {
        db.get('SELECT id FROM users WHERE email = ? AND id != ?', [email, id], (err, existingUser) => {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }

          if (existingUser) {
            return res.status(400).json({ error: 'Email already exists' });
          }

          updateUser();
        });
      } else {
        updateUser();
      }

      function updateUser() {
        // Build update query
        let updateQuery = 'UPDATE users SET updated_at = CURRENT_TIMESTAMP';
        let params = [];

        if (email) {
          updateQuery += ', email = ?';
          params.push(email);
        }

        if (name) {
          updateQuery += ', name = ?';
          params.push(name);
        }

        if (role) {
          updateQuery += ', role = ?';
          params.push(role);
        }

        if (status) {
          updateQuery += ', status = ?';
          params.push(status);
        }

        updateQuery += ' WHERE id = ?';
        params.push(id);

        // Update user
        db.run(updateQuery, params, function(err) {
          if (err) {
            return res.status(500).json({ error: 'Failed to update user' });
          }

          // Get the updated user
          db.get(
            'SELECT id, email, name, role, status, profile_picture, skillset, color_scheme, language, timezone, notifications, created_at, updated_at FROM users WHERE id = ?',
            [id],
            (err, updatedUser) => {
              if (err) {
                return res.status(500).json({ error: 'Database error' });
              }

              res.json({
                message: 'User updated successfully',
                user: updatedUser
              });
            }
          );
        });
      }
    });

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete user (Admin only)
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Special protection for user ID 1 (admin)
    if (parseInt(id) === 1) {
      return res.status(403).json({ error: 'Cannot delete admin user' });
    }

    // Check if user exists
    db.get('SELECT id, profile_picture FROM users WHERE id = ?', [id], (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Delete profile picture if it exists
      if (user.profile_picture) {
        const filePath = path.join(__dirname, '../../uploads', user.profile_picture);
        if (fs.existsSync(filePath)) {
          fs.unlink(filePath, (err) => {
            if (err) {
              console.error('Error deleting profile picture:', err);
              // Continue with user deletion even if picture deletion fails
            } else {
              console.log('Profile picture deleted:', user.profile_picture);
            }
          });
        }
      }

      // Delete user
      db.run('DELETE FROM users WHERE id = ?', [id], function(err) {
        if (err) {
          return res.status(500).json({ error: 'Failed to delete user' });
        }

        res.json({ message: 'User deleted successfully' });
      });
    });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 