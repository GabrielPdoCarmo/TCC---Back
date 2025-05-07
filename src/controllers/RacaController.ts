import { Request, Response } from 'express';
import { Raca } from '../models/racaModel';
import { Especie } from '../models/especiesModel';

export class RacaController {
  // Método de listagem
  static async listar(req: Request, res: Response): Promise<void> {
    try {
      const racas = await Raca.findAll({ include: [Especie] });
      res.json(racas);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar raças' });
    }
  }
  static async buscarPorId(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id || isNaN(Number(id))) {
        res.status(400).json({ error: 'ID inválido' });
        return;
      }

      const raca = await Raca.findByPk(id, { include: [Especie] });

      if (!raca) {
        res.status(404).json({ error: 'Raça não encontrada' });
        return;
      }

      res.json(raca);
    } catch (error) {
      console.error('Erro ao buscar raça por ID:', error);
      res.status(500).json({ error: 'Erro ao buscar raça por ID' });
    }
  }
  // Método de criação
  static async criar(req: Request, res: Response): Promise<void> {
    try {
      const { nome, especie_id } = req.body;

      if (!nome || !especie_id) {
        res.status(400).json({ error: 'Nome e espécie são obrigatórios' });
        return;
      }

      const existe = await Raca.findOne({ where: { nome, especie_id } });
      if (existe) {
        res.status(400).json({ error: 'Raça já existente no banco de dados' });
        return;
      }

      const novaRaca = await Raca.create({ nome, especie_id });
      res.status(201).json(novaRaca);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao criar raça' });
    }
  }
  static async listarPorEspecieID(req: Request, res: Response): Promise<void> {
    const { especie_id } = req.params;

    try {
      const racas = await Raca.findAll({
        where: { especie_id },
      });

      res.json(racas);
    } catch (error) {
      console.error('Erro ao buscar raças por espécie:', error);
      res.status(500).json({ error: 'Erro ao buscar raças por espécie.' });
    }
  }
}
