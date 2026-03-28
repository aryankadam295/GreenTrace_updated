import axios from "axios";
import fs from "fs";
import FormData from "form-data";

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://127.0.0.1:5001";

const forwardPrediction = async (req, res, fieldName, endpointPath) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: `No ${fieldName} uploaded` });
    }

    const formData = new FormData();
    formData.append(fieldName, fs.createReadStream(req.file.path));

    const endpoint = `${ML_SERVICE_URL}${endpointPath}`;
    const response = await axios.post(endpoint, formData, {
      headers: formData.getHeaders(),
    });

    return res.json(response.data);
  } catch (error) {
    const status = error.response?.status || 500;
    const message = error.response?.data?.message || error.message || "Prediction failed";
    console.error("Crop prediction error:", message);
    return res.status(status).json({ message });
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
