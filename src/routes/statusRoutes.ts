import { Router } from "express";
import { StatusController } from "../controllers/statusController";

const router = Router();


router.get("/status", StatusController.getAll); 
router.get("/status/:id", StatusController.getById); 
router.post("/status", StatusController.create); 
router.put("/status/:id", StatusController.update); 

export default router;
