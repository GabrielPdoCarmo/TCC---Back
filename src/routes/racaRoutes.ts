// routes/racaRoutes.ts
import { Router } from "express";
import { RacaController } from "../controllers/RacaController";

const router = Router();

router.get("/", RacaController.listar);
router.post("/", RacaController.criar);
router.get("/especie/:especie_id", RacaController.listarPorEspecieID);
router.get("/:id", RacaController.buscarPorId);
export default router;
