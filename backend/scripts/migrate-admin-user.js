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

// Migrate admin user from ID 0 to ID 1
async function migrateAdminUser() {
  return new Promise((resolve, reject) => {
    // Check if user with ID 0 exists
    db.get('SELECT * FROM users WHERE id = 0', (err, user0) => {
      if (err) {
        reject(err);
        return;
      }

      // Check if user with ID 1 exists
      db.get('SELECT * FROM users WHERE id = 1', (err, user1) => {
        if (err) {
          reject(err);
          return;
        }

        if (!user0) {
          console.log('✅ No user with ID 0 found - no migration needed');
          resolve();
          return;
        }

        if (user1) {
          console.log('⚠️  User with ID 1 already exists - cannot migrate');
          console.log('Please manually handle the migration or delete the user with ID 1 first');
          resolve();
          return;
        }

        // Begin transaction
        db.serialize(() => {
          db.run('BEGIN TRANSACTION');

          // Create new user with ID 1
          db.run(
            'INSERT INTO users (id, email, name, password, role, status, profile_picture, skillset, color_scheme, language, timezone, notifications, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
              1,
              user0.email,
              user0.name,
              user0.password,
              user0.role,
              user0.status,
              user0.profile_picture,
              user0.skillset,
              user0.color_scheme,
              user0.language,
              user0.timezone,
              user0.notifications,
              user0.created_at,
              user0.updated_at
            ],
            function(err) {
              if (err) {
                console.error('❌ Failed to create user with ID 1:', err.message);
                db.run('ROLLBACK');
                reject(err);
                return;
              }

              console.log('✅ Created user with ID 1');

              // Delete user with ID 0
              db.run('DELETE FROM users WHERE id = 0', function(err) {
                if (err) {
                  console.error('❌ Failed to delete user with ID 0:', err.message);
                  db.run('ROLLBACK');
                  reject(err);
                  return;
                }

                console.log('✅ Deleted user with ID 0');

                // Commit transaction
                db.run('COMMIT', function(err) {
                  if (err) {
                    console.error('❌ Failed to commit transaction:', err.message);
                    reject(err);
                    return;
                  }

                  console.log('✅ Migration completed successfully');
                  console.log('📧 Admin email:', user0.email);
                  console.log('🔑 Admin password: admin123 (default)');
                  resolve();
                });
              });
            }
          );
        });
      });
    });
  });
}

// Run migration
async function runMigration() {
  try {
    await migrateAdminUser();
    console.log('✅ Admin user migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Admin user migration failed:', error);
    process.exit(1);
  }
}

runMigration(); 