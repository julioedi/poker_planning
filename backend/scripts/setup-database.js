const { initializeDatabase } = require('../database/init');

async function setupDatabase() {
  try {
    console.log('🗄️ Setting up database...');
    await initializeDatabase();
    console.log('✅ Database setup completed successfully!');
    console.log('\n📋 Default admin user created:');
    console.log('   Email: admin@pokerplanning.com');
    console.log('   Password: admin123');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  }
}

setupDatabase(); 