const express = require('express');
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { db } = require('../database/init');
const { requireAdmin, authenticateToken } = require('../middleware/auth');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Check file type
  if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/webp') {
    cb(null, true);
  } else {
    cb(new Error('Only JPG and WebP files are allowed'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

const router = express.Router();

// Get all users
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', role = '', status = '' } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT id, email, name, role, status, profile_picture, created_at, updated_at
      FROM users
      WHERE 1=1
    `;
    let params = [];

    // Add search filter
    if (search) {
      query += ` AND (name LIKE ? OR email LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    // Add role filter
    if (role) {
      query += ` AND role = ?`;
      params.push(role);
    }

    // Add status filter
    if (status) {
      query += ` AND status = ?`;
      params.push(status);
    }

    // Add pagination
    query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), offset);

    // Get total count
    let countQuery = `
      SELECT COUNT(*) as total
      FROM users
      WHERE 1=1
    `;
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

// Get user by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    db.get(
      'SELECT id, email, name, role, status, profile_picture, created_at, updated_at FROM users WHERE id = ?',
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
  body('role').isIn(['user', 'admin', 'product_owner', 'product_manager']),
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

    const { email, name, password, role, status = 'active' } = req.body;

    // Check if user already exists
    db.get('SELECT id FROM users WHERE email = ?', [email], (err, existingUser) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (existingUser) {
        return res.status(400).json({ error: 'User with this email already exists' });
      }

      // Hash password
      const bcrypt = require('bcryptjs');
      bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) {
          return res.status(500).json({ error: 'Password hashing failed' });
        }

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
              'SELECT id, email, name, role, status, profile_picture, created_at FROM users WHERE id = ?',
              [this.lastID],
              (err, newUser) => {
                if (err) {
                  return res.status(500).json({ error: 'Database error' });
                }

                res.status(201).json({
                  message: 'User created successfully',
                  user: newUser
                });
              }
            );
          }
        );
      });
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
  body('role').optional().isIn(['user', 'admin', 'product_owner', 'product_manager']),
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

    // Protect user ID 0 - only super admin can modify it
    if (parseInt(id) === 0) {
      if (req.user.id !== 0) {
        return res.status(403).json({ error: 'Only super admin can modify this user' });
      }
      // Prevent role change for user ID 0
      if (role && role !== 'admin') {
        return res.status(400).json({ error: 'Super admin role cannot be changed' });
      }
    }

    // Check if user exists
    db.get('SELECT id FROM users WHERE id = ?', [id], (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

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
          'SELECT id, email, name, role, status, profile_picture, created_at, updated_at FROM users WHERE id = ?',
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
    });

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Upload profile picture
router.post('/profile/picture', authenticateToken, upload.single('profile_picture'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const userId = req.user.id;
    const filename = req.file.filename;

    // Update user's profile picture in database
    db.run(
      'UPDATE users SET profile_picture = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [filename, userId],
      function(err) {
        if (err) {
          return res.status(500).json({ error: 'Failed to update profile picture' });
        }

        res.json({
          message: 'Profile picture uploaded successfully',
          filename: filename,
          url: `/uploads/${filename}`
        });
      }
    );

  } catch (error) {
    console.error('Upload profile picture error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update current user profile
router.put('/profile', authenticateToken, [
  body('email').optional().isEmail().normalizeEmail(),
  body('name').optional().isLength({ min: 2, max: 100 }),
  body('currentPassword').optional().isLength({ min: 6 }),
  body('newPassword').optional().isLength({ min: 6 })
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

    const { email, name, currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    // Check if user exists
    db.get('SELECT id, email, name, password FROM users WHERE id = ?', [userId], (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // If changing password, verify current password
      if (newPassword) {
        if (!currentPassword) {
          return res.status(400).json({ error: 'Current password is required to change password' });
        }

        const bcrypt = require('bcryptjs');
        const isValidPassword = bcrypt.compareSync(currentPassword, user.password);
        
        if (!isValidPassword) {
          return res.status(400).json({ error: 'Current password is incorrect' });
        }
      }

      // Check if email is being changed and if it already exists
      if (email && email !== user.email) {
        db.get('SELECT id FROM users WHERE email = ? AND id != ?', [email, userId], (err, existingUser) => {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }

          if (existingUser) {
            return res.status(400).json({ error: 'Email already exists' });
          }

          updateUserProfile();
        });
      } else {
        updateUserProfile();
      }

      function updateUserProfile() {
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

        if (newPassword) {
          const bcrypt = require('bcryptjs');
          const hashedPassword = bcrypt.hashSync(newPassword, 10);
          updateQuery += ', password = ?';
          params.push(hashedPassword);
        }

        updateQuery += ' WHERE id = ?';
        params.push(userId);

        // Update user
        db.run(updateQuery, params, function(err) {
          if (err) {
            return res.status(500).json({ error: 'Failed to update profile' });
          }

          // Get the updated user
          db.get(
            'SELECT id, email, name, role, status, profile_picture, created_at, updated_at FROM users WHERE id = ?',
            [userId],
            (err, updatedUser) => {
              if (err) {
                return res.status(500).json({ error: 'Database error' });
              }

              res.json({
                message: 'Profile updated successfully',
                user: updatedUser
              });
            }
          );
        });
      }
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete user (Admin only)
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Protect user ID 0 - cannot be deleted
    if (parseInt(id) === 0) {
      return res.status(403).json({ error: 'Super admin user cannot be deleted' });
    }

    // Check if user exists
    db.get('SELECT id FROM users WHERE id = ?', [id], (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
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