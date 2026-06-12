import mongoose from "mongoose";

const poiSchema = new mongoose.Schema({
  name: { type: String, required: true },
  tipo: String,
  geometry: {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: { type: [Number], required: true },
  },
  properties: {
    type: Object,
    default: {},
  },
});

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["user", "admin"], default: "user" },
});

// criar models
export const Poi = mongoose.model("Poi", poiSchema);
export const User = mongoose.model("User", userSchema);
