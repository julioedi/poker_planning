const { dbUtils } = require('../database/init');

// Clean up orphaned profile pictures
async function cleanupOrphanedFiles() {
  try {
    console.log('🧹 Starting cleanup of orphaned profile pictures...');
    
    const deletedCount = await dbUtils.cleanupOrphanedProfilePictures();
    
    console.log(`✅ Cleanup completed successfully!`);
    console.log(`📊 Deleted ${deletedCount} orphaned profile picture(s)`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
  }
}

// Run cleanup
cleanupOrphanedFiles(); 