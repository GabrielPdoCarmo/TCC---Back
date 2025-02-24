import { Request, Response, NextFunction } from "express";
import { Status } from "../models/statusModel";

export class StatusController {
  // Tornando os métodos estáticos e assincrônicos
  static async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const statusList = await Status.findAll(); // Correto no Sequelize
      res.json(statusList);
    } catch (error) {
      res.status(500).json({ error: "Erro ao listar status." });
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const status = await Status.findByPk(Number(req.params.id)); // Correto no Sequelize
      if (!status) {
        res.status(404).json({ error: "Status não encontrado" });
        return;
      }
      res.json(status);
    } catch (error) {
      res.status(500).json({ error: "Erro ao buscar status." });
    }
  }

  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const status = await Status.create(req.body); // Correto no Sequelize
      res.status(201).json(status);
    } catch (error) {
      res.status(500).json({ error: "Erro ao criar status." });
    }
  }

  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const status = await Status.findByPk(Number(req.params.id));
      if (!status) {
        res.status(404).json({ error: "Status não encontrado" });
        return;
      }
      await status.update(req.body); // Correto no Sequelize
      res.json(status);
    } catch (error) {
      res.status(500).json({ error: "Erro ao atualizar status." });
    }
  }
}
