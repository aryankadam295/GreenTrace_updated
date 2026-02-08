import multer from 'multer';
import path from 'path';
import fs from 'fs';

<<<<<<< HEAD
// Ensure upload directory exists
const uploadDir = 'uploads/products';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp
=======
// Ensure upload directories exist
const productUploadDir = 'uploads/products';
const equipmentUploadDir = 'uploads/equipment';

if (!fs.existsSync(productUploadDir)) {
  fs.mkdirSync(productUploadDir, { recursive: true });
}

if (!fs.existsSync(equipmentUploadDir)) {
  fs.mkdirSync(equipmentUploadDir, { recursive: true });
}

// Storage configuration for products
const productStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, productUploadDir);
  },
  filename: (req, file, cb) => {
>>>>>>> origin/pranav-equipment-sharing
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

<<<<<<< HEAD
=======
// Storage configuration for equipment
const equipmentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, equipmentUploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'equipment-' + uniqueSuffix + path.extname(file.originalname));
  }
});

>>>>>>> origin/pranav-equipment-sharing
// File filter to allow only images
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

<<<<<<< HEAD
// Multer configuration
const upload = multer({
  storage: storage,
=======
// Multer configuration for products
const upload = multer({
  storage: productStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit per file
    files: 5 // Maximum 5 files
  },
  fileFilter: fileFilter
});

// Multer configuration for equipment
export const uploadEquipment = multer({
  storage: equipmentStorage,
>>>>>>> origin/pranav-equipment-sharing
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit per file
    files: 5 // Maximum 5 files
  },
  fileFilter: fileFilter
});

export default upload;
