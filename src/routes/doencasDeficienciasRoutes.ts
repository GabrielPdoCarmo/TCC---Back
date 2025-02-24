import { Router } from "express";
import { DoencasDeficienciasController } from "../controllers/doencasDeficienciasController";

const router = Router();
router.get("/doencasdeficiencias/:id", DoencasDeficienciasController.getById);
router.post("/doencasdeficiencias", DoencasDeficienciasController.create);
router.post("/doencasdeficiencias/:id", DoencasDeficienciasController.update)


export default router;
