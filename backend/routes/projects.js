const express = require('express');
const { body, validationResult } = require('express-validator');
const { db } = require('../database/init');
const { requireAdmin, requireProjectAccess } = require('../middleware/auth');

const router = express.Router();

// Get all projects
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        p.id,
        p.name,
        p.description,
        p.created_at,
        p.updated_at,
        po.name as product_owner_name,
        pm.name as product_manager_name,
        (SELECT COUNT(*) FROM project_members WHERE project_id = p.id) as member_count
      FROM projects p
      LEFT JOIN users po ON p.product_owner_id = po.id
      LEFT JOIN users pm ON p.product_manager_id = pm.id
      WHERE 1=1
    `;
    let params = [];

    // Add search filter
    if (search) {
      query += ` AND (p.name LIKE ? OR p.description LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    // Add pagination
    query += ` ORDER BY p.created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), offset);

    // Get total count
    let countQuery = `
      SELECT COUNT(*) as total
      FROM projects
      WHERE 1=1
    `;
    let countParams = [];

    if (search) {
      countQuery += ` AND (name LIKE ? OR description LIKE ?)`;
      countParams.push(`%${search}%`, `%${search}%`);
    }

    db.get(countQuery, countParams, (err, countResult) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      db.all(query, params, (err, projects) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

        res.json({
          projects,
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
    console.error('Get projects error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get project by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    db.get(`
      SELECT 
        p.*,
        po.name as product_owner_name,
        po.email as product_owner_email,
        pm.name as product_manager_name,
        pm.email as product_manager_email
      FROM projects p
      LEFT JOIN users po ON p.product_owner_id = po.id
      LEFT JOIN users pm ON p.product_manager_id = pm.id
      WHERE p.id = ?
    `, [id], (err, project) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      // Get project members
      db.all(`
        SELECT 
          pm.id,
          pm.role,
          pm.joined_at,
          u.id as user_id,
          u.name,
          u.email,
          u.role as user_role
        FROM project_members pm
        JOIN users u ON pm.user_id = u.id
        WHERE pm.project_id = ?
        ORDER BY pm.joined_at ASC
      `, [id], (err, members) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

        res.json({
          project,
          members
        });
      });
    });

  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new project
router.post('/', [
  body('name').isLength({ min: 2, max: 100 }),
  body('description').optional().isLength({ max: 500 }),
  body('product_owner_id').optional().isInt(),
  body('product_manager_id').optional().isInt()
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

    const { name, description, product_owner_id, product_manager_id } = req.body;

    // Create project
    db.run(
      'INSERT INTO projects (name, description, product_owner_id, product_manager_id) VALUES (?, ?, ?, ?)',
      [name, description, product_owner_id, product_manager_id],
      function(err) {
        if (err) {
          return res.status(500).json({ error: 'Failed to create project' });
        }

        const projectId = this.lastID;

        // Get the created project
        db.get(`
          SELECT 
            p.*,
            po.name as product_owner_name,
            pm.name as product_manager_name
          FROM projects p
          LEFT JOIN users po ON p.product_owner_id = po.id
          LEFT JOIN users pm ON p.product_manager_id = pm.id
          WHERE p.id = ?
        `, [projectId], (err, project) => {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }

          res.status(201).json({
            message: 'Project created successfully',
            project
          });
        });
      }
    );

  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update project
router.put('/:id', requireProjectAccess, [
  body('name').optional().isLength({ min: 2, max: 100 }),
  body('description').optional().isLength({ max: 500 }),
  body('product_owner_id').optional().isInt(),
  body('product_manager_id').optional().isInt()
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
    const { name, description, product_owner_id, product_manager_id } = req.body;

    // Check if project exists
    db.get('SELECT id FROM projects WHERE id = ?', [id], (err, project) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      // Build update query
      let updateQuery = 'UPDATE projects SET updated_at = CURRENT_TIMESTAMP';
      let params = [];

      if (name) {
        updateQuery += ', name = ?';
        params.push(name);
      }

      if (description !== undefined) {
        updateQuery += ', description = ?';
        params.push(description);
      }

      if (product_owner_id !== undefined) {
        updateQuery += ', product_owner_id = ?';
        params.push(product_owner_id);
      }

      if (product_manager_id !== undefined) {
        updateQuery += ', product_manager_id = ?';
        params.push(product_manager_id);
      }

      updateQuery += ' WHERE id = ?';
      params.push(id);

      // Update project
      db.run(updateQuery, params, function(err) {
        if (err) {
          return res.status(500).json({ error: 'Failed to update project' });
        }

        // Get the updated project
        db.get(`
          SELECT 
            p.*,
            po.name as product_owner_name,
            pm.name as product_manager_name
          FROM projects p
          LEFT JOIN users po ON p.product_owner_id = po.id
          LEFT JOIN users pm ON p.product_manager_id = pm.id
          WHERE p.id = ?
        `, [id], (err, updatedProject) => {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }

          res.json({
            message: 'Project updated successfully',
            project: updatedProject
          });
        });
      });
    });

  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete project
router.delete('/:id', requireProjectAccess, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if project exists
    db.get('SELECT id FROM projects WHERE id = ?', [id], (err, project) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      // Delete project (cascade will handle related records)
      db.run('DELETE FROM projects WHERE id = ?', [id], function(err) {
        if (err) {
          return res.status(500).json({ error: 'Failed to delete project' });
        }

        res.json({ message: 'Project deleted successfully' });
      });
    });

  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add member to project
router.post('/:id/members', requireProjectAccess, [
  body('user_id').isInt(),
  body('role').isIn(['member', 'product_owner', 'product_manager'])
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

    const { id: projectId } = req.params;
    const { user_id, role } = req.body;

    // Check if user exists
    db.get('SELECT id FROM users WHERE id = ?', [user_id], (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Check if user is already a member
      db.get('SELECT id FROM project_members WHERE project_id = ? AND user_id = ?', [projectId, user_id], (err, existingMember) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

        if (existingMember) {
          return res.status(400).json({ error: 'User is already a member of this project' });
        }

        // Add member
        db.run(
          'INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)',
          [projectId, user_id, role],
          function(err) {
            if (err) {
              return res.status(500).json({ error: 'Failed to add member' });
            }

            // Get the added member
            db.get(`
              SELECT 
                pm.id,
                pm.role,
                pm.joined_at,
                u.id as user_id,
                u.name,
                u.email,
                u.role as user_role
              FROM project_members pm
              JOIN users u ON pm.user_id = u.id
              WHERE pm.id = ?
            `, [this.lastID], (err, member) => {
              if (err) {
                return res.status(500).json({ error: 'Database error' });
              }

              res.status(201).json({
                message: 'Member added successfully',
                member
              });
            });
          }
        );
      });
    });

  } catch (error) {
    console.error('Add member error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Remove member from project
router.delete('/:id/members/:userId', requireProjectAccess, async (req, res) => {
  try {
    const { id: projectId, userId } = req.params;

    // Remove member
    db.run('DELETE FROM project_members WHERE project_id = ? AND user_id = ?', [projectId, userId], function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to remove member' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Member not found in project' });
      }

      res.json({ message: 'Member removed successfully' });
    });

  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 