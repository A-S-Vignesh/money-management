import mongoose from "mongoose";

let isConnected = false;

export const connectToDatabase = async (): Promise<void> => {
  if (isConnected) {
    console.log("Mongodb already connected");
  }

  if (!process.env.MONGODB_URI) {
    throw new Error("❌ MONGODB_URI is not defined in environment variables.");
  }
  try {
    const db = await mongoose.connect(process.env.MONGODB_URI);

    isConnected = !!db.connections[0].readyState;
    console.log("Mongodb connected ");
  } catch (error) {
    console.log("Mongodb Error", error);
    throw new Error("Failed to connect to Database");
  }
};
