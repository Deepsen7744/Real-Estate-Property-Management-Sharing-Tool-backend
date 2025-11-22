const express = require('express');
const { body } = require('express-validator');
const {
  createProperty,
  getProperties,
  getPropertyById,
  updateProperty,
  deleteProperty,
  getPropertySummary,
} = require('../controllers/propertyController');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');
const { USER_ROLES } = require('../utils/constants');

const router = express.Router();

router.get('/public/:id', getPropertyById);

router.get('/summary', authenticate, authorize(USER_ROLES.ADMIN), getPropertySummary);

router.get('/', authenticate, getProperties);

router.post(
  '/',
  authenticate,
  authorize(USER_ROLES.ADMIN, USER_ROLES.RESIDENTIAL, USER_ROLES.COMMERCIAL),
  upload.array('images', 8),
  [
    body('title').notEmpty().withMessage('Title is required'),
    body('location').notEmpty().withMessage('Location is required'),
    body('area').notEmpty().withMessage('Area is required'),
    body('rent').isNumeric().withMessage('Rent must be a number'),
    body('deposit').optional().isNumeric().withMessage('Deposit must be a number'),
  ],
  createProperty,
);

router.put(
  '/:id',
  authenticate,
  authorize(USER_ROLES.ADMIN, USER_ROLES.RESIDENTIAL, USER_ROLES.COMMERCIAL),
  upload.array('images', 8),
  [
    body('title').optional().notEmpty(),
    body('location').optional().notEmpty(),
    body('area').optional().notEmpty(),
    body('rent').optional().isNumeric(),
    body('deposit').optional().isNumeric(),
  ],
  updateProperty,
);

router.delete(
  '/:id',
  authenticate,
  authorize(USER_ROLES.ADMIN, USER_ROLES.RESIDENTIAL, USER_ROLES.COMMERCIAL),
  deleteProperty,
);

router.get('/:id', getPropertyById);

module.exports = router;

