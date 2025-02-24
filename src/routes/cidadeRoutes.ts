import { Router } from "express";
import { CidadeController } from "../controllers/CidadeController";

const router = Router();

router.get("/cidades", CidadeController.getAll);
router.post("/cidades", CidadeController.create);

export default router;
