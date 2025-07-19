const jwt = require('jsonwebtoken');
const { db } = require('../database/init');

// Store active connections
const activeConnections = new Map(); // socketId -> { userId, planningId, user }
const planningRooms = new Map(); // planningId -> Set of socketIds

function setupSocketHandlers(io) {
  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
      
      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Get user from database
      db.get('SELECT id, email, name, role, status FROM users WHERE id = ?', [decoded.userId], (err, user) => {
        if (err) {
          return next(new Error('Database error'));
        }

        if (!user || user.status !== 'active') {
          return next(new Error('Invalid user'));
        }

        socket.user = user;
        next();
      });
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 User ${socket.user.name} connected: ${socket.id}`);

    // Join planning room
    socket.on('join-room', async (data) => {
      try {
        const { planningId, roomCode } = data;

        if (!planningId && !roomCode) {
          socket.emit('error', { message: 'Planning ID or room code required' });
          return;
        }

        let planning;
        
        if (planningId) {
          // Join by planning ID
          planning = await getPlanningById(planningId);
        } else {
          // Join by room code
          planning = await getPlanningByRoomCode(roomCode);
        }

        if (!planning) {
          socket.emit('error', { message: 'Poker planning session not found' });
          return;
        }

        if (planning.status === 'completed') {
          socket.emit('error', { message: 'Poker planning session has already ended' });
          return;
        }

        // Check if user is a participant
        const isParticipant = await checkParticipant(planning.id, socket.user.id);
        if (!isParticipant) {
          // Add user as participant
          await addParticipant(planning.id, socket.user.id);
        }

        // Join socket room
        socket.join(`planning-${planning.id}`);
        
        // Store connection info
        activeConnections.set(socket.id, {
          userId: socket.user.id,
          planningId: planning.id,
          user: socket.user
        });

        // Add to planning rooms
        if (!planningRooms.has(planning.id)) {
          planningRooms.set(planning.id, new Set());
        }
        planningRooms.get(planning.id).add(socket.id);

        // Get current state
        const state = await getPlanningState(planning.id);
        
        // Notify user joined
        socket.emit('room-joined', {
          planning,
          state,
          user: socket.user
        });

        // Notify other users
        socket.to(`planning-${planning.id}`).emit('user-joined', {
          user: socket.user
        });

        console.log(`👥 User ${socket.user.name} joined planning ${planning.id}`);

      } catch (error) {
        console.error('Join room error:', error);
        socket.emit('error', { message: 'Failed to join room' });
      }
    });

    // Leave planning room
    socket.on('leave-room', async (data) => {
      try {
        const { planningId } = data;
        const connection = activeConnections.get(socket.id);

        if (!connection || connection.planningId !== planningId) {
          return;
        }

        // Leave socket room
        socket.leave(`planning-${planningId}`);
        
        // Remove from active connections
        activeConnections.delete(socket.id);
        
        // Remove from planning rooms
        const room = planningRooms.get(planningId);
        if (room) {
          room.delete(socket.id);
          if (room.size === 0) {
            planningRooms.delete(planningId);
          }
        }

        // Notify other users
        socket.to(`planning-${planningId}`).emit('user-left', {
          user: socket.user
        });

        console.log(`👋 User ${socket.user.name} left planning ${planningId}`);

      } catch (error) {
        console.error('Leave room error:', error);
      }
    });

    // Submit vote
    socket.on('submit-vote', async (data) => {
      try {
        const { topicId, score, roundId } = data;
        const connection = activeConnections.get(socket.id);

        if (!connection) {
          socket.emit('error', { message: 'Not in a planning room' });
          return;
        }

        // Check if voting round is active
        const round = await getVotingRound(roundId);
        if (!round || round.status !== 'active') {
          socket.emit('error', { message: 'Voting round is not active' });
          return;
        }

        // Check if user already voted
        const existingVote = await getVote(roundId, socket.user.id);
        if (existingVote) {
          socket.emit('error', { message: 'You have already voted in this round' });
          return;
        }

        // Submit vote
        await submitVote(roundId, socket.user.id, score);

        // Get updated voting state
        const votingState = await getVotingState(roundId);

        // Notify all users in room
        io.to(`planning-${connection.planningId}`).emit('vote-submitted', {
          topicId,
          roundId,
          votingState,
          user: socket.user
        });

        // Check if all participants have voted
        if (votingState.allVoted) {
          io.to(`planning-${connection.planningId}`).emit('voting-completed', {
            topicId,
            roundId,
            votingState
          });
        }

        console.log(`🗳️ User ${socket.user.name} voted ${score} for topic ${topicId}`);

      } catch (error) {
        console.error('Submit vote error:', error);
        socket.emit('error', { message: 'Failed to submit vote' });
      }
    });

    // Start new voting round
    socket.on('start-voting', async (data) => {
      try {
        const { topicId } = data;
        const connection = activeConnections.get(socket.id);

        if (!connection) {
          socket.emit('error', { message: 'Not in a planning room' });
          return;
        }

        // Check if user is PO or PM
        const hasAccess = await checkProjectAccess(connection.planningId, socket.user.id);
        if (!hasAccess) {
          socket.emit('error', { message: 'Only Product Owner or Product Manager can start voting' });
          return;
        }

        // Get next round number
        const nextRoundNumber = await getNextRoundNumber(connection.planningId, topicId);

        // Create new voting round
        const roundId = await createVotingRound(connection.planningId, topicId, nextRoundNumber);

        // Get voting state
        const votingState = await getVotingState(roundId);

        // Notify all users in room
        io.to(`planning-${connection.planningId}`).emit('voting-started', {
          topicId,
          roundId,
          roundNumber: nextRoundNumber,
          votingState
        });

        console.log(`🎯 Voting started for topic ${topicId} in planning ${connection.planningId}`);

      } catch (error) {
        console.error('Start voting error:', error);
        socket.emit('error', { message: 'Failed to start voting' });
      }
    });

    // Accept votes
    socket.on('accept-votes', async (data) => {
      try {
        const { roundId, finalScore } = data;
        const connection = activeConnections.get(socket.id);

        if (!connection) {
          socket.emit('error', { message: 'Not in a planning room' });
          return;
        }

        // Check if user is PO or PM
        const hasAccess = await checkProjectAccess(connection.planningId, socket.user.id);
        if (!hasAccess) {
          socket.emit('error', { message: 'Only Product Owner or Product Manager can accept votes' });
          return;
        }

        // Update voting round
        await updateVotingRound(roundId, 'completed', finalScore);

        // Get voting state
        const votingState = await getVotingState(roundId);

        // Notify all users in room
        io.to(`planning-${connection.planningId}`).emit('votes-accepted', {
          roundId,
          finalScore,
          votingState
        });

        console.log(`✅ Votes accepted for round ${roundId} with score ${finalScore}`);

      } catch (error) {
        console.error('Accept votes error:', error);
        socket.emit('error', { message: 'Failed to accept votes' });
      }
    });

    // Send chat message
    socket.on('send-message', async (data) => {
      try {
        const { message, messageType = 'text' } = data;
        const connection = activeConnections.get(socket.id);

        if (!connection) {
          socket.emit('error', { message: 'Not in a planning room' });
          return;
        }

        // Check if chat is allowed
        const planning = await getPlanningById(connection.planningId);
        if (!planning.allow_chat) {
          socket.emit('error', { message: 'Chat is not allowed in this session' });
          return;
        }

        // Save message to database
        const messageId = await saveChatMessage(connection.planningId, socket.user.id, message, messageType);

        const chatMessage = {
          id: messageId,
          message,
          messageType,
          user: socket.user,
          createdAt: new Date().toISOString()
        };

        // Broadcast to all users in room
        io.to(`planning-${connection.planningId}`).emit('new-message', chatMessage);

        console.log(`💬 User ${socket.user.name} sent message in planning ${connection.planningId}`);

      } catch (error) {
        console.error('Send message error:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Disconnect
    socket.on('disconnect', () => {
      const connection = activeConnections.get(socket.id);
      
      if (connection) {
        // Remove from active connections
        activeConnections.delete(socket.id);
        
        // Remove from planning rooms
        const room = planningRooms.get(connection.planningId);
        if (room) {
          room.delete(socket.id);
          if (room.size === 0) {
            planningRooms.delete(connection.planningId);
          }
        }

        // Notify other users
        socket.to(`planning-${connection.planningId}`).emit('user-left', {
          user: connection.user
        });

        console.log(`🔌 User ${connection.user.name} disconnected from planning ${connection.planningId}`);
      }
    });
  });
}

// Database helper functions
function getPlanningById(planningId) {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM poker_planning WHERE id = ?', [planningId], (err, planning) => {
      if (err) reject(err);
      else resolve(planning);
    });
  });
}

function getPlanningByRoomCode(roomCode) {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM poker_planning WHERE room_code = ?', [roomCode], (err, planning) => {
      if (err) reject(err);
      else resolve(planning);
    });
  });
}

function checkParticipant(planningId, userId) {
  return new Promise((resolve, reject) => {
    db.get('SELECT id FROM planning_participants WHERE planning_id = ? AND user_id = ?', [planningId, userId], (err, participant) => {
      if (err) reject(err);
      else resolve(!!participant);
    });
  });
}

function addParticipant(planningId, userId) {
  return new Promise((resolve, reject) => {
    db.run('INSERT INTO planning_participants (planning_id, user_id) VALUES (?, ?)', [planningId, userId], function(err) {
      if (err) reject(err);
      else resolve(this.lastID);
    });
  });
}

function getPlanningState(planningId) {
  return new Promise((resolve, reject) => {
    // Get participants
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
        reject(err);
        return;
      }

      // Get topics
      db.all(`
        SELECT 
          id,
          title,
          description,
          parent_id,
          order_index
        FROM topics
        WHERE planning_id = ?
        ORDER BY order_index ASC, created_at ASC
      `, [planningId], (err, topics) => {
        if (err) {
          reject(err);
          return;
        }

        // Get active voting round
        db.get(`
          SELECT 
            vr.id,
            vr.topic_id,
            vr.round_number,
            vr.status
          FROM voting_rounds vr
          WHERE vr.planning_id = ? AND vr.status = 'active'
          ORDER BY vr.round_number DESC
          LIMIT 1
        `, [planningId], (err, activeRound) => {
          if (err) {
            reject(err);
            return;
          }

          resolve({
            participants,
            topics,
            activeRound
          });
        });
      });
    });
  });
}

function getVotingRound(roundId) {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM voting_rounds WHERE id = ?', [roundId], (err, round) => {
      if (err) reject(err);
      else resolve(round);
    });
  });
}

function getVote(roundId, userId) {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM votes WHERE round_id = ? AND user_id = ?', [roundId, userId], (err, vote) => {
      if (err) reject(err);
      else resolve(vote);
    });
  });
}

function submitVote(roundId, userId, score) {
  return new Promise((resolve, reject) => {
    db.run('INSERT INTO votes (round_id, user_id, score) VALUES (?, ?, ?)', [roundId, userId, score], function(err) {
      if (err) reject(err);
      else resolve(this.lastID);
    });
  });
}

function getVotingState(roundId) {
  return new Promise((resolve, reject) => {
    // Get round info
    db.get(`
      SELECT 
        vr.*,
        t.title as topic_title
      FROM voting_rounds vr
      JOIN topics t ON vr.topic_id = t.id
      WHERE vr.id = ?
    `, [roundId], (err, round) => {
      if (err) {
        reject(err);
        return;
      }

      // Get votes
      db.all(`
        SELECT 
          v.score,
          v.voted_at,
          u.id as user_id,
          u.name
        FROM votes v
        JOIN users u ON v.user_id = u.id
        WHERE v.round_id = ?
        ORDER BY v.voted_at ASC
      `, [roundId], (err, votes) => {
        if (err) {
          reject(err);
          return;
        }

        // Get participants count
        db.get(`
          SELECT COUNT(*) as total
          FROM planning_participants pp
          JOIN voting_rounds vr ON pp.planning_id = vr.planning_id
          WHERE vr.id = ?
        `, [roundId], (err, participantCount) => {
          if (err) {
            reject(err);
            return;
          }

          const allVoted = votes.length >= participantCount.total;
          
          resolve({
            round,
            votes,
            participantCount: participantCount.total,
            votedCount: votes.length,
            allVoted
          });
        });
      });
    });
  });
}

function checkProjectAccess(planningId, userId) {
  return new Promise((resolve, reject) => {
    db.get(`
      SELECT 1
      FROM poker_planning pp
      JOIN project_members pm ON pp.project_id = pm.project_id
      WHERE pp.id = ? AND pm.user_id = ? AND pm.role IN ('product_owner', 'product_manager')
    `, [planningId, userId], (err, result) => {
      if (err) reject(err);
      else resolve(!!result);
    });
  });
}

function getNextRoundNumber(planningId, topicId) {
  return new Promise((resolve, reject) => {
    db.get(`
      SELECT COALESCE(MAX(round_number), 0) + 1 as next_round
      FROM voting_rounds
      WHERE planning_id = ? AND topic_id = ?
    `, [planningId, topicId], (err, result) => {
      if (err) reject(err);
      else resolve(result.next_round);
    });
  });
}

function createVotingRound(planningId, topicId, roundNumber) {
  return new Promise((resolve, reject) => {
    db.run(`
      INSERT INTO voting_rounds (planning_id, topic_id, round_number, status)
      VALUES (?, ?, ?, 'active')
    `, [planningId, topicId, roundNumber], function(err) {
      if (err) reject(err);
      else resolve(this.lastID);
    });
  });
}

function updateVotingRound(roundId, status, finalScore) {
  return new Promise((resolve, reject) => {
    db.run(`
      UPDATE voting_rounds 
      SET status = ?, final_score = ?, ended_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [status, finalScore, roundId], function(err) {
      if (err) reject(err);
      else resolve(this.changes);
    });
  });
}

function saveChatMessage(planningId, userId, message, messageType) {
  return new Promise((resolve, reject) => {
    db.run(`
      INSERT INTO chat_messages (planning_id, user_id, message, message_type)
      VALUES (?, ?, ?, ?)
    `, [planningId, userId, message, messageType], function(err) {
      if (err) reject(err);
      else resolve(this.lastID);
    });
  });
}

module.exports = {
  setupSocketHandlers,
  activeConnections,
  planningRooms
}; 