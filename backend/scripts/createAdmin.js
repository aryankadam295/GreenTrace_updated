import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import User from "../models/User.js";

dotenv.config();

const createOrUpdateAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URL);
    console.log("✅ Connected to MongoDB");

    const adminEmail = "admin@greentrace.com";
    const adminPassword = "NPA@292005";

    // Delete existing admin if any
    await User.deleteMany({ email: adminEmail });
    console.log("🗑️  Deleted any existing admin user");

    // Create fresh admin user
    const adminData = {
      fullName: "GreenTrace Admin",
      email: adminEmail,
      password: adminPassword,
      phoneNumber: "8530992376",
      role: "admin",
      isActive: true
    };

    console.log("🆕 Creating new admin user...");

    // Hash password
    const hashedPassword = await bcrypt.hash(adminData.password, 10);
    console.log("🔐 Password hashed");

    // Create admin user
    const adminUser = new User({
      ...adminData,
      password: hashedPassword
    });

    await adminUser.save();
    console.log("✅ Admin user created successfully!");

    // Verify the admin user
    const verifyAdmin = await User.findOne({ email: adminEmail });
    console.log("\n🔍 Verification:");
    console.log("Admin found:", !!verifyAdmin);
    console.log("Admin email:", verifyAdmin?.email);
    console.log("Admin role:", verifyAdmin?.role);
    console.log("Admin ID:", verifyAdmin?._id);
    console.log("Is Active:", verifyAdmin?.isActive);

    // Test password comparison
    if (verifyAdmin) {
      const isPasswordValid = await bcrypt.compare(adminPassword, verifyAdmin.password);
      console.log("\n🔑 Password Test:");
      console.log("Password matches:", isPasswordValid ? "✅ YES" : "❌ NO");
      
      if (!isPasswordValid) {
        console.error("⚠️  WARNING: Password verification failed!");
        console.error("This is a serious issue - password doesn't match after creation!");
      } else {
        console.log("\n✅ ALL CHECKS PASSED!");
        console.log("\n📋 Login Credentials:");
        console.log("Email: admin@greentrace.com");
        console.log("Password: NPA@292005");
      }
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    console.error("Full error:", error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
};

createOrUpdateAdmin();