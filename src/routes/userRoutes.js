const express = require('express');
const { body } = require('express-validator');
const { listUsers, createUser, updateUser, deleteUser } = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const { USER_ROLES } = require('../utils/constants');

const router = express.Router();

router.use(authenticate, authorize(USER_ROLES.ADMIN));

router.get('/', listUsers);

router.post(
  '/',
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role')
      .isIn([USER_ROLES.RESIDENTIAL, USER_ROLES.COMMERCIAL])
      .withMessage('Role must be residential or commercial'),
  ],
  createUser,
);

router.patch(
  '/:id',
  [
    body('email').optional().isEmail().withMessage('Provide a valid email'),
    body('password').optional().isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role')
      .optional()
      .isIn([USER_ROLES.RESIDENTIAL, USER_ROLES.COMMERCIAL])
      .withMessage('Role must be residential or commercial'),
  ],
  updateUser,
);

router.delete('/:id', deleteUser);

module.exports = router;

