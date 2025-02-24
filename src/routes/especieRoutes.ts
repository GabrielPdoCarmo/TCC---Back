import { Router } from "express";
import { EspecieController } from "../controllers/EspecieController";

const router = Router();

router.get("/especie", EspecieController.listar);
router.post("/especie", EspecieController.criar);

export default router;
