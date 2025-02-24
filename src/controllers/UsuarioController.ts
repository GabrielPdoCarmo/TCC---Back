import { Request, Response, NextFunction } from "express";
import { Usuario } from "../models/usuarioModel";

export class UsuarioController {
  // Buscar todos os usuários
  static async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const usuarios = await Usuario.findAll();
      res.json(usuarios);
    } catch (error) {
      res.status(500).json({ error: "Erro ao listar usuario." });
    }
  }

  // Buscar um usuário por ID
  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const usuario = await Usuario.findByPk(Number(req.params.id));
      
      if (!usuario) {
        res.status(404).json({ error: "Usuário não encontrado" });
        return;
      }
      
      res.json(usuario);
    } catch (error) {
      res.status(500).json({ error: "Erro ao buscar usuario." });
    }
  }

  // Criar um novo usuário
  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const usuario = await Usuario.create(req.body);
      res.status(201).json(usuario);
    } catch (error) {
      res.status(500).json({ error: "Erro ao buscar usuario." });
    }
  }

  // Atualizar um usuário
  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const usuario = await Usuario.findByPk(Number(req.params.id));
      if (!usuario) {
        res.status(404).json({ error: "Usuario não encontrado" });
        return;
      }
      await usuario.update(req.body);
      res.json(usuario);
    } catch (error) {
      res.status(500).json({ error: "Erro ao criar usuario." });
    }
  }

  // Deletar um usuário
  static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const usuario = await Usuario.findByPk(Number(req.params.id));
      
      // Verifica se o usuário não foi encontrado
      if (!usuario) {
        res.status(404).json({ error: "Usuário não encontrado" });
        return;
      }
  
      // Deleta o usuário encontrado
      await usuario.destroy();
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Erro ao deletar usuario." });
    }
  }
}
