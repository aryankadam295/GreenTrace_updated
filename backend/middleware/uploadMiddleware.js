import '../config/env.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { S3Client } from '@aws-sdk/client-s3';
import multerS3 from 'multer-s3';

// ===============================
// AWS S3 Configuration
// ===============================
const s3 = new S3Client({
  region: process.env.AWS_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'dummy',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'dummy',
  },
});

// ===============================
// Ensure upload directories exist
// ===============================
const productUploadDir = 'uploads/products';
const equipmentUploadDir = 'uploads/equipment';
const landUploadDir = 'uploads/land';

if (!fs.existsSync(productUploadDir)) {
  fs.mkdirSync(productUploadDir, { recursive: true });
}

if (!fs.existsSync(equipmentUploadDir)) {
  fs.mkdirSync(equipmentUploadDir, { recursive: true });
}

if (!fs.existsSync(landUploadDir)) {
  fs.mkdirSync(landUploadDir, { recursive: true });
}

// ===============================
// Allowed file types (images only)
// ===============================
const allowedTypes = /jpeg|jpg|png|gif/;
const allowedDocumentTypes = /jpeg|jpg|png|pdf/;

// ===============================
// File filter for images
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
// File filter for documents (PDF + images)
// ===============================
const documentFilter = (req, file, cb) => {
  if (file.fieldname === 'landImage') {
    return fileFilter(req, file, cb);
  }

  const extname = allowedDocumentTypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimetype = allowedDocumentTypes.test(file.mimetype) || file.mimetype === 'application/pdf';

  if (mimetype && extname) {
    cb(null, true);
  } else {
    cb(new Error('Only images and PDF files are allowed!'), false);
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
// Storage for land documents (local fallback)
// ===============================
const landStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, landUploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix =
      Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(
      null,
      'land-' +
        file.fieldname +
        '-' +
        uniqueSuffix +
        path.extname(file.originalname)
    );
  },
});

const shouldUseS3ForUploads =
  process.env.FILE_STORAGE !== 'local' &&
  process.env.AWS_ACCESS_KEY_ID &&
  process.env.AWS_SECRET_ACCESS_KEY &&
  process.env.AWS_S3_BUCKET_NAME;

const createS3Storage = (folder) =>
  multerS3({
    s3: s3,
    bucket: process.env.AWS_S3_BUCKET_NAME,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, `${folder}/${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
  });

// ===============================
// Multer upload for products
// ===============================
const upload = multer({
  storage: shouldUseS3ForUploads ? createS3Storage('products') : productStorage,
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
  storage: shouldUseS3ForUploads ? createS3Storage('equipment') : equipmentStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB per file
    files: 5,
  },
  fileFilter,
});

// ===============================
// Multer upload for land documents (AWS S3)
// ===============================
export const uploadLandDocs = multer({
  storage: shouldUseS3ForUploads
    ? createS3Storage('land')
    : landStorage,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB per file
    files: 4,
  },
  fileFilter: documentFilter,
});

export default upload;
