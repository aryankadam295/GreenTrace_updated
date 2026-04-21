import express from "express";
import {
  getDashboardAnalytics,
  getAllUsers,
  getTopPerformers,
  getRecentActivities,
  getRecentTransactions,
  getActivityDistribution,
  getUserDetail,        
  editUser,             
  toggleSuspendUser
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

router.get("/users/:userId",         getUserDetail);  
router.put("/users/:userId",         editUser);           // PUT  /api/admin/users/:userId
router.patch("/users/:userId/suspend", toggleSuspendUser);// PATCH /api/admin/users/:userId/suspend



export default router;
