import express from "express";
import {
  getDashboardAnalytics,
  getAllUsers,
  getTopPerformers,
  getRecentActivities,
  getRecentTransactions,
  getActivityDistribution
} from "../controllers/adminController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

// All routes are protected and admin-only
router.use(protect);
router.use(adminOnly);

// ---------- DASHBOARD ANALYTICS ----------
router.get("/analytics", getDashboardAnalytics);           // GET /api/admin/analytics
router.get("/activity-distribution", getActivityDistribution); // GET /api/admin/activity-distribution

// ---------- USER MANAGEMENT ----------
router.get("/users", getAllUsers);                         // GET /api/admin/users

// ---------- TOP PERFORMERS ----------
router.get("/top-performers", getTopPerformers);           // GET /api/admin/top-performers

// ---------- ACTIVITIES & TRANSACTIONS ----------
router.get("/activities", getRecentActivities);            // GET /api/admin/activities
router.get("/transactions", getRecentTransactions);        // GET /api/admin/transactions

export default router;
