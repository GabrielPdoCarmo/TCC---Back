import { Router } from "express";
import { PetController } from "../controllers/petController";

const router = Router();

router.get("/pets", PetController.getAll);
router.get("/pets/:id", PetController.getById);
router.post("/pets", PetController.create);
router.put("/pets/:id", PetController.update);
router.delete("/pets/:id", PetController.delete);

export default router;
