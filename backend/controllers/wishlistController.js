import Wishlist from "../models/Wishlist.js";
import Product from "../models/Product.js";

// ---------- GET WISHLIST ----------
export const getWishlist = async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({ merchantId: req.user.id })
      .populate({
        path: 'items.productId',
        select: 'productName category price quantity unit qualityGrade farmerName farmerLocation status images'
      });

    if (!wishlist) {
      return res.status(200).json({ 
        wishlist: { items: [] },
        message: "Wishlist is empty"
      });
    }

    // Filter out items where product is no longer available
    const validItems = wishlist.items.filter(item => 
      item.productId && item.productId.status === 'listed'
    );

    if (validItems.length !== wishlist.items.length) {
      wishlist.items = validItems;
      await wishlist.save();
    }

    res.status(200).json({ wishlist });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ---------- ADD TO WISHLIST ----------
export const addToWishlist = async (req, res) => {
  try {
    const { productId } = req.body;
    const merchantId = req.user.id;

    // Check if product exists and is available
    const product = await Product.findById(productId);
    if (!product || product.status !== 'listed') {
      return res.status(404).json({ message: "Product not found or not available" });
    }

    // Find or create wishlist
    let wishlist = await Wishlist.findOne({ merchantId });
    if (!wishlist) {
      wishlist = new Wishlist({ merchantId, items: [] });
    }

    // Check if product already in wishlist
    const existingItem = wishlist.items.find(
      item => item.productId.toString() === productId
    );

    if (existingItem) {
      return res.status(400).json({ message: "Product already in wishlist" });
    }

    // Add new item
    wishlist.items.push({ productId });
    await wishlist.save();

    // Populate and return updated wishlist
    await wishlist.populate({
      path: 'items.productId',
      select: 'productName category price quantity unit qualityGrade farmerName'
    });

    res.status(200).json({
      message: "Product added to wishlist successfully",
      wishlist
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ---------- REMOVE FROM WISHLIST ----------
export const removeFromWishlist = async (req, res) => {
  try {
    const { productId } = req.params;
    const merchantId = req.user.id;

    const wishlist = await Wishlist.findOne({ merchantId });
    if (!wishlist) {
      return res.status(404).json({ message: "Wishlist not found" });
    }

    const initialLength = wishlist.items.length;
    wishlist.items = wishlist.items.filter(
      item => item.productId.toString() !== productId
    );

    if (wishlist.items.length === initialLength) {
      return res.status(404).json({ message: "Product not found in wishlist" });
    }

    await wishlist.save();

    await wishlist.populate({
      path: 'items.productId',
      select: 'productName category price quantity unit qualityGrade farmerName'
    });

    res.status(200).json({
      message: "Product removed from wishlist successfully",
      wishlist
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ---------- CLEAR WISHLIST ----------
export const clearWishlist = async (req, res) => {
  try {
    const merchantId = req.user.id;

    await Wishlist.findOneAndUpdate(
      { merchantId },
      { items: [] },
      { upsert: true }
    );

    res.status(200).json({ message: "Wishlist cleared successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ---------- MOVE TO CART ----------
export const moveToCart = async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    const merchantId = req.user.id;

    // Check if product exists and is available
    const product = await Product.findById(productId);
    if (!product || product.status !== 'listed') {
      return res.status(404).json({ message: "Product not found or not available" });
    }

    // Remove from wishlist
    const wishlist = await Wishlist.findOne({ merchantId });
    if (wishlist) {
      wishlist.items = wishlist.items.filter(
        item => item.productId.toString() !== productId
      );
      await wishlist.save();
    }

    // Add to cart logic would go here
    // For now, just return success message
    res.status(200).json({
      message: "Product moved to cart successfully"
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
