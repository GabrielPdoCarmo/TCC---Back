import { Router } from "express";
import { RacaController } from "../controllers/RacaController";

const router = Router();

router.get("/", RacaController.listar);
router.post("/", RacaController.criar);

export default router;
