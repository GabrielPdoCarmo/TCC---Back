import { Request, Response, NextFunction } from 'express';
import { Especie } from '../models/especiesModel';
import { ValidationError, UniqueConstraintError, DatabaseError } from 'sequelize';

export class EspecieController {
  static async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const especies = await Especie.findAll();
      res.json(especies);
    } catch (error) {
      console.error('Erro ao listar espécies:', error);
      res.status(500).json({ error: 'Erro ao listar espécies.' });
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const especie = await Especie.findByPk(Number(req.params.id));
      if (!especie) {
        res.status(404).json({ error: 'Espécie não encontrada' });
        return;
      }
      res.json(especie);
    } catch (error) {
      console.error('Erro ao buscar espécie:', error);
      res.status(500).json({ error: 'Erro ao buscar espécie.' });
    }
  }

  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    const { nome } = req.body;

    try {
      const especie = await Especie.create({ nome });
      res.status(201).json(especie);
    } catch (error) {
      console.error('Erro ao criar espécie:', error);

      if (error instanceof UniqueConstraintError) {
        // Tratamento para violação de chave única (nome duplicado)
        res.status(400).json({
          error: 'Dados duplicados',
          message: 'Já existe uma espécie com este nome.',
        });
      } else if (error instanceof ValidationError) {
        // Tratamento para erros de validação
        res.status(400).json({
          error: 'Dados inválidos',
          message: error.message,
          details: error.errors.map((e) => ({ field: e.path, message: e.message })),
        });
      } else {
        // Outros erros de banco de dados
        res.status(500).json({ error: 'Erro ao criar espécie.' });
      }
    }
  }

  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const especie = await Especie.findByPk(Number(req.params.id));
      if (!especie) {
        res.status(404).json({ error: 'Espécie não encontrada' });
        return;
      }

      await especie.update(req.body);
      res.json(especie);
    } catch (error) {
      console.error('Erro ao atualizar espécie:', error);

      if (error instanceof UniqueConstraintError) {
        // Tratamento para violação de chave única
        res.status(400).json({
          error: 'Dados duplicados',
          message: 'Já existe uma espécie com este nome.',
        });
      } else if (error instanceof ValidationError) {
        // Tratamento para erros de validação
        res.status(400).json({
          error: 'Dados inválidos',
          message: error.message,
          details: error.errors.map((e) => ({ field: e.path, message: e.message })),
        });
      } else {
        // Outros erros de banco de dados
        res.status(500).json({ error: 'Erro ao atualizar espécie.' });
      }
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const especie = await Especie.findByPk(Number(req.params.id));
      if (!especie) {
        res.status(404).json({ error: 'Espécie não encontrada' });
        return;
      }

      await especie.destroy();
      res.status(204).send();
    } catch (error) {
      console.error('Erro ao deletar espécie:', error);

      if (error instanceof DatabaseError) {
        // Caso exista algum constraint que impede a exclusão (ex: registros relacionados)
        res.status(400).json({
          error: 'Não foi possível excluir',
          message: 'Esta espécie possui registros relacionados e não pode ser excluída.',
        });
      } else {
        // Outros erros
        res.status(500).json({ error: 'Erro ao deletar espécie.' });
      }
    }
  }
}
