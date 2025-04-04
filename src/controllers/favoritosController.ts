import { Request, Response } from 'express';
import { Favorito } from '../models/favoritosModel';
import { Pet } from '../models/petModel';
import { Usuario } from '../models/usuarioModel';

export class FavoritosController {
  static async create(req: Request, res: Response): Promise<void> {
    try {
      const { usuario_id, pet_id } = req.body;

      // Validação de usuário
      const usuario = await Usuario.findByPk(usuario_id);
      if (!usuario) {
        res.status(404).json({ error: 'Usuário não encontrado.' });
        return;
      }

      // Validação de pet
      const pet = await Pet.findByPk(pet_id);
      if (!pet) {
        res.status(404).json({ error: 'Pet não encontrado.' });
        return;
      }

      // Verificar se o favorito já existe
      const favoritoExistente = await Favorito.findOne({ where: { usuario_id, pet_id } });
      if (favoritoExistente) {
        res.status(400).json({ error: 'Este pet já está nos favoritos do usuário.' });
        return;
      }

      // Criar favorito
      const novoFavorito = await Favorito.create({ usuario_id, pet_id });
      res.status(201).json(novoFavorito);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Erro ao adicionar aos favoritos.' });
    }
  }

  static async getByUserId(req: Request, res: Response): Promise<void> {
    try {
      const { usuario_id } = req.params;

      // Validação de usuário
      const usuario = await Usuario.findByPk(usuario_id);
      if (!usuario) {
        res.status(404).json({ error: 'Usuário não encontrado.' });
        return;
      }

      const favoritos = await Favorito.findAll({
        where: { usuario_id },
        include: [{ model: Pet }],
      });

      res.json(favoritos);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Erro ao buscar favoritos.' });
    }
  }

  static async delete(req: Request, res: Response): Promise<void> {
    try {
      const { usuario_id, pet_id } = req.params;

      // Validação de usuário
      const usuario = await Usuario.findByPk(usuario_id);
      if (!usuario) {
        res.status(404).json({ error: 'Usuário não encontrado.' });
        return;
      }

      // Validação de pet
      const pet = await Pet.findByPk(pet_id);
      if (!pet) {
        res.status(404).json({ error: 'Pet não encontrado.' });
        return;
      }

      const favorito = await Favorito.findOne({ where: { usuario_id, pet_id } });

      if (!favorito) {
        res.status(404).json({ error: 'Favorito não encontrado.' });
        return;
      }

      await favorito.destroy();
      res.status(204).send();
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Erro ao remover dos favoritos.' });
    }
  }
}
