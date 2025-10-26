import express from "express";
import {
  createProduct,
  getFarmerProducts,
  getProduct,
  updateProduct,
  deleteProduct,
  getFarmerAnalytics
} from "../controllers/productController.js";
import { protect } from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";

const router = express.Router();

// All routes are protected
router.use(protect);

// Product CRUD operations
router.post("/", upload.array('images', 5), createProduct);  // POST /api/products
router.get("/farmer", getFarmerProducts);          // GET /api/products/farmer
router.get("/analytics", getFarmerAnalytics);      // GET /api/products/analytics
router.get("/:id", getProduct);                    // GET /api/products/:id
router.put("/:id", upload.array('images', 5), updateProduct); // PUT /api/products/:id
router.delete("/:id", deleteProduct);              // DELETE /api/products/:id

export default router;
