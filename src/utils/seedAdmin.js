const bcrypt = require('bcrypt');
const User = require('../models/User');
const { USER_ROLES } = require('./constants');

const seedAdminUser = async () => {
  const name = process.env.ADMIN_NAME;
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!name || !email || !password) {
    console.info('Admin credentials not provided. Skipping admin seeding.');
    return;
  }

  const existingAdmin = await User.findOne({ role: USER_ROLES.ADMIN });
  if (existingAdmin) {
    console.info('Admin account already exists. Skipping seeding.');
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await User.create({
    name,
    email,
    passwordHash,
    role: USER_ROLES.ADMIN,
  });
  console.log(`Seeded admin user (${email}).`);
};

module.exports = seedAdminUser;

