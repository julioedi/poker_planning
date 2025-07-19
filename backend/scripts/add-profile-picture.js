const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../database/pokerplanning.db');

// Create database connection
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database');
  }
});

// Add profile_picture column to users table
async function addProfilePictureColumn() {
  return new Promise((resolve, reject) => {
    // Check if column already exists
    db.get("PRAGMA table_info(users)", (err, rows) => {
      if (err) {
        reject(err);
        return;
      }

      // Check if profile_picture column exists
      db.all("PRAGMA table_info(users)", (err, columns) => {
        if (err) {
          reject(err);
          return;
        }

        const hasProfilePicture = columns.some(col => col.name === 'profile_picture');
        
        if (hasProfilePicture) {
          console.log('✅ Profile picture column already exists');
          resolve();
          return;
        }

        // Add profile_picture column
        db.run('ALTER TABLE users ADD COLUMN profile_picture TEXT', (err) => {
          if (err) {
            reject(err);
            return;
          }
          console.log('✅ Profile picture column added successfully');
          resolve();
        });
      });
    });
  });
}

// Run migration
async function runMigration() {
  try {
    await addProfilePictureColumn();
    console.log('✅ Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration(); 