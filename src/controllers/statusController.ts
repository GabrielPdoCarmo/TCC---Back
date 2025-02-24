import { Request, Response } from "express";
import { Status } from "../models/Status";

export class StatusController {
  async getAll(req: Request, res: Response) {
    try {
      const statusList = await Status.findAll(); // Correto no Sequelize
      res.json(statusList);
    } catch (error) {
      res.status(500).json({ error: "Erro ao buscar os status" });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const status = await Status.findByPk(Number(req.params.id)); // Correto no Sequelize
      if (!status) return res.status(404).json({ error: "Status não encontrado" });
      res.json(status);
    } catch (error) {
      res.status(500).json({ error: "Erro ao buscar status" });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const status = await Status.create(req.body); // Correto no Sequelize
      res.status(201).json(status);
    } catch (error) {
      res.status(400).json({ error: "Erro ao criar status" });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const status = await Status.findByPk(Number(req.params.id));
      if (!status) return res.status(404).json({ error: "Status não encontrado" });

      await status.update(req.body); // Correto no Sequelize
      res.json(status);
    } catch (error) {
      res.status(400).json({ error: "Erro ao atualizar status" });
    }
  }
}
