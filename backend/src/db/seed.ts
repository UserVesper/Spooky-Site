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

  const docs = data.features.map((feature: any) => {
    const props = feature.properties;
    const geom = feature.geometry;
    return {
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
  });

  const BATCH_SIZE = 500;
  let inserted = 0;

  for (let i = 0; i < docs.length; i += BATCH_SIZE) {
    const batch = docs.slice(i, i + BATCH_SIZE);
    await Poi.insertMany(batch);
    inserted += batch.length;
    console.log(`Inseridos ${inserted}/${docs.length} POIs...`);
  }

  console.log(`✅ Inserção concluída: ${inserted} POIs inseridos.`);
  process.exit(0);
}

seed();
