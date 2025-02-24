import { Request, Response } from "express";
import { Pet } from "../models/Pet";

export class PetController {
  // Buscar todos os pets
  static async getAll(req: Request, res: Response) {
    try {
      const pets = await Pet.findAll();
      res.json(pets);
    } catch (error) {
      res.status(500).json({ error: "Erro ao buscar os pets." });
    }
  }

  // Buscar pet por ID
  static async getById(req: Request, res: Response) {
    try {
      const pet = await Pet.findByPk(req.params.id);
      if (!pet) return res.status(404).json({ error: "Pet não encontrado." });
      res.json(pet);
    } catch (error) {
      res.status(500).json({ error: "Erro ao buscar o pet." });
    }
  }

  // Criar um novo pet
  static async create(req: Request, res: Response) {
    try {
      const pet = await Pet.create(req.body);
      res.status(201).json(pet);
    } catch (error) {
      res.status(400).json({ error: "Erro ao cadastrar pet." });
    }
  }

  // Atualizar um pet
  static async update(req: Request, res: Response) {
    try {
      const pet = await Pet.findByPk(req.params.id);
      if (!pet) return res.status(404).json({ error: "Pet não encontrado." });

      await pet.update(req.body);
      res.json(pet);
    } catch (error) {
      res.status(400).json({ error: "Erro ao atualizar pet." });
    }
  }

  // Deletar um pet
  static async delete(req: Request, res: Response) {
    try {
      const pet = await Pet.findByPk(req.params.id);
      if (!pet) return res.status(404).json({ error: "Pet não encontrado." });

      await pet.destroy();
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Erro ao deletar pet." });
    }
  }
}
