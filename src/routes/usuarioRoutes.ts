import { Router } from "express";
import { UsuarioController } from "../controllers/UsuarioController";

const router = Router();

router.get("/usuarios", UsuarioController.getAll);
router.post("/usuarios", UsuarioController.create);

export default router;
