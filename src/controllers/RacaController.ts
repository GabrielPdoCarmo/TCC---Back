import { Request, Response } from "express";
import { Raca } from "../models/racaModel";
import { Especie } from "../models/especiesModel";

export class RacaController {
  static async listar(req: Request, res: Response) {
    try {
      const racas = await Raca.findAll({ include: [Especie] });
      res.json(racas);
    } catch (error) {
      res.status(500).json({ error: "Erro ao buscar raças" });
    }
  }

  static async criar(req: Request, res: Response) {
    try {
      const { nome, especie_id } = req.body;
      const novaRaca = await Raca.create({ nome, especie_id });
      res.status(201).json(novaRaca);
    } catch (error) {
      res.status(500).json({ error: "Erro ao criar raça" });
    }
  }
}
