import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

// ---------- SIGNUP ----------
export const signupUser = async (req, res) => {
  try {
    const {
      fullName,
      email,
      password,
      phoneNumber,
      role,
      // Farmer fields
      village,
      district,
      state,
      cropsGrown,
      landSize,
      // Merchant fields
      businessName,
      businessType,
      productsOfInterest,
      city,
      merchantState
    } = req.body;

    // Validate required fields
    if (!fullName || !email || !password || !phoneNumber || !role) {
      return res.status(400).json({ message: "Please fill all required fields" });
    }

    // Role-specific validation
    if (role === 'farmer') {
      if (!village || !district || !state) {
        return res.status(400).json({ message: "Please fill all farmer-specific fields (village, district, state)" });
      }
    } else if (role === 'merchant') {
      if (!businessName || !businessType || !city || !merchantState) {
        return res.status(400).json({ message: "Please fill all merchant-specific fields (business name, type, city, state)" });
      }
    } else if (role === 'admin') {
      // Admin registration is restricted - only allow through direct database insertion
      return res.status(403).json({ message: "Admin registration is not allowed through this endpoint" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "User already exists" });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user data object
    const userData = {
      fullName,
      email,
      password: hashedPassword,
      phoneNumber,
      role
    };

    // Add role-specific fields
    if (role === 'farmer') {
      userData.village = village;
      userData.district = district;
      userData.state = state;
      if (cropsGrown) userData.cropsGrown = cropsGrown; // Optional field
      if (landSize) userData.landSize = landSize;
    } else if (role === 'merchant') {
      userData.businessName = businessName;
      userData.businessType = businessType;
      if (productsOfInterest) userData.productsOfInterest = productsOfInterest; // Optional field
      userData.city = city;
      userData.merchantState = merchantState;
    }

    // Create new user
    const newUser = await User.create(userData);

    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email,
        role: newUser.role
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ---------- LOGIN ----------
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // ✅ Send token as HTTP-only cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // true on HTTPS
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(200).json({
      message: "Login successful",
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
export const logoutUser = (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
  });
  res.status(200).json({ message: "Logged out successfully" });
};
