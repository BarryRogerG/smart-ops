/**
 * Cleanup script to delete all users from the database
 * 
 * Usage:
 *   node scripts/cleanup-users.js
 * 
 * Or with npx:
 *   npx ts-node scripts/cleanup-users.js
 * 
 * WARNING: This will delete ALL users from the database!
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanupUsers() {
  try {
    console.log('🔄 Starting user cleanup...');
    
    // Count users before deletion
    const userCount = await prisma.user.count();
    console.log(`📊 Found ${userCount} user(s) in database`);
    
    if (userCount === 0) {
      console.log('✅ Database is already empty. No users to delete.');
      return;
    }
    
    // Delete related records first (due to foreign key constraints)
    console.log('🗑️  Deleting work items...');
    const workItemsDeleted = await prisma.workItem.deleteMany({});
    console.log(`   Deleted ${workItemsDeleted.count} work item(s)`);
    
    // Delete all users
    console.log('🗑️  Deleting users...');
    const result = await prisma.user.deleteMany({});
    
    console.log(`✅ Successfully deleted ${result.count} user(s)`);
    console.log('🎉 Database cleanup complete!');
    console.log('');
    console.log('You can now register a new account, and the first user will be assigned the ADMIN role.');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    console.error('Error details:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the cleanup
cleanupUsers();
