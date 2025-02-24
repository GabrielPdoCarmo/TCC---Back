import { Router } from "express";
import { EstadoController } from "../controllers/EstadoController";

const router = Router();

router.get("/estados", EstadoController.getAll);
router.post("/estados", EstadoController.create);

export default router;
