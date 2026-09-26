import { Router } from "express";
import {
  getPois,
  createPoi,
  updatePoi,
  deletePoi,
} from "../controllers/poiController";

const router = Router();

router.get("/", getPois);
router.post("/", createPoi);
router.put("/:id", updatePoi);
router.delete("/:id", deletePoi);

export default router;
