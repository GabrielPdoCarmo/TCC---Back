import { Router } from "express";
import { FaixaEtariaController } from "../controllers/faixaEtariaController";

const router = Router();

router.get("/faixa-etaria", FaixaEtariaController.getAll);
router.get("/faixa-etaria/:id", FaixaEtariaController.getById);
router.post("/faixa-etaria", FaixaEtariaController.create);
router.put("/faixa-etaria/:id", FaixaEtariaController.update);

export default router;
