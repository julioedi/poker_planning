const { db } = require('../database/init');

// Verify admin user setup
async function verifyAdminUser() {
  return new Promise((resolve, reject) => {
    console.log('🔍 Verifying admin user setup...\n');
    
    // Check admin user with ID 1
    db.get('SELECT id, email, name, role, status, profile_picture, skillset, color_scheme, language, timezone, notifications FROM users WHERE id = 1', (err, adminUser) => {
      if (err) {
        console.error('❌ Database error:', err);
        reject(err);
        return;
      }

      if (!adminUser) {
        console.error('❌ Admin user with ID 1 not found!');
        reject(new Error('Admin user not found'));
        return;
      }

      console.log('✅ Admin user found:');
      console.log(`   ID: ${adminUser.id}`);
      console.log(`   Email: ${adminUser.email}`);
      console.log(`   Name: ${adminUser.name}`);
      console.log(`   Role: ${adminUser.role}`);
      console.log(`   Status: ${adminUser.status}`);
      console.log(`   Profile Picture: ${adminUser.profile_picture || 'None'}`);
      console.log(`   Skillset: ${adminUser.skillset || 'Not set'}`);
      console.log(`   Color Scheme: ${adminUser.color_scheme || 'light'}`);
      console.log(`   Language: ${adminUser.language || 'en'}`);
      console.log(`   Timezone: ${adminUser.timezone || 'UTC'}`);
      console.log(`   Notifications: ${adminUser.notifications || 'all'}\n`);

      // Check if there are any users with ID 0
      db.get('SELECT id FROM users WHERE id = 0', (err, user0) => {
        if (err) {
          console.error('❌ Error checking for user ID 0:', err);
          reject(err);
          return;
        }

        if (user0) {
          console.log('⚠️  Warning: User with ID 0 still exists!');
        } else {
          console.log('✅ No user with ID 0 found (good)');
        }

        // Count total users
        db.get('SELECT COUNT(*) as count FROM users', (err, result) => {
          if (err) {
            console.error('❌ Error counting users:', err);
            reject(err);
            return;
          }

          console.log(`📊 Total users in database: ${result.count}\n`);
          
          if (adminUser.role === 'admin' && adminUser.id === 1) {
            console.log('🎉 Admin user setup is correct!');
            console.log('🔑 Login credentials:');
            console.log(`   Email: ${adminUser.email}`);
            console.log(`   Password: admin123`);
          } else {
            console.log('❌ Admin user setup is incorrect!');
          }

          resolve();
        });
      });
    });
  });
}

// Run verification
async function runVerification() {
  try {
    await verifyAdminUser();
    console.log('\n✅ Verification completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Verification failed:', error);
    process.exit(1);
  }
}

runVerification(); 