import express from "express";
import upload from "../middleware/upload.js";
import { predictCrop, predictVideo } from "../controllers/cropController.js";

const router = express.Router();

router.post("/predict-crop", upload.single("image"), predictCrop);
router.post("/predict-video", upload.single("video"), predictVideo);

export default router;
