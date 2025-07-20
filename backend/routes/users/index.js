const express = require('express');
const crudRoutes = require('./crud');
const profileRoutes = require('./profile');
const settingsRoutes = require('./settings');

const router = express.Router();

// Mount specific routes first (before generic ones)
// Mount profile routes - these handle profile-specific operations
router.use('/profile', profileRoutes);

// Mount settings routes - these handle user settings
router.use('/settings', settingsRoutes);

// Mount CRUD routes (admin operations) - these handle the main user routes
// This must be last to avoid conflicts with specific routes
router.use('/', crudRoutes);

module.exports = router; 