import { Request, Response } from "express";
import { Especie } from "../models/especiesModel";

export class EspecieController {
  static async getALl(req: Request, res: Response) {
    try {
      const especies = await Especie.findAll();
      res.json(especies);
    } catch (error) {
      res.status(500).json({ error: "Erro ao buscar espécies" });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const { nome, idade_max, idade_min } = req.body;
      const novaEspecie = await Especie.create({ nome, idade_max, idade_min });
      res.status(201).json(novaEspecie);
    } catch (error) {
      res.status(500).json({ error: "Erro ao criar espécie" });
    }
  }
}
