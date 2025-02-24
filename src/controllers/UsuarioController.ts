import { Request, Response } from "express";
import { Usuario } from "../models/Usuario";

export class UsuarioController {
  static async getAll(req: Request, res: Response) {
    try {
      const usuarios = await Usuario.findAll();
      res.json(usuarios);
    } catch (error) {
      res.status(500).json({ error: "Erro ao buscar usuários." });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const usuario = await Usuario.create(req.body);
      res.status(201).json(usuario);
    } catch (error) {
      res.status(400).json({ error: "Erro ao criar usuário." });
    }
  }
}
