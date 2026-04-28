import mongoose from "mongoose";

const connectDB = async () => {
  const primaryUri = process.env.MONGODB_URL;
  const fallbackUri = process.env.MONGODB_URL_DIRECT;

  if (!primaryUri && !fallbackUri) {
    console.error("❌ MongoDB Connection Failed: Missing MONGODB_URL (or MONGODB_URL_DIRECT) in .env");
    process.exit(1);
  }

  try {
    await mongoose.connect(primaryUri || fallbackUri, {
      serverSelectionTimeoutMS: 10000,
      family: 4,
    });
    console.log("✅ MongoDB Connected");
  } catch (error) {
    const isSrvLookupIssue =
      typeof error?.message === "string" &&
      (error.message.includes("querySrv") || error.message.includes("ENOTFOUND") || error.message.includes("ECONNREFUSED"));

    // Retry once with non-SRV fallback URI if provided and the primary URI failed.
    if (isSrvLookupIssue && fallbackUri && primaryUri) {
      try {
        console.warn("⚠️ SRV DNS lookup failed. Retrying with MONGODB_URL_DIRECT...");
        await mongoose.connect(fallbackUri, {
          serverSelectionTimeoutMS: 10000,
          family: 4,
        });
        console.log("✅ MongoDB Connected (direct URI fallback)");
        return;
      } catch (fallbackError) {
        console.error("❌ MongoDB direct URI fallback failed:", fallbackError.message);
        process.exit(1);
      }
    }

    console.error("❌ MongoDB Connection Failed:", error.message);
    if (isSrvLookupIssue) {
      console.error(
        "ℹ️ This usually means DNS/SRV lookup is blocked on your network. Use MONGODB_URL_DIRECT from Atlas 'Drivers > Node.js > Standard connection string' (non-SRV)."
      );
    }
    process.exit(1);
  }
};

export default connectDB;
