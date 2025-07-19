const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

const dbPath = path.join(__dirname, 'pokerplanning.db');

// Create database connection
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database');
  }
});

// Initialize database tables
async function initializeDatabase() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Enable foreign keys
      db.run('PRAGMA foreign_keys = ON');

      // Users table
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT UNIQUE NOT NULL,
          name TEXT NOT NULL,
          password TEXT NOT NULL,
          role TEXT NOT NULL DEFAULT 'user',
          status TEXT NOT NULL DEFAULT 'active',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Projects table
      db.run(`
        CREATE TABLE IF NOT EXISTS projects (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          description TEXT,
          product_owner_id INTEGER,
          product_manager_id INTEGER,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (product_owner_id) REFERENCES users (id),
          FOREIGN KEY (product_manager_id) REFERENCES users (id)
        )
      `);

      // Project members table
      db.run(`
        CREATE TABLE IF NOT EXISTS project_members (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          project_id INTEGER NOT NULL,
          user_id INTEGER NOT NULL,
          role TEXT NOT NULL DEFAULT 'member',
          joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
          UNIQUE(project_id, user_id)
        )
      `);

      // Poker planning table
      db.run(`
        CREATE TABLE IF NOT EXISTS poker_planning (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          project_id INTEGER NOT NULL,
          created_by INTEGER NOT NULL,
          room_code TEXT UNIQUE NOT NULL,
          metrics TEXT,
          scheduled_at DATETIME,
          started_at DATETIME,
          ended_at DATETIME,
          status TEXT NOT NULL DEFAULT 'scheduled',
          allow_chat BOOLEAN DEFAULT 1,
          allow_emoticons BOOLEAN DEFAULT 1,
          notify_email BOOLEAN DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (project_id) REFERENCES projects (id),
          FOREIGN KEY (created_by) REFERENCES users (id)
        )
      `);

      // Planning participants table
      db.run(`
        CREATE TABLE IF NOT EXISTS planning_participants (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          planning_id INTEGER NOT NULL,
          user_id INTEGER NOT NULL,
          joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (planning_id) REFERENCES poker_planning (id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
          UNIQUE(planning_id, user_id)
        )
      `);

      // Topics table
      db.run(`
        CREATE TABLE IF NOT EXISTS topics (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          planning_id INTEGER NOT NULL,
          title TEXT NOT NULL,
          description TEXT,
          parent_id INTEGER,
          order_index INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (planning_id) REFERENCES poker_planning (id) ON DELETE CASCADE,
          FOREIGN KEY (parent_id) REFERENCES topics (id) ON DELETE CASCADE
        )
      `);

      // Voting rounds table
      db.run(`
        CREATE TABLE IF NOT EXISTS voting_rounds (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          planning_id INTEGER NOT NULL,
          topic_id INTEGER NOT NULL,
          round_number INTEGER NOT NULL,
          started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          ended_at DATETIME,
          status TEXT NOT NULL DEFAULT 'active',
          final_score TEXT,
          FOREIGN KEY (planning_id) REFERENCES poker_planning (id) ON DELETE CASCADE,
          FOREIGN KEY (topic_id) REFERENCES topics (id) ON DELETE CASCADE
        )
      `);

      // Votes table
      db.run(`
        CREATE TABLE IF NOT EXISTS votes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          round_id INTEGER NOT NULL,
          user_id INTEGER NOT NULL,
          score TEXT NOT NULL,
          voted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (round_id) REFERENCES voting_rounds (id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
          UNIQUE(round_id, user_id)
        )
      `);

      // Chat messages table
      db.run(`
        CREATE TABLE IF NOT EXISTS chat_messages (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          planning_id INTEGER NOT NULL,
          user_id INTEGER NOT NULL,
          message TEXT NOT NULL,
          message_type TEXT DEFAULT 'text',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (planning_id) REFERENCES poker_planning (id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )
      `);

      // Create default admin user
      createDefaultUser()
        .then(() => {
          console.log('✅ Database tables created successfully');
          resolve();
        })
        .catch(reject);
    });
  });
}

// Create default admin user
async function createDefaultUser() {
  const defaultUserId = process.env.DEFAULT_USER_ID || 1;
  const defaultEmail = process.env.DEFAULT_USER_EMAIL || 'admin@pokerplanning.com';
  const defaultName = process.env.DEFAULT_USER_NAME || 'Admin User';
  const defaultPassword = process.env.DEFAULT_USER_PASSWORD || 'admin123';

  return new Promise((resolve, reject) => {
    // Check if default user already exists
    db.get('SELECT id FROM users WHERE email = ?', [defaultEmail], (err, row) => {
      if (err) {
        reject(err);
        return;
      }

      if (row) {
        console.log('✅ Default admin user already exists');
        resolve();
        return;
      }

      // Hash password
      bcrypt.hash(defaultPassword, 10, (err, hashedPassword) => {
        if (err) {
          reject(err);
          return;
        }

        // Insert default user
        db.run(
          'INSERT INTO users (id, email, name, password, role) VALUES (?, ?, ?, ?, ?)',
          [defaultUserId, defaultEmail, defaultName, hashedPassword, 'admin'],
          function(err) {
            if (err) {
              reject(err);
              return;
            }
            console.log('✅ Default admin user created successfully');
            console.log(`📧 Email: ${defaultEmail}`);
            console.log(`🔑 Password: ${defaultPassword}`);
            resolve();
          }
        );
      });
    });
  });
}

// Generate room code
function generateRoomCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Database utility functions
const dbUtils = {
  // Get user by ID
  getUserById: (id) => {
    return new Promise((resolve, reject) => {
      db.get('SELECT id, email, name, role, status, profile_picture, skillset, color_scheme, language, timezone, notifications, created_at, updated_at FROM users WHERE id = ?', [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },

  // Get user by email
  getUserByEmail: (email) => {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },

  // Create new user
  createUser: (userData) => {
    return new Promise((resolve, reject) => {
      const { email, name, password, role = 'user' } = userData;
      bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) {
          reject(err);
          return;
        }

        db.run(
          'INSERT INTO users (email, name, password, role) VALUES (?, ?, ?, ?)',
          [email, name, hashedPassword, role],
          function(err) {
            if (err) reject(err);
            else resolve(this.lastID);
          }
        );
      });
    });
  },

  // Generate unique room code
  generateUniqueRoomCode: () => {
    return new Promise((resolve, reject) => {
      const generateCode = () => {
        const code = generateRoomCode();
        db.get('SELECT id FROM poker_planning WHERE room_code = ?', [code], (err, row) => {
          if (err) {
            reject(err);
            return;
          }
          if (row) {
            generateCode(); // Try again if code exists
          } else {
            resolve(code);
          }
        });
      };
      generateCode();
    });
  },

  // Clean up orphaned profile pictures
  cleanupOrphanedProfilePictures: () => {
    return new Promise((resolve, reject) => {
      const fs = require('fs');
      const uploadsDir = path.join(__dirname, '../uploads');
      
      // Get all profile pictures in database
      db.all('SELECT profile_picture FROM users WHERE profile_picture IS NOT NULL', (err, users) => {
        if (err) {
          reject(err);
          return;
        }

        const dbFiles = new Set(users.map(user => user.profile_picture).filter(Boolean));
        
        // Read all files in uploads directory
        fs.readdir(uploadsDir, (err, files) => {
          if (err) {
            reject(err);
            return;
          }

          // Filter profile picture files (files starting with 'profile-')
          const profileFiles = files.filter(file => file.startsWith('profile-'));
          
          // Find orphaned files
          const orphanedFiles = profileFiles.filter(file => !dbFiles.has(file));
          
          // Delete orphaned files
          let deletedCount = 0;
          orphanedFiles.forEach(file => {
            const filePath = path.join(uploadsDir, file);
            fs.unlink(filePath, (err) => {
              if (err) {
                console.error(`Error deleting orphaned file ${file}:`, err);
              } else {
                console.log(`Deleted orphaned profile picture: ${file}`);
                deletedCount++;
              }
            });
          });

          console.log(`Cleanup completed. Deleted ${deletedCount} orphaned profile pictures.`);
          resolve(deletedCount);
        });
      });
    });
  }
};

module.exports = {
  db,
  initializeDatabase,
  dbUtils
}; 