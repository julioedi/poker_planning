const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

const router = express.Router();
const dbPath = path.join(__dirname, '../database/pokerplanning.db');
const db = new sqlite3.Database(dbPath);

// GET /api/team - Get all team members with pagination
router.get('/', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;
  const search = req.query.search || '';

  // Build the WHERE clause for search
  let whereClause = '';
  let params = [];
  
  if (search) {
    whereClause = 'WHERE u.name LIKE ? OR u.email LIKE ?';
    params = [`%${search}%`, `%${search}%`];
  }

  // Get total count for pagination
  const countQuery = `
    SELECT COUNT(*) as total 
    FROM users u 
    ${whereClause}
  `;

  db.get(countQuery, params, (err, countResult) => {
    if (err) {
      console.error('Error getting team count:', err);
      return res.status(500).json({ error: 'Failed to get team count' });
    }

    const total = countResult.total;
    const totalPages = Math.ceil(total / limit);

    // Get team members with pagination
    const query = `
      SELECT 
        u.id,
        u.name,
        u.email,
        u.role,
        u.status,
        u.profile_picture,
        u.skillset,
        u.created_at,
        u.updated_at,
        COUNT(DISTINCT pm.project_id) as project_count,
        COUNT(DISTINCT pp.planning_id) as session_count
      FROM users u
      LEFT JOIN project_members pm ON u.id = pm.user_id
      LEFT JOIN planning_participants pp ON u.id = pp.user_id
      ${whereClause}
      GROUP BY u.id
      ORDER BY u.name ASC
      LIMIT ? OFFSET ?
    `;

    const queryParams = [...params, limit, offset];

    db.all(query, queryParams, (err, rows) => {
      if (err) {
        console.error('Error getting team members:', err);
        return res.status(500).json({ error: 'Failed to get team members' });
      }

      // Format the response
      const teamMembers = rows.map(member => ({
        id: member.id,
        name: member.name,
        email: member.email,
        role: member.role,
        status: member.status,
        profile_picture: member.profile_picture,
        skillset: member.skillset ? JSON.parse(member.skillset) : [],
        project_count: member.project_count,
        session_count: member.session_count,
        created_at: member.created_at,
        updated_at: member.updated_at
      }));

      res.json({
        team_members: teamMembers,
        pagination: {
          page,
          limit,
          total,
          total_pages: totalPages,
          has_next: page < totalPages,
          has_prev: page > 1
        }
      });
    });
  });
});

// POST /api/team - Create new team member
router.post('/', (req, res) => {
  const { name, email, password, role, status } = req.body;

  // Validate required fields
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }

  // Check if email already exists
  db.get('SELECT id FROM users WHERE email = ?', [email], (err, row) => {
    if (err) {
      console.error('Error checking email:', err);
      return res.status(500).json({ error: 'Failed to check email' });
    }

    if (row) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    // Hash password
    bcrypt.hash(password, 10, (err, hashedPassword) => {
      if (err) {
        console.error('Error hashing password:', err);
        return res.status(500).json({ error: 'Failed to hash password' });
      }

      // Insert new user
      const insertQuery = `
        INSERT INTO users (name, email, password, role, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `;

      db.run(insertQuery, [name, email, hashedPassword, role || 'user', status || 'active'], function(err) {
        if (err) {
          console.error('Error creating user:', err);
          return res.status(500).json({ error: 'Failed to create user' });
        }

        // Get the created user
        db.get('SELECT id, name, email, role, status, created_at FROM users WHERE id = ?', [this.lastID], (err, user) => {
          if (err) {
            console.error('Error getting created user:', err);
            return res.status(500).json({ error: 'Failed to get created user' });
          }

          res.status(201).json({
            message: 'Team member created successfully',
            user: {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role,
              status: user.status,
              created_at: user.created_at
            }
          });
        });
      });
    });
  });
});

// GET /api/team/:id - Get specific team member
router.get('/:id', (req, res) => {
  const userId = req.params.id;

  const query = `
    SELECT 
      u.id,
      u.name,
      u.email,
      u.role,
      u.status,
      u.profile_picture,
      u.skillset,
      u.color_scheme,
      u.language,
      u.timezone,
      u.notifications,
      u.created_at,
      u.updated_at,
      COUNT(DISTINCT pm.project_id) as project_count,
      COUNT(DISTINCT pp.planning_id) as session_count
    FROM users u
    LEFT JOIN project_members pm ON u.id = pm.user_id
    LEFT JOIN planning_participants pp ON u.id = pp.user_id
    WHERE u.id = ?
    GROUP BY u.id
  `;

  db.get(query, [userId], (err, row) => {
    if (err) {
      console.error('Error getting team member:', err);
      return res.status(500).json({ error: 'Failed to get team member' });
    }

    if (!row) {
      return res.status(404).json({ error: 'Team member not found' });
    }

    // Get user's projects
    const projectsQuery = `
      SELECT 
        p.id,
        p.name,
        p.description,
        pm.role as member_role,
        p.created_at
      FROM projects p
      JOIN project_members pm ON p.id = pm.project_id
      WHERE pm.user_id = ?
      ORDER BY p.created_at DESC
    `;

    db.all(projectsQuery, [userId], (err, projects) => {
      if (err) {
        console.error('Error getting user projects:', err);
        return res.status(500).json({ error: 'Failed to get user projects' });
      }

      // Get user's recent sessions
      const sessionsQuery = `
        SELECT 
          pp.id as planning_id,
          pp.title,
          pp.room_code,
          pp.status,
          pp.created_at
        FROM poker_planning pp
        JOIN planning_participants ppp ON pp.id = ppp.planning_id
        WHERE ppp.user_id = ?
        ORDER BY pp.created_at DESC
        LIMIT 5
      `;

      db.all(sessionsQuery, [userId], (err, sessions) => {
        if (err) {
          console.error('Error getting user sessions:', err);
          return res.status(500).json({ error: 'Failed to get user sessions' });
        }

        const teamMember = {
          id: row.id,
          name: row.name,
          email: row.email,
          role: row.role,
          status: row.status,
          profile_picture: row.profile_picture,
          skillset: row.skillset ? JSON.parse(row.skillset) : [],
          color_scheme: row.color_scheme,
          language: row.language,
          timezone: row.timezone,
          notifications: row.notifications,
          project_count: row.project_count,
          session_count: row.session_count,
          created_at: row.created_at,
          updated_at: row.updated_at,
          projects: projects,
          recent_sessions: sessions
        };

        res.json(teamMember);
      });
    });
  });
});

// PUT /api/team/:id - Update team member
router.put('/:id', (req, res) => {
  const userId = req.params.id;
  const { name, email, password, role, status } = req.body;

  // Check if user exists
  db.get('SELECT id FROM users WHERE id = ?', [userId], (err, row) => {
    if (err) {
      console.error('Error checking user:', err);
      return res.status(500).json({ error: 'Failed to check user' });
    }

    if (!row) {
      return res.status(404).json({ error: 'Team member not found' });
    }

    // Build update query
    const updates = [];
    const params = [];

    if (name !== undefined) {
      updates.push('name = ?');
      params.push(name);
    }

    if (email !== undefined) {
      updates.push('email = ?');
      params.push(email);
    }

    if (password !== undefined && password.trim() !== '') {
      // Hash the new password
      bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) {
          console.error('Error hashing password:', err);
          return res.status(500).json({ error: 'Failed to hash password' });
        }

        updates.push('password = ?');
        params.push(hashedPassword);
        completeUpdate();
      });
      return; // Exit early, completeUpdate will be called after hashing
    }

    if (role !== undefined) {
      updates.push('role = ?');
      params.push(role);
    }

    if (status !== undefined) {
      updates.push('status = ?');
      params.push(status);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(userId);

    completeUpdate();

    function completeUpdate() {
      const query = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;

      db.run(query, params, function(err) {
        if (err) {
          console.error('Error updating team member:', err);
          return res.status(500).json({ error: 'Failed to update team member' });
        }

        res.json({ 
          message: 'Team member updated successfully',
          affected_rows: this.changes
        });
      });
    }
  });
});

// DELETE /api/team/:id - Delete team member (soft delete by setting status to inactive)
router.delete('/:id', (req, res) => {
  const userId = req.params.id;

  // Check if user exists and is not the admin
  db.get('SELECT id, role FROM users WHERE id = ?', [userId], (err, row) => {
    if (err) {
      console.error('Error checking user:', err);
      return res.status(500).json({ error: 'Failed to check user' });
    }

    if (!row) {
      return res.status(404).json({ error: 'Team member not found' });
    }

    if (row.role === 'admin') {
      return res.status(403).json({ error: 'Cannot delete admin user' });
    }

    // Soft delete by setting status to inactive
    db.run('UPDATE users SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', 
      ['inactive', userId], function(err) {
      if (err) {
        console.error('Error deleting team member:', err);
        return res.status(500).json({ error: 'Failed to delete team member' });
      }

      res.json({ 
        message: 'Team member deleted successfully',
        affected_rows: this.changes
      });
    });
  });
});

// GET /api/team/stats - Get team statistics
router.get('/stats/overview', (req, res) => {
  const queries = {
    total_members: 'SELECT COUNT(*) as count FROM users WHERE status = "active"',
    active_members: 'SELECT COUNT(*) as count FROM users WHERE status = "active"',
    inactive_members: 'SELECT COUNT(*) as count FROM users WHERE status = "inactive"',
    admin_count: 'SELECT COUNT(*) as count FROM users WHERE role = "admin" AND status = "active"',
    user_count: 'SELECT COUNT(*) as count FROM users WHERE role = "user" AND status = "active"',
    total_projects: 'SELECT COUNT(DISTINCT project_id) as count FROM project_members',
    total_sessions: 'SELECT COUNT(DISTINCT planning_id) as count FROM planning_participants'
  };

  const stats = {};
  let completedQueries = 0;
  const totalQueries = Object.keys(queries).length;

  Object.keys(queries).forEach(key => {
    db.get(queries[key], (err, row) => {
      if (err) {
        console.error(`Error getting ${key} stats:`, err);
        stats[key] = 0;
      } else {
        stats[key] = row.count;
      }

      completedQueries++;
      if (completedQueries === totalQueries) {
        res.json(stats);
      }
    });
  });
});

module.exports = router; 