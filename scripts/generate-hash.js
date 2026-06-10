// Script untuk generate bcrypt hash dari password
// Usage: node scripts/generate-hash.js "your-password-here"

const bcrypt = require('bcryptjs');

const password = process.argv[2] || 'melamun2024';

bcrypt.hash(password, 10, (err, hash) => {
  if (err) {
    console.error('Error generating hash:', err);
    process.exit(1);
  }
  
  console.log('\n✅ Password Hash Generated Successfully!\n');
  console.log('Original Password:', password);
  console.log('\nCopy this hash to your .env.local file:\n');
  console.log('ADMIN_PASSWORD_HASH=' + hash);
  console.log('\n⚠️  IMPORTANT: Jangan commit .env.local ke Git!\n');
});
