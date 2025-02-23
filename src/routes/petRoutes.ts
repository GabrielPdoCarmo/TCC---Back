import { Router } from "express";
import { Animal } from "../models/Animais";

const router = Router();

// Criar pet
router.post("/pets", async (req, res) => {
  try {
    const pet = await Pet.create(req.body);
    res.status(201).json(pet);
  } catch (error) {
    res.status(400).json({ error: "Erro ao criar pet" });
  }
});

// Buscar todos os pets
router.get("/pets", async (req, res) => {
  const pets = await Pet.findAll();
  res.json(pets);
});

export default router;
