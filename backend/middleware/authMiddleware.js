import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protect = async (req, res, next) => {
  // Get token from cookie or Authorization header
  let token = req.cookies.token;

  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }
  }

  if (!token) {
    return res.status(401).json({ message: "Unauthorized, no token" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ✅ FIXED: Always fetch fresh user from DB to check live suspension status
    // This ensures blocked users are rejected even if their token is still valid
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({ message: "Account not found. Please login again." });
    }

    // ✅ FIXED: Block suspended users from ALL protected routes immediately
    if (user.isSuspended) {
      return res.status(403).json({
        message: "Your account has been suspended.",
        reason: user.suspendReason || "Please contact support for more information.",
        suspended: true,  // frontend can use this flag to show a specific screen
      });
    }

    req.user = user; // attach full user object (not just decoded token)
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

// Admin-only middleware
export const adminOnly = async (req, res, next) => {
  try {
    // req.user is already populated by protect() above — no extra DB call needed
    const user = req.user;

    if (!user || user.role !== "admin") {
      return res.status(403).json({
        message: "Access denied. Admin privileges required.",
      });
    }

    next();
  } catch (error) {
    res.status(500).json({ message: "Server error in admin verification" });
  }
};