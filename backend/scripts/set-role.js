require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const User = require('../models/User');

const ROLES = ['admin', 'customer'];

async function main() {
  const [rawEmail, role] = process.argv.slice(2);
  if (!rawEmail || !ROLES.includes(role)) {
    console.error('Usage: npm run set-role -- <email> <admin|customer>');
    process.exit(1);
  }
  if (!process.env.MONGO_URL) {
    console.error('MONGO_URL is not set. Add it to backend/.env.');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URL);
  console.log(`Connected to ${mongoose.connection.host}/${mongoose.connection.name}`);

  const email = rawEmail.trim().toLowerCase();
  const user = await User.findOneAndUpdate({ email }, { role }, { new: true });
  if (user) {
    console.log(`${user.email} is now: ${user.role}`);
  } else {
    console.error(`No account found for ${email}. Sign up on the site first, then run this again.`);
    process.exitCode = 1;
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
