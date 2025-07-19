const jwt = require('jsonwebtoken');
const { dbUtils } = require('../database/init');

// Middleware to authenticate JWT token
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database
    const user = await dbUtils.getUserById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    if (user.status !== 'active') {
      return res.status(401).json({ error: 'User account is not active' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    return res.status(500).json({ error: 'Token verification failed' });
  }
};

// Middleware to check if user has admin role
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Middleware to check if user is PO or PM of a project
const requireProjectAccess = (req, res, next) => {
  const { projectId } = req.params;
  
  if (!projectId) {
    return res.status(400).json({ error: 'Project ID required' });
  }

  // Check if user is admin
  if (req.user.role === 'admin') {
    return next();
  }

  // Check if user is PO or PM of the project
  const { db } = require('../database/init');
  db.get(
    `SELECT pm.role 
     FROM project_members pm 
     WHERE pm.project_id = ? AND pm.user_id = ? AND pm.role IN ('product_owner', 'product_manager')`,
    [projectId, req.user.id],
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (!row) {
        return res.status(403).json({ error: 'Access denied. Must be Product Owner or Product Manager of this project.' });
      }
      
      next();
    }
  );
};

// Middleware to check if user is member of a project
const requireProjectMembership = (req, res, next) => {
  const { projectId } = req.params;
  
  if (!projectId) {
    return res.status(400).json({ error: 'Project ID required' });
  }

  // Check if user is admin
  if (req.user.role === 'admin') {
    return next();
  }

  // Check if user is member of the project
  const { db } = require('../database/init');
  db.get(
    'SELECT id FROM project_members WHERE project_id = ? AND user_id = ?',
    [projectId, req.user.id],
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (!row) {
        return res.status(403).json({ error: 'Access denied. Must be a member of this project.' });
      }
      
      next();
    }
  );
};

module.exports = {
  authenticateToken,
  requireAdmin,
  requireProjectAccess,
  requireProjectMembership
}; 