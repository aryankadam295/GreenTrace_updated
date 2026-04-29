import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { verifyFirebaseIdToken } from "../utils/firebaseAdmin.js";

const validateRoleFields = (role, data) => {
  if (role === "farmer") {
    if (!data.village || !data.district || !data.state) {
      return "Please fill all farmer-specific fields (village, district, state)";
    }
  } else if (role === "merchant") {
    if (!data.businessName || !data.businessType || !data.city || !data.merchantState) {
      return "Please fill all merchant-specific fields (business name, type, city, state)";
    }
  } else if (role === "admin") {
    return "Admin registration is not allowed through this endpoint";
  }

  return null;
};

const buildUserResponse = (user) => ({
  id: user._id,
  fullName: user.fullName,
  email: user.email,
  role: user.role,
  phoneNumber: user.phoneNumber,
  authProvider: user.authProvider,
  businessName: user.businessName,
  businessType: user.businessType,
  productsOfInterest: user.productsOfInterest,
  city: user.city,
  merchantState: user.merchantState,
  village: user.village,
  district: user.district,
  state: user.state,
  cropsGrown: user.cropsGrown,
  landSize: user.landSize,
  profileImage: user.profileImage,
});

const issueAuthResponse = (res, user, message) => {
  const token = jwt.sign(
    { id: user._id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return res.status(200).json({
    message,
    token,
    user: buildUserResponse(user),
  });
};

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

    if (!fullName || !email || !password || !phoneNumber || !role) {
      return res.status(400).json({ message: "Please fill all required fields" });
    }

    const roleValidationError = validateRoleFields(role, req.body);
    if (roleValidationError) {
      return res.status(role === "admin" ? 403 : 400).json({
        message: roleValidationError
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser)
      return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const userData = {
      fullName,
      email: normalizedEmail,
      password: hashedPassword,
      phoneNumber,
      role,
      authProvider: "local"
    };

    if (role === 'farmer') {
      userData.village  = village;
      userData.district = district;
      userData.state    = state;
      if (cropsGrown) userData.cropsGrown = cropsGrown;
      if (landSize)   userData.landSize   = landSize;
    } else if (role === 'merchant') {
      userData.businessName  = businessName;
      userData.businessType  = businessType;
      userData.city          = city;
      userData.merchantState = merchantState;
      if (productsOfInterest) userData.productsOfInterest = productsOfInterest;
    }

    const newUser = await User.create(userData);

    res.status(201).json({
      message: "User registered successfully",
      user: buildUserResponse(newUser),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ---------- LOGIN ----------
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email?.toLowerCase().trim() });
    if (!user)
      return res.status(404).json({ message: "User not found" });

    // ✅ FIXED: Block suspended users at login — before even checking password
    if (user.isSuspended) {
      return res.status(403).json({
        message: "Your account has been suspended.",
        reason: user.suspendReason || "Please contact support for more information.",
        suspended: true, // frontend can use this to show a specific error UI
      });
    }

    if (!user.password) {
      return res.status(400).json({
        message: "This account uses Google sign-in. Please continue with Google."
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

    return issueAuthResponse(res, user, "Login successful");
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ---------- GOOGLE AUTH ----------
export const googleAuthUser = async (req, res) => {
  try {
    const {
      idToken,
      fullName,
      email,
      phoneNumber,
      role,
      village,
      district,
      state,
      cropsGrown,
      landSize,
      businessName,
      businessType,
      productsOfInterest,
      city,
      merchantState
    } = req.body;

    if (!idToken) {
      return res.status(400).json({ message: "Google ID token is required" });
    }

    let decodedToken;
    try {
      decodedToken = await verifyFirebaseIdToken(idToken);
    } catch (verifyError) {
      console.error("Firebase token verification failed:", verifyError.code || verifyError.message);
      const isConfigError =
        verifyError.message?.includes("Firebase Admin is not configured") ||
        verifyError.message?.includes("Failed to parse private key");

      return res.status(isConfigError ? 500 : 401).json({
        message: isConfigError
          ? "Google authentication is not configured correctly on the server."
          : "Google sign-in token could not be verified. Please try signing in again.",
      });
    }
    const googleEmail = decodedToken.email?.toLowerCase().trim();

    if (!googleEmail) {
      return res.status(400).json({ message: "Google account email is not available" });
    }

    if (decodedToken.email_verified === false) {
      return res.status(400).json({ message: "Please verify your Google email before continuing" });
    }

    if (email && email.toLowerCase().trim() !== googleEmail) {
      return res.status(400).json({
        message: "The entered email does not match your Google account"
      });
    }

    let user = await User.findOne({ email: googleEmail });

    if (user) {
      if (user.isSuspended) {
        return res.status(403).json({
          message: "Your account has been suspended.",
          reason: user.suspendReason || "Please contact support for more information.",
          suspended: true,
        });
      }

      let shouldSave = false;

      if (!user.googleId) {
        user.googleId = decodedToken.uid;
        shouldSave = true;
      }

      if (!user.authProvider && !user.password) {
        user.authProvider = "google";
        shouldSave = true;
      }

      if (!user.profileImage && decodedToken.picture) {
        user.profileImage = decodedToken.picture;
        shouldSave = true;
      }

      if (!user.fullName && (fullName || decodedToken.name)) {
        user.fullName = fullName || decodedToken.name;
        shouldSave = true;
      }

      if (shouldSave) {
        await user.save();
      }

      return issueAuthResponse(res, user, "Google login successful");
    }

    if (!phoneNumber || !role) {
      return res.status(400).json({
        message: "Phone number and role are required to complete Google signup"
      });
    }

    const roleValidationError = validateRoleFields(role, req.body);
    if (roleValidationError) {
      return res.status(role === "admin" ? 403 : 400).json({
        message: roleValidationError
      });
    }

    user = await User.create({
      fullName: fullName || decodedToken.name || googleEmail.split("@")[0],
      email: googleEmail,
      phoneNumber,
      role,
      authProvider: "google",
      googleId: decodedToken.uid,
      profileImage: decodedToken.picture || undefined,
      village,
      district,
      state,
      cropsGrown,
      landSize,
      businessName,
      businessType,
      productsOfInterest,
      city,
      merchantState
    });

    return issueAuthResponse(res, user, "Google signup successful");
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ---------- LOGOUT ----------
export const logoutUser = (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    sameSite: "strict",
    secure:   process.env.NODE_ENV === "production",
  });
  res.status(200).json({ message: "Logged out successfully" });
};
