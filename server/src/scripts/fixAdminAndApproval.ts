/**
 * One-time migration script:
 * 1. Sets deepikanuti@gmail.com to ADMIN role + APPROVED
 * 2. Sets all existing MANAGER users to APPROVED (they existed before approval system)
 * 3. Sets all USER accounts to APPROVED
 *
 * Run: npx ts-node -e "import('./src/scripts/fixAdminAndApproval.js')"
 * Or:  node dist/scripts/fixAdminAndApproval.js  (after npm run build)
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const run = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI not set in .env');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log('✅ Connected to MongoDB');

  const db = mongoose.connection.db!;
  const users = db.collection('users');

  // 1. Fix deepikanuti@gmail.com → ADMIN + APPROVED
  const adminResult = await users.updateOne(
    { email: 'deepikanuti@gmail.com' },
    { $set: { role: 'ADMIN', approvalStatus: 'APPROVED', status: 'ACTIVE', isVerified: true } }
  );
  console.log(`✅ Admin fix: ${adminResult.modifiedCount} user updated (deepikanuti@gmail.com → ADMIN)`);

  // 2. All existing managers (without approvalStatus) → APPROVED
  const managerResult = await users.updateMany(
    { role: 'MANAGER', approvalStatus: { $exists: false } },
    { $set: { approvalStatus: 'APPROVED' } }
  );
  console.log(`✅ Existing managers approved: ${managerResult.modifiedCount}`);

  // 3. All users without approvalStatus → APPROVED
  const userResult = await users.updateMany(
    { approvalStatus: { $exists: false } },
    { $set: { approvalStatus: 'APPROVED' } }
  );
  console.log(`✅ Existing users set to APPROVED: ${userResult.modifiedCount}`);

  // 4. Show current state
  const allUsers = await users.find({}, { projection: { email: 1, role: 1, approvalStatus: 1, status: 1 } }).toArray();
  console.log('\n📋 Current users:');
  allUsers.forEach(u => {
    console.log(`  ${u.email} | ${u.role} | approval: ${u.approvalStatus || 'N/A'} | status: ${u.status}`);
  });

  await mongoose.disconnect();
  console.log('\n✅ Migration complete!');
};

run().catch(err => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
