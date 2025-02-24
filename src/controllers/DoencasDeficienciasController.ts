import { Request, Response } from "express";
import { DoencasDeficiencias } from "../models/DoencasDeficiencias";

export class DoencasDeficienciasController {

  static async getById(req: Request, res: Response): Promise<void> {
    try {
      const doenca = await DoencasDeficiencias.findByPk(Number(req.params.id)); // Correto no Sequelize
      if (!doenca)
      res.json(doenca);
    } catch (error) {
      res.status(500).json({ error: "Erro ao buscar faixa doenças/deficiências" });
    }
  }

  static async create(req: Request, res: Response): Promise<void> {
    try {
      const { nome, possui } = req.body;
      const novaDoenca = await DoencasDeficiencias.create({ nome, possui });
      res.status(201).json(novaDoenca);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Erro ao criar registro." });
    }
  }
  static async update(req: Request, res: Response) {
    try {
      const doenca = await DoencasDeficiencias.findByPk(Number(req.params.id));
      if (!doenca) return res.status(404).json({ error: "Doenças/Deficiências não encontrada" });

      await doenca.update(req.body); // Correto no Sequelize
      res.json(doenca);
    } catch (error) {
      res.status(400).json({ error: "Erro ao atualizar doenças/deficiências" });
    }
  }
}
