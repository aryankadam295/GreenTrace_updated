import axios from "axios";
import fs from "fs";
import FormData from "form-data";

export const predictCrop = async (req, res) => {
  try {
    const formData = new FormData();

    formData.append("image", fs.createReadStream(req.file.path));

    const response = await axios.post(
      "http://127.0.0.1:5000/predict",
      formData,
      {
        headers: formData.getHeaders(),
      }
    );

    res.json(response.data);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Prediction failed" });
  }
};