import { Request, Response } from 'express';
import { Pet } from '../models/petModel';
import { Usuario } from '../models/usuarioModel';
import { MyPets } from '../models/mypetsModel';

// Estendendo o tipo Request para incluir a propriedade user
interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
  };
}

export class MyPetsController {
  public static async create(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { pet_id, usuario_id } = req.body;
      const loggedUserId = req.user?.id; // ID do usuário autenticado atual

      // Validação: Verificar se os campos obrigatórios estão presentes
      if (!pet_id || !usuario_id) {
        res.status(400).json({ error: 'Campos pet_id e usuario_id são obrigatórios' });
        return;
      }

      // Validação: Verificar se o pet existe
      const pet = await Pet.findByPk(pet_id);
      if (!pet) {
        res.status(404).json({ error: 'Pet não encontrado' });
        return;
      }

      // Validação: Verificar se o usuário existe
      const usuario = await Usuario.findByPk(usuario_id);
      if (!usuario) {
        res.status(404).json({ error: 'Usuário não encontrado' });
        return;
      }

      // Validação: Verificar se o usuario_id do pet é diferente do usuario_id atual
      if (pet.usuario_id === usuario_id) {
        res.status(403).json({
          error: 'O usuário não pode solicitar associação com seu próprio pet',
        });
        return;
      }

      // Verificar se já existe uma associação entre este pet e usuário
      const existingAssociation = await MyPets.findOne({
        where: { pet_id, usuario_id },
      });

      if (existingAssociation) {
        res.status(409).json({ error: 'Esta associação já existe' });
        return;
      }

      // Criar a associação entre o pet e o usuário
      await MyPets.create({
        pet_id,
        usuario_id,
      });

      // Atualizar o status do pet para 3 (assumindo que 3 significa "associado")
      await pet.update({ status_id: 3 });

      res.status(201).json({ message: 'Associação criada com sucesso' });
    } catch (error) {
      console.error('Erro ao criar associação de pet com usuário:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
  public static async delete(req: Request, res: Response): Promise<void> {
    try {
      const { pet_id, usuario_id } = req.params;

      // Validação: Verificar se os campos obrigatórios estão presentes
      if (!pet_id || !usuario_id) {
        res.status(400).json({ error: 'Campos pet_id e usuario_id são obrigatórios' });
        return;
      }

      // Verificar se a associação existe
      const associacao = await MyPets.findOne({
        where: {
          pet_id: pet_id,
          usuario_id: usuario_id,
        },
      });

      if (!associacao) {
        res.status(404).json({ error: 'Associação não encontrada' });
        return;
      }

      // Verificar se o pet existe
      const pet = await Pet.findByPk(pet_id);
      if (!pet) {
        res.status(404).json({ error: 'Pet não encontrado' });
        return;
      }

      // Remover a associação
      await MyPets.destroy({
        where: {
          pet_id: pet_id,
          usuario_id: usuario_id,
        },
      });

      // Atualizar o status do pet para 2 (disponível para adoção)
      await pet.update({ status_id: 2 });

      res.status(200).json({
        message: 'Associação removida com sucesso',
        pet_id: pet_id,
        novo_status: 2,
      });
    } catch (error) {
      console.error('Erro ao remover associação de pet:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  public static async getByUsuarioId(req: Request, res: Response): Promise<void> {
    try {
      const { usuario_id } = req.params;

      // Validação: Verificar se o ID do usuário está presente
      if (!usuario_id) {
        res.status(400).json({ error: 'ID do usuário é obrigatório' });
        return;
      }

      // Buscar todas as associações de pets do usuário
      const associacoes = await MyPets.findAll({
        where: { usuario_id: usuario_id },
      });

      // Se não encontrou associações
      if (!associacoes || associacoes.length === 0) {
        res.status(200).json({ message: 'Nenhuma associação encontrada', data: [] });
        return;
      }

      // Buscar os dados completos de cada pet
      const petsCompletos = await Promise.all(
        associacoes.map(async (associacao) => {
          try {
            // Buscar dados do pet
            const pet = await Pet.findByPk(associacao.pet_id);

            if (!pet) {
              console.warn(`Pet com ID ${associacao.pet_id} não encontrado`);
              return null;
            }

            return pet;
          } catch (error) {
            console.error(`Erro ao buscar pet ID ${associacao.pet_id}:`, error);
            return null;
          }
        })
      );

      // Filtrar pets nulos e retornar
      const petsValidos = petsCompletos.filter((pet) => pet !== null);

      res.status(200).json({
        message: 'Associações encontradas com sucesso',
        data: petsValidos,
      });
    } catch (error) {
      console.error('Erro ao buscar associações de pets por usuário:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
}
