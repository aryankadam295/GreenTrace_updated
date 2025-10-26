import express from "express";
import {
  browseProducts,
  getMerchantAnalytics,
  getProductCategories,
  getFarmerProfile,
  getSearchSuggestions
} from "../controllers/merchantController.js";
import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart
} from "../controllers/cartController.js";
import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  clearWishlist,
  moveToCart
} from "../controllers/wishlistController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// All routes are protected
router.use(protect);

// ---------- PRODUCT BROWSING ----------
router.get("/products", browseProducts);                    // GET /api/merchant/products
router.get("/products/categories", getProductCategories);   // GET /api/merchant/products/categories
router.get("/products/search", getSearchSuggestions);       // GET /api/merchant/products/search

// ---------- FARMER PROFILES ----------
router.get("/farmers/:farmerId", getFarmerProfile);         // GET /api/merchant/farmers/:farmerId

// ---------- ANALYTICS ----------
router.get("/analytics", getMerchantAnalytics);             // GET /api/merchant/analytics

// ---------- CART MANAGEMENT ----------
router.get("/cart", getCart);                               // GET /api/merchant/cart
router.post("/cart", addToCart);                            // POST /api/merchant/cart
router.put("/cart", updateCartItem);                        // PUT /api/merchant/cart
router.delete("/cart/:productId", removeFromCart);          // DELETE /api/merchant/cart/:productId
router.delete("/cart", clearCart);                          // DELETE /api/merchant/cart

// ---------- WISHLIST MANAGEMENT ----------
router.get("/wishlist", getWishlist);                       // GET /api/merchant/wishlist
router.post("/wishlist", addToWishlist);                    // POST /api/merchant/wishlist
router.delete("/wishlist/:productId", removeFromWishlist);  // DELETE /api/merchant/wishlist/:productId
router.delete("/wishlist", clearWishlist);                  // DELETE /api/merchant/wishlist
router.post("/wishlist/move-to-cart", moveToCart);          // POST /api/merchant/wishlist/move-to-cart

export default router;
