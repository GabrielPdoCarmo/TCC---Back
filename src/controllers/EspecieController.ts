import { Request, Response } from "express";
import { Especie } from "../models/Especie";

export class EspecieController {
  static async listar(req: Request, res: Response) {
    try {
      const especies = await Especie.findAll();
      res.json(especies);
    } catch (error) {
      res.status(500).json({ error: "Erro ao buscar espécies" });
    }
  }

  static async criar(req: Request, res: Response) {
    try {
      const { nome, idade_max, idade_min } = req.body;
      const novaEspecie = await Especie.create({ nome, idade_max, idade_min });
      res.status(201).json(novaEspecie);
    } catch (error) {
      res.status(500).json({ error: "Erro ao criar espécie" });
    }
  }
}
