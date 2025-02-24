import { Router } from "express";
import { FaixaEtariaController } from "../controllers/faixaEtariaController"; // Confirme o nome do arquivo!

const router = Router();

router.get("/faixaetaria", FaixaEtariaController.getAll);
router.get("/faixaetaria/:id", FaixaEtariaController.getById);
router.post("/faixaetaria", FaixaEtariaController.create); // Corrigido
router.put("/faixaetaria/:id", FaixaEtariaController.update);
router.delete("/faixaetaria/:id", FaixaEtariaController.delete);

export default router;
