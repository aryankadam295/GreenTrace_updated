import multer from 'multer';
import path from 'path';
import fs from 'fs';

// ===============================
// Ensure upload directories exist
// ===============================
const productUploadDir = 'uploads/products';
const equipmentUploadDir = 'uploads/equipment';

if (!fs.existsSync(productUploadDir)) {
  fs.mkdirSync(productUploadDir, { recursive: true });
}

if (!fs.existsSync(equipmentUploadDir)) {
  fs.mkdirSync(equipmentUploadDir, { recursive: true });
}

// ===============================
// Allowed file types (images only)
// ===============================
const allowedTypes = /jpeg|jpg|png|gif/;

// ===============================
// File filter
// ===============================
const fileFilter = (req, file, cb) => {
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

// ===============================
// Storage for product images
// ===============================
const productStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, productUploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix =
      Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname +
        '-' +
        uniqueSuffix +
        path.extname(file.originalname)
    );
  },
});

// ===============================
// Storage for equipment images
// ===============================
const equipmentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, equipmentUploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix =
      Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(
      null,
      'equipment-' +
        uniqueSuffix +
        path.extname(file.originalname)
    );
  },
});

// ===============================
// Multer upload for products
// ===============================
const upload = multer({
  storage: productStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB per file
    files: 5, // Max 5 files
  },
  fileFilter,
});

// ===============================
// Multer upload for equipment
// ===============================
export const uploadEquipment = multer({
  storage: equipmentStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB per file
    files: 5,
  },
  fileFilter,
});

export default upload;
