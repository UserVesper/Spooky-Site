import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();
dotenv.config({ path: path.join(__dirname, "../../.env") });

import { connectDB } from "./database";

const poiSchema = new mongoose.Schema({
  name: String,
  tipo: String,
  geometry: Object,
  properties: Object,
});

const Poi = mongoose.model("Poi", poiSchema);

async function seed() {
  await connectDB();

  const filePath = path.join(__dirname, "./uk_occult_pois_universal.geojson");
  const rawData = fs.readFileSync(filePath, "utf-8");
  const data = JSON.parse(rawData);

  for (const feature of data.features) {
    const props = feature.properties;
    const geom = feature.geometry;
    const doc = {
      name: props.name || "Sem nome",
      tipo:
        props.amenity ||
        props.shop ||
        props.tourism ||
        props.historic ||
        props.tipo ||
        feature.category,
      geometry: geom,
      properties: props,
    };
    await Poi.create(doc);
  }

  console.log("Inserção concluída.");
  process.exit(0);
}

seed();
