import { Router } from "express";
import { RacaController } from "../controllers/racaController";

const router = Router();

router.get("/raca", RacaController.listar);
router.post("/raca", RacaController.criar);

export default router;
