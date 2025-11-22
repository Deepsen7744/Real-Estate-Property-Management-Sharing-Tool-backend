const bcrypt = require('bcrypt');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const { USER_ROLES } = require('../utils/constants');
const generateToken = require('../utils/token');

const handleValidation = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return false;
  }
  return true;
};

const registerAdmin = async (req, res) => {
  if (!handleValidation(req, res)) return;

  const existingAdmin = await User.findOne({ role: USER_ROLES.ADMIN });
  if (existingAdmin) {
    return res.status(400).json({ message: 'Admin already exists' });
  }

  const { name, email, password } = req.body;

  const passwordHash = await bcrypt.hash(password, 10);

  const admin = await User.create({
    name,
    email,
    passwordHash,
    role: USER_ROLES.ADMIN,
  });

  res.status(201).json({
    user: {
      id: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
    },
    token: generateToken(admin),
  });
};

const login = async (req, res) => {
  if (!handleValidation(req, res)) return;

  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);

  if (!isMatch) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  res.json({
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    token: generateToken(user),
  });
};

module.exports = {
  registerAdmin,
  login,
};

