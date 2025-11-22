const { validationResult } = require('express-validator');
const Property = require('../models/Property');
const { PROPERTY_TYPES, USER_ROLES } = require('../utils/constants');

const handleValidation = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return false;
  }
  return true;
};

const toNumber = (value) => {
  if (value === undefined || value === null || value === '') return undefined;
  return Number(value);
};

const normalizeFeatures = (features) => {
  if (!features) return [];

  if (Array.isArray(features)) {
    return features.filter(Boolean).map((f) => f.trim()).filter(Boolean);
  }

  return String(features)
    .split(',')
    .map((f) => f.trim())
    .filter(Boolean);
};

const ensureOwnership = (property, user) => {
  if (user.role === USER_ROLES.ADMIN) return true;
  return property.createdBy.toString() === user._id.toString();
};

const formatImagePath = (file) => {
  if (!file) return null;
  if (file.path && file.path.startsWith('http')) {
    return file.path;
  }
  if (file.path && file.path.includes('uploads')) {
    const relative = file.path.substring(file.path.lastIndexOf('uploads')).replace(/\\/g, '/');
    return relative.startsWith('/') ? relative : `/${relative}`;
  }
  if (file.filename) {
    return `/uploads/${file.filename}`;
  }
  return file.path || null;
};

const createProperty = async (req, res) => {
  if (!handleValidation(req, res)) return;

  const images = (req.files || []).map(formatImagePath).filter(Boolean);

  if (!images.length) {
    return res.status(400).json({ message: 'At least one image is required' });
  }

  const { title, location, area, mapsLink, rent, deposit, features, ownerDetails, type } = req.body;

  let resolvedType = type;
  if (req.user.role === USER_ROLES.RESIDENTIAL) {
    resolvedType = PROPERTY_TYPES.RESIDENTIAL;
  } else if (req.user.role === USER_ROLES.COMMERCIAL) {
    resolvedType = PROPERTY_TYPES.COMMERCIAL;
  } else if (!resolvedType) {
    resolvedType = PROPERTY_TYPES.RESIDENTIAL;
  }

  const property = await Property.create({
    title,
    location,
    area,
    mapsLink,
    rent: Number(rent),
    deposit: toNumber(deposit),
    features: normalizeFeatures(features),
    ownerDetails,
    images,
    type: resolvedType,
    createdBy: req.user._id,
  });

  res.status(201).json(property);
};

const getProperties = async (req, res) => {
  const { type, area, search, createdBy, page = 1, limit = 20 } = req.query;

  const filters = {};
  if (type && Object.values(PROPERTY_TYPES).includes(type)) {
    filters.type = type;
  }
  if (area) {
    filters.area = new RegExp(area, 'i');
  }
  if (search) {
    filters.$or = [
      { title: new RegExp(search, 'i') },
      { location: new RegExp(search, 'i') },
      { area: new RegExp(search, 'i') },
    ];
  }
  if (req.user?.role === USER_ROLES.ADMIN && createdBy) {
    filters.createdBy = createdBy;
  } else if (req.user?.role !== USER_ROLES.ADMIN) {
    filters.createdBy = req.user._id;
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [items, total] = await Promise.all([
    Property.find(filters)
      .populate('createdBy', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Property.countDocuments(filters),
  ]);

  res.json({
    items,
    pagination: {
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    },
  });
};

const getPropertyById = async (req, res) => {
  const { id } = req.params;
  const property = await Property.findById(id).populate('createdBy', 'name email role');
  if (!property) {
    return res.status(404).json({ message: 'Property not found' });
  }
  res.json(property);
};

const updateProperty = async (req, res) => {
  if (!handleValidation(req, res)) return;

  const { id } = req.params;
  const property = await Property.findById(id);

  if (!property) {
    return res.status(404).json({ message: 'Property not found' });
  }

  if (!ensureOwnership(property, req.user)) {
    return res.status(403).json({ message: 'You can only edit your own properties' });
  }

  const updates = req.body;

  if (updates.features) {
    updates.features = normalizeFeatures(updates.features);
  }

  if (req.files?.length) {
    updates.images = req.files.map(formatImagePath).filter(Boolean);
  }

  if (updates.rent !== undefined) {
    updates.rent = Number(updates.rent);
  }
  if (updates.deposit !== undefined) {
    updates.deposit = toNumber(updates.deposit);
  }
  if (updates.type && req.user.role !== USER_ROLES.ADMIN) {
    delete updates.type;
  }

  Object.assign(property, updates);
  await property.save();

  res.json(property);
};

const deleteProperty = async (req, res) => {
  const { id } = req.params;
  const property = await Property.findById(id);

  if (!property) {
    return res.status(404).json({ message: 'Property not found' });
  }

  if (!ensureOwnership(property, req.user)) {
    return res.status(403).json({ message: 'You can only delete your own properties' });
  }

  await property.deleteOne();
  res.json({ message: 'Property deleted' });
};

const getPropertySummary = async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [total, todayCount, residentialCount, commercialCount] = await Promise.all([
    Property.countDocuments(),
    Property.countDocuments({ createdAt: { $gte: today } }),
    Property.countDocuments({ type: PROPERTY_TYPES.RESIDENTIAL }),
    Property.countDocuments({ type: PROPERTY_TYPES.COMMERCIAL }),
  ]);

  res.json({
    total,
    today: todayCount,
    residential: residentialCount,
    commercial: commercialCount,
  });
};

module.exports = {
  createProperty,
  getProperties,
  getPropertyById,
  updateProperty,
  deleteProperty,
  getPropertySummary,
};

