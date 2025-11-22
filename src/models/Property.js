const mongoose = require('mongoose');
const { PROPERTY_TYPES } = require('../utils/constants');

const propertySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: Object.values(PROPERTY_TYPES),
      required: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    area: {
      type: String,
      required: true,
      trim: true,
    },
    mapsLink: {
      type: String,
    },
    rent: {
      type: Number,
      required: true,
      min: 0,
    },
    deposit: {
      type: Number,
      min: 0,
    },
    features: [
      {
        type: String,
        trim: true,
      },
    ],
    ownerDetails: {
      type: String,
      trim: true,
    },
    images: [
      {
        type: String,
        required: true,
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model('Property', propertySchema);

