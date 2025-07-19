const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const { db } = require('../../database/init');
const { authenticateToken } = require('../../middleware/auth');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../../uploads');
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

// Get current user profile
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('Profile request - User ID:', userId);

    db.get(
      'SELECT id, email, name, role, status, profile_picture, skillset, color_scheme, language, timezone, notifications, created_at, updated_at FROM users WHERE id = ?',
      [userId],
      (err, user) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ error: 'Database error' });
        }

        if (!user) {
          console.log('User not found for ID:', userId);
          return res.status(404).json({ error: 'User not found' });
        }

        console.log('User found:', user.id, user.email);
        res.json({ user });
      }
    );

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Upload profile picture
router.post('/picture', authenticateToken, upload.single('profile_picture'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const userId = req.user.id;
    const filename = req.file.filename;

    // First, get the current user to check if they have an existing profile picture
    db.get('SELECT profile_picture FROM users WHERE id = ?', [userId], (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Delete old profile picture if it exists
      if (user.profile_picture) {
        const oldFilePath = path.join(__dirname, '../../uploads', user.profile_picture);
        if (fs.existsSync(oldFilePath)) {
          fs.unlink(oldFilePath, (err) => {
            if (err) {
              console.error('Error deleting old profile picture:', err);
              // Continue with the update even if deletion fails
            } else {
              console.log('Old profile picture deleted:', user.profile_picture);
            }
          });
        }
      }

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
    });

  } catch (error) {
    console.error('Upload profile picture error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update current user profile
router.put('/', authenticateToken, [
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
    
    console.log('PUT Profile request - User ID:', userId);
    console.log('Request body:', req.body);

    // Check if user exists
    db.get('SELECT id, email, name, password FROM users WHERE id = ?', [userId], (err, user) => {
      if (err) {
        console.error('Database error in PUT profile:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      if (!user) {
        console.log('User not found for ID in PUT profile:', userId);
        return res.status(404).json({ error: 'User not found' });
      }
      
      console.log('User found in PUT profile:', user.id, user.email);

      // If changing password, verify current password
      if (newPassword) {
        if (!currentPassword) {
          return res.status(400).json({ error: 'Current password is required to change password' });
        }

        const isValidPassword = bcrypt.compareSync(currentPassword, user.password);
        
        if (!isValidPassword) {
          return res.status(400).json({ error: 'Current password is incorrect' });
        }
      }

      // Check if email is being changed and if it already exists
      if (email && email !== user.email) {
        db.get('SELECT id FROM users WHERE email = ? AND id != ?', [email, userId], (err, existingUser) => {
          if (err) {
            console.error('Email check error:', err);
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
        console.log('Updating user profile...');
        
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
          const hashedPassword = bcrypt.hashSync(newPassword, 10);
          updateQuery += ', password = ?';
          params.push(hashedPassword);
        }

        updateQuery += ' WHERE id = ?';
        params.push(userId);

        console.log('Update query:', updateQuery);
        console.log('Update params:', params);

        // Update user
        db.run(updateQuery, params, function(err) {
          if (err) {
            console.error('Update error:', err);
            return res.status(500).json({ error: 'Failed to update profile' });
          }

          console.log('User updated successfully, rows affected:', this.changes);

          // Get the updated user
          db.get(
            'SELECT id, email, name, role, status, profile_picture, skillset, color_scheme, language, timezone, notifications, created_at, updated_at FROM users WHERE id = ?',
            [userId],
            (err, updatedUser) => {
              if (err) {
                console.error('Get updated user error:', err);
                return res.status(500).json({ error: 'Database error' });
              }

              console.log('Updated user retrieved:', updatedUser?.id, updatedUser?.email);
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

module.exports = router; 