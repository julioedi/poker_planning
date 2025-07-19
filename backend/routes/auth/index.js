const express = require('express');
const loginRouter = require('./login');
const registerRouter = require('./register');
const meRouter = require('./me');
const refreshRouter = require('./refresh');
const logoutRouter = require('./logout');

const router = express.Router();

// Mount auth routes
router.use('/login', loginRouter);
router.use('/register', registerRouter);
router.use('/me', meRouter);
router.use('/refresh', refreshRouter);
router.use('/logout', logoutRouter);

module.exports = router; 