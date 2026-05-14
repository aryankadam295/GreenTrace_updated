import axios from "axios";
import fs from "fs";
import FormData from "form-data";

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://127.0.0.1:5001, https://greentrace-updated-1.onrender.com";

const forwardPrediction = async (req, res, fieldName, endpointPath) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: `No ${fieldName} uploaded` });
    }

    const formData = new FormData();
    formData.append(fieldName, fs.createReadStream(req.file.path));
    if (req.body?.crop) {
      formData.append("crop", req.body.crop);
    }

    const endpoint = `${ML_SERVICE_URL}${endpointPath}`;
    const response = await axios.post(endpoint, formData, {
      headers: formData.getHeaders(),
      timeout: 120000,
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    });

    return res.json(response.data);
  } catch (error) {
    const status = error.response?.status || 500;
    const upstream = error.response?.data;
    const message =
      upstream?.message ||
      (error.code === "ECONNREFUSED" ? "ML service is not running on port 5001" : null) ||
      error.message ||
      "Prediction failed";
    const details = upstream?.error || upstream?.details;

    console.error("Crop prediction error:", {
      endpoint: `${ML_SERVICE_URL}${endpointPath}`,
      status,
      message,
      details,
    });

    return res.status(status).json({
      message,
      ...(details ? { details } : {}),
    });
  } finally {
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
  }
};

export const predictCrop = async (req, res) =>
  forwardPrediction(req, res, "image", "/api/predict-crop");

export const predictVideo = async (req, res) =>
  forwardPrediction(req, res, "video", "/api/predict-video");
