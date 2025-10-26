import express from "express";
import { signupUser, loginUser, logoutUser } from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/signup", signupUser);
router.post("/login", loginUser);
router.post("/logout", logoutUser);

// Protected route to test authentication
router.get("/profile", protect, (req, res) => {
  res.json({
    message: "Access granted to protected route",
    user: req.user
  });
});

export default router;
