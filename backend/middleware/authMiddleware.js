import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protect = (req, res, next) => {
  // First try to get token from cookies
  let token = req.cookies.token;

  // If no cookie token, try Authorization header
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
    req.user = decoded; // contains user ID and email
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

// Admin-only middleware
export const adminOnly = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user || user.role !== 'admin') {
      return res.status(403).json({
        message: "Access denied. Admin privileges required."
      });
    }

    next();
  } catch (error) {
    res.status(500).json({ message: "Server error in admin verification" });
  }
};
