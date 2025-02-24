import { Router } from "express";
import { EstadoController } from "../controllers/estadoController";

const router = Router();

router.get("/estados", EstadoController.getAll);
router.post("/estados", EstadoController.create);

export default router;
