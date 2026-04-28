import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getCommodityOptions,
  geocodeRegionPoint,
  getLiveMarketPrices,
  getRegionOptions,
} from "../controllers/marketPriceController.js";

const router = express.Router();

router.use(protect);
router.get("/live", getLiveMarketPrices);
router.get("/commodities", getCommodityOptions);
router.get("/options", getRegionOptions);
router.get("/geocode", geocodeRegionPoint);

export default router;
