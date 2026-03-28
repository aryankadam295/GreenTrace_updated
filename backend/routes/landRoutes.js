import express from 'express';
import {
  createLand,
  getVerifiedLands,
  getLandById,
  getFarmerLands,
  verifyLand,
  getPendingLands,
  getAdminLands,
  viewLandDocument,
  reportLand
} from '../controllers/landController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';
import { uploadLandDocs } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// Public routes
router.get('/', getVerifiedLands);

// Protected routes
router.post('/', protect, uploadLandDocs.fields([
  { name: 'documents', maxCount: 3 },
  { name: 'landImage', maxCount: 1 }
]), createLand);
router.get('/farmer/me', protect, getFarmerLands);
router.get('/document', protect, adminOnly, viewLandDocument);
router.get('/admin/all', protect, adminOnly, getAdminLands);
router.get('/admin/pending', protect, adminOnly, getPendingLands);
router.put('/:id/verify', protect, adminOnly, verifyLand);
router.post('/:id/report', protect, reportLand);
router.get('/:id', getLandById);

export default router;
