import { Request, Response, NextFunction } from 'express';
import { Sexo } from '../models/sexoPetModel';

export class SexoController {
  static async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sexos = await Sexo.findAll();
      res.status(200).json(sexos);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar os sexos.' });
    }
  }

  // Método para buscar por ID
  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sexo = await Sexo.findByPk(req.params.id);
      if (!sexo) {
        res.status(404).json({ error: 'Sexo não encontrado.' });
      }
      res.status(200).json(sexo);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar o sexo.' });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const { descricao } = req.body;

      const novoSexo = await Sexo.create({ descricao });
      res.status(201).json(novoSexo);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao criar o sexo.' });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const { descricao } = req.body;

      const sexo = await Sexo.findByPk(req.params.id);
      if (!sexo) {
        return res.status(404).json({ error: 'Sexo não encontrado.' });
      }

      await sexo.update({ descricao });
      res.status(200).json(sexo);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao atualizar o sexo.' });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const sexo = await Sexo.findByPk(req.params.id);
      if (!sexo) {
        return res.status(404).json({ error: 'Sexo não encontrado.' });
      }

      await sexo.destroy();
      res.status(200).json({ message: 'Sexo deletado com sucesso.' });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao deletar o sexo.' });
    }
  }
}
