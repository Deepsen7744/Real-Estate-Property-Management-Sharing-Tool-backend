const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const configureCloudinary = require('../config/cloudinary');

const uploadsDir = path.join(__dirname, '../../uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const diskStorage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    callback(null, uploadsDir);
  },
  filename: (_req, file, callback) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    callback(null, `${unique}${ext}`);
  },
});

const resolveStorage = () => {
  try {
    const cloudinary = configureCloudinary();
    return new CloudinaryStorage({
      cloudinary,
      params: {
        folder: 'zikrabyte-properties',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        transformation: [{ quality: 'auto' }],
      },
    });
  } catch (error) {
    console.warn('Cloudinary not configured, using local storage. Reason:', error.message);
    return diskStorage;
  }
};

const upload = multer({
  storage: resolveStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 8,
  },
});

module.exports = upload;

