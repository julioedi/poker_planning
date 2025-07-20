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

// Add user settings columns to users table
async function addUserSettingsColumns() {
  return new Promise((resolve, reject) => {
    // Check if columns already exist
    db.all("PRAGMA table_info(users)", (err, columns) => {
      if (err) {
        reject(err);
        return;
      }

      const columnNames = columns.map(col => col.name);
      const newColumns = [];

      // Check and add skillset column
      if (!columnNames.includes('skillset')) {
        newColumns.push('skillset TEXT');
      }

      // Check and add color_scheme column
      if (!columnNames.includes('color_scheme')) {
        newColumns.push('color_scheme TEXT DEFAULT "light"');
      }

      // Check and add language column
      if (!columnNames.includes('language')) {
        newColumns.push('language TEXT DEFAULT "en"');
      }

      // Check and add timezone column
      if (!columnNames.includes('timezone')) {
        newColumns.push('timezone TEXT DEFAULT "UTC"');
      }

      // Check and add notifications column
      if (!columnNames.includes('notifications')) {
        newColumns.push('notifications TEXT DEFAULT "all"');
      }

      if (newColumns.length === 0) {
        console.log('✅ All user settings columns already exist');
        resolve();
        return;
      }

      // Add new columns
      const addColumnPromises = newColumns.map(columnDef => {
        return new Promise((resolve, reject) => {
          const columnName = columnDef.split(' ')[0];
          db.run(`ALTER TABLE users ADD COLUMN ${columnDef}`, (err) => {
            if (err) {
              console.error(`❌ Failed to add column ${columnName}:`, err.message);
              reject(err);
            } else {
              console.log(`✅ Added column: ${columnName}`);
              resolve();
            }
          });
        });
      });

      Promise.all(addColumnPromises)
        .then(() => {
          console.log('✅ All user settings columns added successfully');
          resolve();
        })
        .catch(reject);
    });
  });
}

// Run migration
async function runMigration() {
  try {
    await addUserSettingsColumns();
    console.log('✅ User settings migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ User settings migration failed:', error);
    process.exit(1);
  }
}

runMigration(); 