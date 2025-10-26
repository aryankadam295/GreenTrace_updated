import express from "express";
import {
  createInquiry,
  getFarmerInquiries,
  getMerchantInquiries,
  respondToInquiry,
  getInquiry,
  updateInquiryStatus
} from "../controllers/inquiryController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// All routes are protected
router.use(protect);

// Inquiry operations
router.post("/", createInquiry);                     // POST /api/inquiries
router.get("/farmer", getFarmerInquiries);          // GET /api/inquiries/farmer
router.get("/merchant", getMerchantInquiries);      // GET /api/inquiries/merchant
router.get("/:id", getInquiry);                     // GET /api/inquiries/:id
router.put("/:id/respond", respondToInquiry);       // PUT /api/inquiries/:id/respond
router.put("/:id/status", updateInquiryStatus);     // PUT /api/inquiries/:id/status

export default router;
