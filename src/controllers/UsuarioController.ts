import { Request, Response, NextFunction } from 'express';
import { Usuario } from '../models/usuarioModel';
import { ValidationError, UniqueConstraintError, DatabaseError } from 'sequelize';

export class UsuarioController {
  static async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const usuarios = await Usuario.findAll();
      res.json(usuarios);
    } catch (error) {
      console.error('Erro ao listar usuários:', error);
      res.status(500).json({ error: 'Erro ao listar usuários.' });
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const usuario = await Usuario.findByPk(Number(req.params.id));
      if (!usuario) {
        res.status(404).json({ error: 'Usuário não encontrado' });
        return;
      }
      res.json(usuario);
    } catch (error) {
      console.error('Erro ao buscar usuário:', error);
      res.status(500).json({ error: 'Erro ao buscar usuário.' });
    }
  }

  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    const { nome, sexo, telefone, email, senha, cpf, cep, cidadeId } = req.body;

    try {
      const usuario = await Usuario.create({ nome, sexo, telefone, email, senha, cpf, cep, cidadeId });
      res.status(201).json(usuario);
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      
      if (error instanceof UniqueConstraintError) {
        // Tratamento para violação de chave única (email ou CPF duplicado)
        res.status(400).json({ 
          error: 'Dados duplicados', 
          message: 'Email ou CPF já cadastrado no sistema.' 
        });
      } else if (error instanceof ValidationError) {
        // Tratamento para erros de validação
        res.status(400).json({ 
          error: 'Dados inválidos', 
          message: error.message,
          details: error.errors.map(e => ({ field: e.path, message: e.message }))
        });
      } else {
        // Outros erros de banco de dados
        res.status(500).json({ error: 'Erro ao criar usuário.' });
      }
    }
  }

  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const usuario = await Usuario.findByPk(Number(req.params.id));
      if (!usuario) {
        res.status(404).json({ error: 'Usuário não encontrado' });
        return;
      }
      
      await usuario.update(req.body);
      res.json(usuario);
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      
      if (error instanceof UniqueConstraintError) {
        // Tratamento para violação de chave única (email ou CPF duplicado)
        res.status(400).json({ 
          error: 'Dados duplicados', 
          message: 'Email ou CPF já em uso por outro usuário.' 
        });
      } else if (error instanceof ValidationError) {
        // Tratamento para erros de validação
        res.status(400).json({ 
          error: 'Dados inválidos', 
          message: error.message,
          details: error.errors.map(e => ({ field: e.path, message: e.message }))
        });
      } else {
        // Outros erros de banco de dados
        res.status(500).json({ error: 'Erro ao atualizar usuário.' });
      }
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const usuario = await Usuario.findByPk(Number(req.params.id));
      if (!usuario) {
        res.status(404).json({ error: 'Usuário não encontrado' });
        return;
      }
      
      await usuario.destroy();
      res.status(204).send();
    } catch (error) {
      console.error('Erro ao deletar usuário:', error);
      
      if (error instanceof DatabaseError) {
        // Caso exista algum constraint que impede a exclusão (ex: registros relacionados)
        res.status(400).json({ 
          error: 'Não foi possível excluir', 
          message: 'Este usuário possui registros relacionados e não pode ser excluído.' 
        });
      } else {
        // Outros erros
        res.status(500).json({ error: 'Erro ao deletar usuário.' });
      }
    }
  }
}