import { Request, Response } from "express";
import { DoencasDeficiencias } from "../models/doencasDeficienciasModel";

export class DoencasDeficienciasController {
  // Buscar doença/deficiência por ID
  static async getById(req: Request, res: Response): Promise<void> {
    try {
      const doenca = await DoencasDeficiencias.findByPk(Number(req.params.id));
      if (!doenca) {
        res.status(404).json({ error: "Doença/Deficiência não encontrada" });
        return;
      }
      res.json(doenca);
    } catch (error) {
      res.status(500).json({ error: "Erro ao buscar doença/deficiência" });
    }
  }
}
