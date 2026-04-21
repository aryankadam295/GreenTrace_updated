import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import multer from "multer";
import paymentRoutes from "./routes/upiPaymentRoute.js";

import connectDB from "./config/db.js";

import userRoutes from "./routes/userRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import inquiryRoutes from "./routes/inquiryRoutes.js";
import merchantRoutes from "./routes/merchantRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import equipmentRoutes from "./routes/equipmentRoutes.js";
import cropRoutes from "./routes/cropRoutes.js";
import landRoutes from "./routes/landRoutes.js";

dotenv.config();

const app = express();

// Middleware
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:5174"],
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

// Test Route
app.get("/api/test", (req, res) => {
  res.status(200).json({ message: "Server is working!" });
});

// API Routes
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/inquiries", inquiryRoutes);
app.use("/api/merchant", merchantRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/equipment", equipmentRoutes);
app.use("/api", cropRoutes);
app.use("/api/land", landRoutes);
app.use("/api/payments", paymentRoutes);

// Static files
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// Error handler
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        message: "One of the uploaded files is too large. Maximum allowed size is 25MB per file.",
      });
    }
    return res.status(400).json({ message: err.message });
  }

  if (err) {
    return res.status(500).json({
      message: err.message || "Internal server error",
    });
  }

  next();
});

// Database connection
connectDB();

// Server start
const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});