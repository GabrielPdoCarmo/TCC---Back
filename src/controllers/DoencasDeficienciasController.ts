import { Request, Response } from "express";
import { DoencasDeficiencias } from "../models/doencasDeficienciasModel";

export class DoencasDeficienciasController {
  static async getById(req: Request, res: Response): Promise<void> {
    try {
      const doenca = await DoencasDeficiencias.findByPk(Number(req.params.id));
      if (!doenca) {
        res.status(404).json({ error: "Doenças/Deficiências não encontrada" });
      }
      res.json(doenca);
    } catch (error) {
      res.status(500).json({ error: "Erro ao buscar faixa doenças/deficiências" });
    }
  }

  static async create(req: Request, res: Response): Promise<void> {
    try {
      const { nome, possui } = req.body;

      if (!nome || possui === undefined) {
        res.status(400).json({ error: "Nome e status (possui) são obrigatórios" });
      }

      const novaDoenca = await DoencasDeficiencias.create({ nome, possui });
      res.status(201).json(novaDoenca);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Erro ao criar registro." });
    }
  }

  static async update(req: Request, res: Response): Promise<void> {
    try {
      const doenca = await DoencasDeficiencias.findByPk(Number(req.params.id));
      if (!doenca) {
        res.status(404).json({ error: "Doenças/Deficiências não encontrada" });
        return; // Evita que o código continue executando
      }

      await doenca.update(req.body);
      res.json(doenca);
    } catch (error) {
      res.status(400).json({ error: "Erro ao atualizar doenças/deficiências" });
    }
  }

}
