import { Router, Request, Response } from "express";
import fs from "fs";
import path from "path";

const router = Router();

let cachedGeoJSON: object | null = null;

function loadAndMergeGeoJSON(): object {
  if (cachedGeoJSON) return cachedGeoJSON;

  const dataDir = path.join(__dirname, "../data");
  const files = [
    "england.json",
    "scotland.json",
    "northern_ireland.json",
    "regions_gb.json",
    "wales.json",
  ];

  const allFeatures: any[] = [];

  for (const file of files) {
    const filePath = path.join(dataDir, file);
    if (fs.existsSync(filePath)) {
      try {
        const raw = fs.readFileSync(filePath, "utf-8");
        const geojson = JSON.parse(raw);
        if (geojson.features && Array.isArray(geojson.features)) {
          allFeatures.push(...geojson.features);
        }
      } catch (err) {
        console.error(`Erro ao ler ${file}:`, err);
      }
    }
  }

  cachedGeoJSON = {
    type: "FeatureCollection",
    features: allFeatures,
  };

  console.log(`✅ GeoJSON carregado: ${allFeatures.length} features`);
  return cachedGeoJSON;
}

router.get("/regions", (_req: Request, res: Response) => {
  try {
    const geoData = loadAndMergeGeoJSON();
    res.set("Cache-Control", "public, max-age=3600");
    res.json(geoData);
  } catch (err) {
    res.status(500).json({
      error: err instanceof Error ? err.message : "Erro ao carregar GeoJSON",
    });
  }
});

export default router;
