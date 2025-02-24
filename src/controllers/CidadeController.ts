import { Request, Response } from "express";
import { Cidade } from "../models/Cidade";

export class CidadeController {
  static async getAll(req: Request, res: Response) {
    try {
      const cidades = await Cidade.findAll();
      res.json(cidades);
    } catch (error) {
      res.status(500).json({ error: "Erro ao buscar as cidades." });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const cidade = await Cidade.create(req.body);
      res.status(201).json(cidade);
    } catch (error) {
      res.status(400).json({ error: "Erro ao criar cidade." });
    }
  }
}
