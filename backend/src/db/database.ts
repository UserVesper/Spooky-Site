import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";


dotenv.config();
dotenv.config({ path: path.join(__dirname, "../../.env") });

export async function connectDB() {
  try {
    console.log("process.env.MONGO_URI:", process.env.MONGO_URI);
    await mongoose.connect(process.env.MONGO_URI as string);
    console.log("✅ MongoDB conectado");
  } catch (err) {
    console.error("❌ Erro ao conectar ao MongoDB:", err);
    process.exit(1);
  }
}