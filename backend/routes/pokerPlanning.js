const express = require('express');
const { body, validationResult } = require('express-validator');
const { db, dbUtils } = require('../database/init');
const { requireProjectAccess, requireProjectMembership, authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get all poker planning sessions
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', status = '', project_id = '' } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        pp.id,
        pp.title,
        pp.room_code,
        pp.metrics,
        pp.scheduled_at,
        pp.started_at,
        pp.ended_at,
        pp.status,
        pp.allow_chat,
        pp.allow_emoticons,
        pp.notify_email,
        pp.created_at,
        pp.updated_at,
        p.name as project_name,
        u.name as created_by_name,
        (SELECT COUNT(*) FROM planning_participants WHERE planning_id = pp.id) as participant_count,
        (SELECT COUNT(*) FROM topics WHERE planning_id = pp.id) as topic_count
      FROM poker_planning pp
      JOIN projects p ON pp.project_id = p.id
      JOIN users u ON pp.created_by = u.id
      WHERE 1=1
    `;
    let params = [];

    // Add filters
    if (search) {
      query += ` AND (pp.title LIKE ? OR p.name LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    if (status) {
      query += ` AND pp.status = ?`;
      params.push(status);
    }

    if (project_id) {
      query += ` AND pp.project_id = ?`;
      params.push(project_id);
    }

    // Add pagination
    query += ` ORDER BY pp.created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), offset);

    // Get total count
    let countQuery = `
      SELECT COUNT(*) as total
      FROM poker_planning pp
      JOIN projects p ON pp.project_id = p.id
      WHERE 1=1
    `;
    let countParams = [];

    if (search) {
      countQuery += ` AND (pp.title LIKE ? OR p.name LIKE ?)`;
      countParams.push(`%${search}%`, `%${search}%`);
    }

    if (status) {
      countQuery += ` AND pp.status = ?`;
      countParams.push(status);
    }

    if (project_id) {
      countQuery += ` AND pp.project_id = ?`;
      countParams.push(project_id);
    }

    db.get(countQuery, countParams, (err, countResult) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      db.all(query, params, (err, planningSessions) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

        res.json({
          planningSessions,
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
    console.error('Get poker planning error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get my poker planning sessions (created by or participated in)
router.get('/my-sessions', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', status = '', project_id = '' } = req.query;
    const offset = (page - 1) * limit;
    const userId = req.user.id;

    let query = `
      SELECT DISTINCT
        pp.id,
        pp.title,
        pp.room_code,
        pp.metrics,
        pp.scheduled_at,
        pp.started_at,
        pp.ended_at,
        pp.status,
        pp.allow_chat,
        pp.allow_emoticons,
        pp.notify_email,
        pp.created_at,
        pp.updated_at,
        p.name as project_name,
        u.name as created_by_name,
        CASE 
          WHEN pp.created_by = ? THEN 'creator'
          ELSE 'participant'
        END as user_role,
        (SELECT COUNT(*) FROM planning_participants WHERE planning_id = pp.id) as participant_count,
        (SELECT COUNT(*) FROM topics WHERE planning_id = pp.id) as topic_count
      FROM poker_planning pp
      JOIN projects p ON pp.project_id = p.id
      JOIN users u ON pp.created_by = u.id
      WHERE (pp.created_by = ? OR pp.id IN (
        SELECT planning_id FROM planning_participants WHERE user_id = ?
      ))
    `;
    let params = [userId, userId, userId];

    // Add filters
    if (search) {
      query += ` AND (pp.title LIKE ? OR p.name LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    if (status) {
      query += ` AND pp.status = ?`;
      params.push(status);
    }

    if (project_id) {
      query += ` AND pp.project_id = ?`;
      params.push(project_id);
    }

    // Add pagination
    query += ` ORDER BY pp.created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), offset);

    // Get total count
    let countQuery = `
      SELECT COUNT(DISTINCT pp.id) as total
      FROM poker_planning pp
      JOIN projects p ON pp.project_id = p.id
      WHERE (pp.created_by = ? OR pp.id IN (
        SELECT planning_id FROM planning_participants WHERE user_id = ?
      ))
    `;
    let countParams = [userId, userId];

    if (search) {
      countQuery += ` AND (pp.title LIKE ? OR p.name LIKE ?)`;
      countParams.push(`%${search}%`, `%${search}%`);
    }

    if (status) {
      countQuery += ` AND pp.status = ?`;
      countParams.push(status);
    }

    if (project_id) {
      countQuery += ` AND pp.project_id = ?`;
      countParams.push(project_id);
    }

    db.get(countQuery, countParams, (err, countResult) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      db.all(query, params, (err, planningSessions) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

        res.json({
          planningSessions,
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
    console.error('Get my poker planning error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get poker planning by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    db.get(`
      SELECT 
        pp.*,
        p.name as project_name,
        p.description as project_description,
        u.name as created_by_name,
        u.email as created_by_email
      FROM poker_planning pp
      JOIN projects p ON pp.project_id = p.id
      JOIN users u ON pp.created_by = u.id
      WHERE pp.id = ?
    `, [id], (err, planning) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!planning) {
        return res.status(404).json({ error: 'Poker planning session not found' });
      }

      // Get participants
      db.all(`
        SELECT 
          pp.id,
          pp.joined_at,
          u.id as user_id,
          u.name,
          u.email,
          u.role
        FROM planning_participants pp
        JOIN users u ON pp.user_id = u.id
        WHERE pp.planning_id = ?
        ORDER BY pp.joined_at ASC
      `, [id], (err, participants) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

        // Get topics
        db.all(`
          SELECT 
            id,
            title,
            description,
            parent_id,
            order_index,
            created_at
          FROM topics
          WHERE planning_id = ?
          ORDER BY order_index ASC, created_at ASC
        `, [id], (err, topics) => {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }

          res.json({
            planning,
            participants,
            topics
          });
        });
      });
    });

  } catch (error) {
    console.error('Get poker planning error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new poker planning session
router.post('/', requireProjectAccess, [
  body('title').isLength({ min: 2, max: 200 }),
  body('project_id').isInt(),
  body('metrics').optional().isLength({ max: 500 }),
  body('scheduled_at').optional().isISO8601(),
  body('allow_chat').optional().isBoolean(),
  body('allow_emoticons').optional().isBoolean(),
  body('notify_email').optional().isBoolean(),
  body('topics').optional().isArray(),
  body('participant_ids').optional().isArray()
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

    const { 
      title, 
      project_id, 
      metrics, 
      scheduled_at, 
      allow_chat = true, 
      allow_emoticons = true, 
      notify_email = false,
      topics = [],
      participant_ids = []
    } = req.body;

    // Generate unique room code
    const roomCode = await dbUtils.generateUniqueRoomCode();

    // Create poker planning session
    db.run(
      `INSERT INTO poker_planning (
        title, project_id, created_by, room_code, metrics, 
        scheduled_at, allow_chat, allow_emoticons, notify_email
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, project_id, req.user.id, roomCode, metrics, scheduled_at, allow_chat, allow_emoticons, notify_email],
      function(err) {
        if (err) {
          return res.status(500).json({ error: 'Failed to create poker planning session' });
        }

        const planningId = this.lastID;

        // Add participants
        const addParticipants = () => {
          if (participant_ids.length === 0) {
            return Promise.resolve();
          }

          const placeholders = participant_ids.map(() => '(?, ?)').join(',');
          const values = participant_ids.flatMap(userId => [planningId, userId]);

          return new Promise((resolve, reject) => {
            db.run(
              `INSERT INTO planning_participants (planning_id, user_id) VALUES ${placeholders}`,
              values,
              (err) => {
                if (err) reject(err);
                else resolve();
              }
            );
          });
        };

        // Add topics
        const addTopics = () => {
          if (topics.length === 0) {
            return Promise.resolve();
          }

          const placeholders = topics.map(() => '(?, ?, ?, ?, ?)').join(',');
          const values = topics.flatMap(topic => [
            planningId, 
            topic.title, 
            topic.description || null, 
            topic.parent_id || null, 
            topic.order_index || 0
          ]);

          return new Promise((resolve, reject) => {
            db.run(
              `INSERT INTO topics (planning_id, title, description, parent_id, order_index) VALUES ${placeholders}`,
              values,
              (err) => {
                if (err) reject(err);
                else resolve();
              }
            );
          });
        };

        // Execute both operations
        Promise.all([addParticipants(), addTopics()])
          .then(() => {
            // Get the created planning session
            db.get(`
              SELECT 
                pp.*,
                p.name as project_name,
                u.name as created_by_name
              FROM poker_planning pp
              JOIN projects p ON pp.project_id = p.id
              JOIN users u ON pp.created_by = u.id
              WHERE pp.id = ?
            `, [planningId], (err, planning) => {
              if (err) {
                return res.status(500).json({ error: 'Database error' });
              }

              res.status(201).json({
                message: 'Poker planning session created successfully',
                planning
              });
            });
          })
          .catch((error) => {
            console.error('Error adding participants or topics:', error);
            res.status(500).json({ error: 'Failed to add participants or topics' });
          });
      }
    );

  } catch (error) {
    console.error('Create poker planning error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update poker planning session
router.put('/:id', requireProjectAccess, [
  body('title').optional().isLength({ min: 2, max: 200 }),
  body('metrics').optional().isLength({ max: 500 }),
  body('scheduled_at').optional().isISO8601(),
  body('allow_chat').optional().isBoolean(),
  body('allow_emoticons').optional().isBoolean(),
  body('notify_email').optional().isBoolean()
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
    const { title, metrics, scheduled_at, allow_chat, allow_emoticons, notify_email } = req.body;

    // Check if planning session exists
    db.get('SELECT id FROM poker_planning WHERE id = ?', [id], (err, planning) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!planning) {
        return res.status(404).json({ error: 'Poker planning session not found' });
      }

      // Build update query
      let updateQuery = 'UPDATE poker_planning SET updated_at = CURRENT_TIMESTAMP';
      let params = [];

      if (title) {
        updateQuery += ', title = ?';
        params.push(title);
      }

      if (metrics !== undefined) {
        updateQuery += ', metrics = ?';
        params.push(metrics);
      }

      if (scheduled_at !== undefined) {
        updateQuery += ', scheduled_at = ?';
        params.push(scheduled_at);
      }

      if (allow_chat !== undefined) {
        updateQuery += ', allow_chat = ?';
        params.push(allow_chat);
      }

      if (allow_emoticons !== undefined) {
        updateQuery += ', allow_emoticons = ?';
        params.push(allow_emoticons);
      }

      if (notify_email !== undefined) {
        updateQuery += ', notify_email = ?';
        params.push(notify_email);
      }

      updateQuery += ' WHERE id = ?';
      params.push(id);

      // Update planning session
      db.run(updateQuery, params, function(err) {
        if (err) {
          return res.status(500).json({ error: 'Failed to update poker planning session' });
        }

        // Get the updated planning session
        db.get(`
          SELECT 
            pp.*,
            p.name as project_name,
            u.name as created_by_name
          FROM poker_planning pp
          JOIN projects p ON pp.project_id = p.id
          JOIN users u ON pp.created_by = u.id
          WHERE pp.id = ?
        `, [id], (err, updatedPlanning) => {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }

          res.json({
            message: 'Poker planning session updated successfully',
            planning: updatedPlanning
          });
        });
      });
    });

  } catch (error) {
    console.error('Update poker planning error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start poker planning session
router.post('/:id/start', requireProjectAccess, async (req, res) => {
  try {
    const { id } = req.params;

    db.run(
      'UPDATE poker_planning SET status = ?, started_at = CURRENT_TIMESTAMP WHERE id = ?',
      ['active', id],
      function(err) {
        if (err) {
          return res.status(500).json({ error: 'Failed to start poker planning session' });
        }

        if (this.changes === 0) {
          return res.status(404).json({ error: 'Poker planning session not found' });
        }

        res.json({ message: 'Poker planning session started successfully' });
      }
    );

  } catch (error) {
    console.error('Start poker planning error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// End poker planning session
router.post('/:id/end', requireProjectAccess, async (req, res) => {
  try {
    const { id } = req.params;

    db.run(
      'UPDATE poker_planning SET status = ?, ended_at = CURRENT_TIMESTAMP WHERE id = ?',
      ['completed', id],
      function(err) {
        if (err) {
          return res.status(500).json({ error: 'Failed to end poker planning session' });
        }

        if (this.changes === 0) {
          return res.status(404).json({ error: 'Poker planning session not found' });
        }

        res.json({ message: 'Poker planning session ended successfully' });
      }
    );

  } catch (error) {
    console.error('End poker planning error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Join poker planning session by room code
router.post('/join/:roomCode', async (req, res) => {
  try {
    const { roomCode } = req.params;
    const { userId } = req.body;

    // Check if planning session exists
    db.get('SELECT id, status FROM poker_planning WHERE room_code = ?', [roomCode], (err, planning) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!planning) {
        return res.status(404).json({ error: 'Poker planning session not found' });
      }

      if (planning.status === 'completed') {
        return res.status(400).json({ error: 'Poker planning session has already ended' });
      }

      // Check if user is already a participant
      db.get('SELECT id FROM planning_participants WHERE planning_id = ? AND user_id = ?', [planning.id, userId], (err, existingParticipant) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

        if (existingParticipant) {
          return res.status(400).json({ error: 'User is already a participant' });
        }

        // Add participant
        db.run(
          'INSERT INTO planning_participants (planning_id, user_id) VALUES (?, ?)',
          [planning.id, userId],
          function(err) {
            if (err) {
              return res.status(500).json({ error: 'Failed to join poker planning session' });
            }

            res.json({ 
              message: 'Successfully joined poker planning session',
              planningId: planning.id
            });
          }
        );
      });
    });

  } catch (error) {
    console.error('Join poker planning error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get voting results for a topic
router.get('/:id/topics/:topicId/votes', async (req, res) => {
  try {
    const { id: planningId, topicId } = req.params;

    // Get current voting round
    db.get(`
      SELECT 
        vr.id,
        vr.round_number,
        vr.status,
        vr.started_at,
        vr.ended_at,
        vr.final_score
      FROM voting_rounds vr
      WHERE vr.planning_id = ? AND vr.topic_id = ? AND vr.status = 'active'
      ORDER BY vr.round_number DESC
      LIMIT 1
    `, [planningId, topicId], (err, currentRound) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!currentRound) {
        return res.json({ 
          currentRound: null, 
          votes: [],
          participants: []
        });
      }

      // Get votes for current round
      db.all(`
        SELECT 
          v.id,
          v.score,
          v.voted_at,
          u.id as user_id,
          u.name,
          u.email
        FROM votes v
        JOIN users u ON v.user_id = u.id
        WHERE v.round_id = ?
        ORDER BY v.voted_at ASC
      `, [currentRound.id], (err, votes) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

        // Get all participants
        db.all(`
          SELECT 
            pp.user_id,
            u.name,
            u.email
          FROM planning_participants pp
          JOIN users u ON pp.user_id = u.id
          WHERE pp.planning_id = ?
          ORDER BY pp.joined_at ASC
        `, [planningId], (err, participants) => {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }

          res.json({
            currentRound,
            votes,
            participants
          });
        });
      });
    });

  } catch (error) {
    console.error('Get voting results error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 