const bcrypt = require('bcrypt');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const { USER_ROLES } = require('../utils/constants');

const handleValidation = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return false;
  }
  return true;
};

const listUsers = async (req, res) => {
  const users = await User.find().select('-passwordHash').lean();
  const formatted = users.map((user) => ({
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
  }));
  res.json(formatted);
};

const createUser = async (req, res) => {
  if (!handleValidation(req, res)) return;

  const { name, email, password, role } = req.body;

  const existing = await User.findOne({ email });
  if (existing) {
    return res.status(400).json({ message: 'User already exists with this email' });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await User.create({
    name,
    email,
    passwordHash,
    role,
  });

  res.status(201).json({
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
  });
};

const updateUser = async (req, res) => {
  if (!handleValidation(req, res)) return;

  const { id } = req.params;
  const { name, email, password, role } = req.body;

  const user = await User.findById(id);

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  user.name = name ?? user.name;
  user.email = email ?? user.email;

  if (role && Object.values(USER_ROLES).includes(role)) {
    user.role = role;
  }

  if (password) {
    user.passwordHash = await bcrypt.hash(password, 10);
  }

  await user.save();

  res.json({
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
  });
};

const deleteUser = async (req, res) => {
  const { id } = req.params;

  const user = await User.findById(id);

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  if (user.role === USER_ROLES.ADMIN) {
    return res.status(400).json({ message: 'Cannot delete admin account' });
  }

  await user.deleteOne();
  res.json({ message: 'User removed' });
};

module.exports = {
  listUsers,
  createUser,
  updateUser,
  deleteUser,
};

