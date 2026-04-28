import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { getFarmerSchemes } from "../controllers/schemeController.js";

const router = express.Router();

router.get("/farmer", protect, getFarmerSchemes);

export default router;
