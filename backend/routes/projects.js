const express = require('express');
const { body, validationResult } = require('express-validator');
const { db } = require('../database/init');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Get all projects with pagination and filtering
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', type = '', status = '' } = req.query;
    const offset = (page - 1) * limit;
    const userId = req.user.id;

    let query = `
      SELECT 
        p.id,
        p.name,
        p.description,
        p.type,
        p.custom_type,
        p.status,
        p.start_date,
        p.end_date,
        p.created_at,
        p.updated_at,
        u.name as owner,
        (SELECT COUNT(*) FROM project_members WHERE project_id = p.id) as members_count,
        (SELECT COUNT(*) FROM planning_sessions WHERE project_id = p.id) as sessions_count
      FROM projects p
      LEFT JOIN users u ON p.owner_id = u.id
      WHERE p.owner_id = ? OR p.id IN (SELECT project_id FROM project_members WHERE user_id = ?)
    `;
    let params = [userId, userId];

    // Add search filter
    if (search) {
      query += ` AND (p.name LIKE ? OR p.description LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    // Add type filter
    if (type) {
      query += ` AND p.type = ?`;
      params.push(type);
    }

    // Add status filter
    if (status) {
      query += ` AND p.status = ?`;
      params.push(status);
    }

    // Add pagination
    query += ` ORDER BY p.created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), offset);

    // Get total count
    let countQuery = `
      SELECT COUNT(*) as total
      FROM projects p
      WHERE p.owner_id = ? OR p.id IN (SELECT project_id FROM project_members WHERE user_id = ?)
    `;
    let countParams = [userId, userId];

    if (search) {
      countQuery += ` AND (p.name LIKE ? OR p.description LIKE ?)`;
      countParams.push(`%${search}%`, `%${search}%`);
    }

    if (type) {
      countQuery += ` AND p.type = ?`;
      countParams.push(type);
    }

    if (status) {
      countQuery += ` AND p.status = ?`;
      countParams.push(status);
    }

    db.get(countQuery, countParams, (err, countResult) => {
      if (err) {
        console.error('Count query error:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      db.all(query, params, (err, projects) => {
        if (err) {
          console.error('Projects query error:', err);
          return res.status(500).json({ error: 'Database error' });
        }

        // Process projects to handle custom types
        const processedProjects = projects.map(project => ({
          ...project,
          type: project.custom_type || project.type
        }));

        res.json({
          projects: processedProjects,
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

// Create new project
router.post('/', [
  body('name').isLength({ min: 1, max: 100 }).withMessage('Project name is required and must be between 1 and 100 characters'),
  body('description').optional().isLength({ max: 500 }).withMessage('Description must be less than 500 characters'),
  body('type').isIn(['web', 'mobile', 'desktop', 'api', 'database', 'infrastructure', 'other']).withMessage('Invalid project type'),
  body('customType').optional().isLength({ min: 1, max: 50 }).withMessage('Custom type must be between 1 and 50 characters'),
  body('status').isIn(['planning', 'active', 'onHold', 'completed', 'cancelled']).withMessage('Invalid project status'),
  body('start_date').isISO8601().withMessage('Start date must be a valid date'),
  body('end_date').optional().isISO8601().withMessage('End date must be a valid date')
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

    const { name, description, type, customType, status, start_date, end_date } = req.body;
    const userId = req.user.id;

    // Validate custom type when type is 'other'
    if (type === 'other' && (!customType || customType.trim() === '')) {
      return res.status(400).json({ error: 'Custom type is required when project type is "Other"' });
    }

    // Create project
    db.run(
      'INSERT INTO projects (name, description, type, custom_type, status, start_date, end_date, owner_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime("now"), datetime("now"))',
      [name, description, type, customType || null, status, start_date, end_date || null, userId],
      function(err) {
        if (err) {
          console.error('Create project error:', err);
          return res.status(500).json({ error: 'Failed to create project' });
        }

        const projectId = this.lastID;

        // Get the created project
        db.get(`
          SELECT 
            p.id,
            p.name,
            p.description,
            p.type,
            p.custom_type,
            p.status,
            p.start_date,
            p.end_date,
            p.created_at,
            p.updated_at,
            u.name as owner,
            (SELECT COUNT(*) FROM project_members WHERE project_id = p.id) as members_count,
            (SELECT COUNT(*) FROM planning_sessions WHERE project_id = p.id) as sessions_count
          FROM projects p
          LEFT JOIN users u ON p.owner_id = u.id
          WHERE p.id = ?
        `, [projectId], (err, project) => {
          if (err) {
            console.error('Get created project error:', err);
            return res.status(500).json({ error: 'Database error' });
          }

          // Process project to handle custom type
          const processedProject = {
            ...project,
            type: project.custom_type || project.type
          };

          res.status(201).json({
            message: 'Project created successfully',
            project: processedProject
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
router.put('/:id', [
  body('name').optional().isLength({ min: 1, max: 100 }).withMessage('Project name must be between 1 and 100 characters'),
  body('description').optional().isLength({ max: 500 }).withMessage('Description must be less than 500 characters'),
  body('type').optional().isIn(['web', 'mobile', 'desktop', 'api', 'database', 'infrastructure', 'other']).withMessage('Invalid project type'),
  body('customType').optional().isLength({ min: 1, max: 50 }).withMessage('Custom type must be between 1 and 50 characters'),
  body('status').optional().isIn(['planning', 'active', 'onHold', 'completed', 'cancelled']).withMessage('Invalid project status'),
  body('start_date').optional().isISO8601().withMessage('Start date must be a valid date'),
  body('end_date').optional().isISO8601().withMessage('End date must be a valid date')
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
    const { name, description, type, customType, status, start_date, end_date } = req.body;
    const userId = req.user.id;

    // Check if project exists and user has access
    db.get('SELECT * FROM projects WHERE id = ? AND (owner_id = ? OR id IN (SELECT project_id FROM project_members WHERE user_id = ?))', 
      [id, userId, userId], (err, project) => {
        if (err) {
          console.error('Check project access error:', err);
          return res.status(500).json({ error: 'Database error' });
        }

        if (!project) {
          return res.status(404).json({ error: 'Project not found or access denied' });
        }

        // Validate custom type when type is 'other'
        if (type === 'other' && (!customType || customType.trim() === '')) {
          return res.status(400).json({ error: 'Custom type is required when project type is "Other"' });
        }

        // Update project
        const updateFields = [];
        const updateParams = [];

        if (name !== undefined) {
          updateFields.push('name = ?');
          updateParams.push(name);
        }
        if (description !== undefined) {
          updateFields.push('description = ?');
          updateParams.push(description);
        }
        if (type !== undefined) {
          updateFields.push('type = ?');
          updateParams.push(type);
        }
        if (customType !== undefined) {
          updateFields.push('custom_type = ?');
          updateParams.push(customType || null);
        }
        if (status !== undefined) {
          updateFields.push('status = ?');
          updateParams.push(status);
        }
        if (start_date !== undefined) {
          updateFields.push('start_date = ?');
          updateParams.push(start_date);
        }
        if (end_date !== undefined) {
          updateFields.push('end_date = ?');
          updateParams.push(end_date || null);
        }

        updateFields.push('updated_at = datetime("now")');
        updateParams.push(id);

        const updateQuery = `UPDATE projects SET ${updateFields.join(', ')} WHERE id = ?`;

        db.run(updateQuery, updateParams, function(err) {
          if (err) {
            console.error('Update project error:', err);
            return res.status(500).json({ error: 'Failed to update project' });
          }

          // Get the updated project
          db.get(`
            SELECT 
              p.id,
              p.name,
              p.description,
              p.type,
              p.custom_type,
              p.status,
              p.start_date,
              p.end_date,
              p.created_at,
              p.updated_at,
              u.name as owner,
              (SELECT COUNT(*) FROM project_members WHERE project_id = p.id) as members_count,
              (SELECT COUNT(*) FROM planning_sessions WHERE project_id = p.id) as sessions_count
            FROM projects p
            LEFT JOIN users u ON p.owner_id = u.id
            WHERE p.id = ?
          `, [id], (err, updatedProject) => {
            if (err) {
              console.error('Get updated project error:', err);
              return res.status(500).json({ error: 'Database error' });
            }

            // Process project to handle custom type
            const processedProject = {
              ...updatedProject,
              type: updatedProject.custom_type || updatedProject.type
            };

            res.json({
              message: 'Project updated successfully',
              project: processedProject
            });
          });
        });
      }
    );

  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete project
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if project exists and user is owner
    db.get('SELECT * FROM projects WHERE id = ? AND owner_id = ?', [id, userId], (err, project) => {
      if (err) {
        console.error('Check project ownership error:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      if (!project) {
        return res.status(404).json({ error: 'Project not found or access denied' });
      }

      // Delete project
      db.run('DELETE FROM projects WHERE id = ?', [id], function(err) {
        if (err) {
          console.error('Delete project error:', err);
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

module.exports = router; 