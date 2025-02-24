import { Router } from "express";
import { EspecieController } from "../controllers/especiesController";

const router = Router();

router.get("/especie", EspecieController.getALl);
router.post("/especie", EspecieController.create);

export default router;
