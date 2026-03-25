import express from "express";
import upload from "../middleware/upload.js";
import { predictCrop } from "../controllers/cropController.js";

const router = express.Router();

router.post("/predict-crop", upload.single("image"), predictCrop);

export default router;