import { Router } from "express";
import { Poi } from "../models/schemas";

const router = Router();

// GET todos os POIs
router.get("/", async (_, res) => {
  const pois = await Poi.find();
  res.json(pois);
});

// POST criar POI
router.post("/", async (req, res) => {
  const poi = await Poi.create(req.body);
  res.json(poi);
});

// PUT atualizar POI
router.put("/:id", async (req, res) => {
  try {
    const update = req.body;

    if (update.properties) {
      const existing = (await Poi.findById(req.params.id))?.properties || {};
      update.properties = { ...existing, ...update.properties };
    }

    const poi = await Poi.findByIdAndUpdate(req.params.id, update, {
      new: true,
    });
    if (!poi) return res.status(404).json({ error: "POI não encontrado" });

    res.json(poi);
  } catch (err) {
    res
      .status(500)
      .json({
        error: err instanceof Error ? err.message : "Erro desconhecido",
      });
  }
});

// DELETE remover POI
router.delete("/:id", async (req, res) => {
  try {
    const poi = await Poi.findByIdAndDelete(req.params.id);
    if (!poi) return res.status(404).json({ error: "POI não encontrado" });
    res.json({ message: "POI deletado" });
  } catch (err) {
    res
      .status(500)
      .json({
        error: err instanceof Error ? err.message : "Erro desconhecido",
      });
  }
});

export default router;
