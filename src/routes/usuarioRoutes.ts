import { Router } from "express";
import { UsuarioController } from "../controllers/usuarioController";

const router = Router();

router.get("/usuarios", UsuarioController.getAll);
router.post("/usuarios", UsuarioController.create);
router.delete("/usuario/:id", UsuarioController.delete)
router.put("/usuario/:id", UsuarioController.update);

export default router;
