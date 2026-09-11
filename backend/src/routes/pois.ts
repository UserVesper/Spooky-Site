import { Router, Request, Response } from "express";
import { Poi } from "../models/schemas";

const router = Router();

router.get("/", async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 0;
    const limit = parseInt(req.query.limit as string) || 0;
    const tipo = req.query.tipo as string;
    const nome = req.query.nome as string;

    const filter: any = {};
    if (tipo && tipo !== "Todos") {
      filter["properties.type:normalized"] = tipo;
    }
    if (nome) {
      filter.name = { $regex: nome, $options: "i" };
    }

    if (page === 0 && limit === 0) {
      const pois = await Poi.find(filter);
      return res.json(pois);
    }

    const skip = (page - 1) * limit;
    const [pois, total] = await Promise.all([
      Poi.find(filter).skip(skip).limit(limit),
      Poi.countDocuments(filter),
    ]);

    res.json({
      data: pois,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    res.status(500).json({
      error: err instanceof Error ? err.message : "Erro ao listar POIs",
    });
  }
});

router.post("/", async (req: Request, res: Response) => {
  try {
    const poi = await Poi.create(req.body);
    res.status(201).json(poi);
  } catch (err) {
    res.status(500).json({
      error: err instanceof Error ? err.message : "Erro ao criar POI",
    });
  }
});

router.put("/:id", async (req: Request, res: Response) => {
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

router.delete("/:id", async (req: Request, res: Response) => {
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
