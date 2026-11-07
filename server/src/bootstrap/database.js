import mongoose from "mongoose";

/**
 * MongoDB database bootstrap with graceful in-memory fallback.
 * Allows the server to run whether a local MongoDB daemon is active or not.
 */
export async function setupDatabase() {
  const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/court_clash";

  try {
    // Attempt connection with a short 3-second timeout
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000
    });

    console.log(`[Database Bootstrap] Successfully connected to MongoDB at ${uri}`);

    mongoose.connection.on("error", (err) => {
      console.warn(`[Database Warning] MongoDB connection error: ${err.message}`);
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("[Database Warning] MongoDB disconnected. Falling back to in-memory state store.");
    });

    return { connected: true, provider: "MongoDB" };
  } catch (err) {
    console.log(`[Database Bootstrap] Notice: Local MongoDB not detected (${err.message}).`);
    console.log(`[Database Bootstrap] Using high-performance in-memory room store (zero setup needed).`);
    return { connected: false, provider: "In-Memory" };
  }
}
