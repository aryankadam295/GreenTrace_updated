import express from "express";
import "dotenv/config";
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
import merchantCommunityRoutes from "./routes/merchantCommunityRoutes.js";
import schemeRoutes from "./routes/schemeRoutes.js";
import marketPriceRoutes from "./routes/marketPriceRoutes.js";
import assistantRoutes from "./routes/assistantRoutes.js";

const app = express();
const allowedOrigins = new Set(
  (process.env.FRONTEND_URLS || "http://localhost:5173,http://localhost:5174,https://green-trace-updated.vercel.app")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)
);

const isAllowedDevOrigin = (origin) =>
  /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin || "");

// Middleware
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.has(origin) || isAllowedDevOrigin(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`CORS blocked origin: ${origin}`));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "12mb" }));
app.use(express.urlencoded({ extended: true, limit: "12mb" }));
app.use(cookieParser());

// Test Route
app.get("/api/test", (req, res) => {
  res.status(200).json({ message: "Server is working!" });
});

// API Routes
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/inquiries", inquiryRoutes);
app.use("/api/merchant-community", merchantCommunityRoutes);
app.use("/api/merchant", merchantRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/equipment", equipmentRoutes);
app.use("/api", cropRoutes);
app.use("/api/land", landRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/schemes", schemeRoutes);
app.use("/api/market-prices", marketPriceRoutes);
app.use("/api/assistant", assistantRoutes);

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
