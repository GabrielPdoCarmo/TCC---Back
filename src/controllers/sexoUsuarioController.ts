import { Request, Response } from 'express';
import { Sexo_Usuario } from '../models/sexoUsuarioModel';

export class Sexo_UsuarioController {
  static async getAll(req: Request, res: Response) {
    try {
      const sexos = await Sexo_Usuario.findAll();
      res.status(200).json(sexos);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar os sexos.' });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const sexo = await Sexo_Usuario.findByPk(req.params.id);
      if (!sexo) {
        return res.status(404).json({ error: 'Sexo não encontrado.' });
      }
      res.status(200).json(sexo);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar o sexo.' });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const { descricao } = req.body;

      // Verificação simples para garantir que a descrição não está vazia
      if (!descricao) {
        return res.status(400).json({ error: 'A descrição não pode estar vazia.' });
      }

      const sexo = await Sexo_Usuario.findByPk(req.params.id);
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
      const sexo = await Sexo_Usuario.findByPk(req.params.id); // Corrected here
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
