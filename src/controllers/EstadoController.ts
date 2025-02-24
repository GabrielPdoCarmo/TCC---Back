import { Request, Response } from "express";
import { Estado } from "../models/estadoModel";

export class EstadoController {
  static async getAll(req: Request, res: Response) {
    try {
      const estados = await Estado.findAll();
      res.json(estados);
    } catch (error) {
      res.status(500).json({ error: "Erro ao buscar os estados." });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const estado = await Estado.create(req.body);
      res.status(201).json(estado);
    } catch (error) {
      res.status(400).json({ error: "Erro ao criar estado." });
    }
  }
}
