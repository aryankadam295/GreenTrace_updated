import Cart from "../models/Cart.js";
import Product from "../models/Product.js";

// ---------- GET CART ----------
export const getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ merchantId: req.user.id })
      .populate({
        path: 'items.productId',
        select: 'productName category price quantity unit qualityGrade farmerName farmerLocation status'
      });

    if (!cart) {
      return res.status(200).json({ 
        cart: { items: [], totalAmount: 0 },
        message: "Cart is empty"
      });
    }

    // Filter out items where product is no longer available
    const validItems = cart.items.filter(item => 
      item.productId && item.productId.status === 'listed'
    );

    if (validItems.length !== cart.items.length) {
      cart.items = validItems;
      await cart.save();
    }

    res.status(200).json({ cart });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ---------- ADD TO CART ----------
export const addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    const merchantId = req.user.id;
    const parsedQuantity = Number(quantity);

    // Check if product exists and is available
    const product = await Product.findById(productId);
    if (!product || product.status !== 'listed') {
      return res.status(404).json({ message: "Product not found or not available" });
    }

    if (!Number.isFinite(parsedQuantity) || parsedQuantity <= 0) {
      return res.status(400).json({ message: "Quantity must be greater than 0" });
    }

    // Check if requested quantity is available
    if (parsedQuantity > product.quantity) {
      return res.status(400).json({ 
        message: `Only ${product.quantity} ${product.unit} available` 
      });
    }

    // Find or create cart
    let cart = await Cart.findOne({ merchantId });
    if (!cart) {
      cart = new Cart({ merchantId, items: [] });
    }

    // Check if product already in cart
    const existingItemIndex = cart.items.findIndex(
      item => item.productId.toString() === productId
    );

    if (existingItemIndex > -1) {
      // Update quantity
      const newQuantity = cart.items[existingItemIndex].quantity + parsedQuantity;
      if (newQuantity > product.quantity) {
        return res.status(400).json({ 
          message: `Cannot add more. Only ${product.quantity} ${product.unit} available` 
        });
      }
      cart.items[existingItemIndex].quantity = newQuantity;
    } else {
      // Add new item
      cart.items.push({
        productId,
        quantity: parsedQuantity,
        priceAtTime: product.price
      });
    }

    await cart.save();

    // Populate and return updated cart
    await cart.populate({
      path: 'items.productId',
      select: 'productName category price quantity unit qualityGrade farmerName'
    });

    res.status(200).json({
      message: "Product added to cart successfully",
      cart
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ---------- UPDATE CART ITEM ----------
export const updateCartItem = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const merchantId = req.user.id;
    const parsedQuantity = Number(quantity);

    if (!Number.isFinite(parsedQuantity) || parsedQuantity <= 0) {
      return res.status(400).json({ message: "Quantity must be greater than 0" });
    }

    const cart = await Cart.findOne({ merchantId });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    const itemIndex = cart.items.findIndex(
      item => item.productId.toString() === productId
    );

    if (itemIndex === -1) {
      return res.status(404).json({ message: "Product not found in cart" });
    }

    // Check product availability
    const product = await Product.findById(productId);
    if (!product || product.status !== 'listed') {
      return res.status(404).json({ message: "Product not available" });
    }

    if (parsedQuantity > product.quantity) {
      return res.status(400).json({ 
        message: `Only ${product.quantity} ${product.unit} available` 
      });
    }

    cart.items[itemIndex].quantity = parsedQuantity;
    await cart.save();

    await cart.populate({
      path: 'items.productId',
      select: 'productName category price quantity unit qualityGrade farmerName'
    });

    res.status(200).json({
      message: "Cart updated successfully",
      cart
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ---------- REMOVE FROM CART ----------
export const removeFromCart = async (req, res) => {
  try {
    const { productId } = req.params;
    const merchantId = req.user.id;

    const cart = await Cart.findOne({ merchantId });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    cart.items = cart.items.filter(
      item => item.productId.toString() !== productId
    );

    await cart.save();

    await cart.populate({
      path: 'items.productId',
      select: 'productName category price quantity unit qualityGrade farmerName'
    });

    res.status(200).json({
      message: "Product removed from cart successfully",
      cart
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ---------- CLEAR CART ----------
export const clearCart = async (req, res) => {
  try {
    const merchantId = req.user.id;

    await Cart.findOneAndUpdate(
      { merchantId },
      { items: [], totalAmount: 0 },
      { upsert: true }
    );

    res.status(200).json({ message: "Cart cleared successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
