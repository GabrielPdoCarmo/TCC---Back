import { Request, Response, NextFunction, RequestHandler } from "express";
import { Pet } from "../models/petModel";

export class PetController {
  // Buscar todos os pets
  static getAll: RequestHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const pets = await Pet.findAll();
      res.json(pets); // Não retorne nada, apenas envie a resposta
    } catch (error) {
      res.status(500).json({ error: "Erro ao listar o pet." });
    }
  };

  // Buscar pet por ID
  static getById: RequestHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const pet = await Pet.findByPk(req.params.id);
      if (!pet) {
        res.status(404).json({ error: "Pet não encontrado." });
        return; // Evita continuar a execução após a resposta
      }
      res.json(pet); // Retorna o pet encontrado
    } catch (error) {
      res.status(500).json({ error: "Erro ao buscar buscar o pet." });
    }
  };

  // Criar um novo pet
  static create: RequestHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const pet = await Pet.create(req.body);
      res.status(201).json(pet); // Não retorne nada, apenas envie a resposta
    } catch (error) {
      res.status(500).json({ error: "Erro ao criar um pet." });
    }
  };

  // Atualizar um pet
  static update: RequestHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const pet = await Pet.findByPk(req.params.id);
      if (!pet) {
        res.status(404).json({ error: "Pet não encontrado." });
        return; // Evita continuar a execução após a resposta
      }

      await pet.update(req.body);
      res.json(pet); // Retorna o pet atualizado
    } catch (error) {
      res.status(500).json({ error: "Erro ao atualizar pet." });
    }
  };

  // Deletar um pet
  static delete: RequestHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const pet = await Pet.findByPk(req.params.id);
      if (!pet) {
        res.status(404).json({ error: "Pet não encontrado." });
        return; // Evita continuar a execução após a resposta
      }

      await pet.destroy();
      res.status(204).send(); // Não retorne nada, apenas envie a resposta
    } catch (error) {
      res.status(500).json({ error: "Erro ao deletar o pet." });
    }
  }
}
