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
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // Método auxiliar para limpar associações órfãs
  public static async cleanOrphanedAssociations(req: Request, res: Response): Promise<void> {
    try {
      console.log('🧹 Iniciando limpeza de associações órfãs...');

      // Buscar todas as associações
      const todasAssociacoes = await MyPets.findAll();
      
      let associacoesRemovidas = 0;
      
      for (const associacao of todasAssociacoes) {
        // Verificar se o pet ainda existe
        const pet = await Pet.findByPk(associacao.pet_id);
        
        if (!pet) {
          // Pet não existe mais, remover associação
          await MyPets.destroy({
            where: {
              pet_id: associacao.pet_id,
              usuario_id: associacao.usuario_id
            }
          });
          associacoesRemovidas++;
          console.log(`🗑️ Removida associação órfã: Pet ${associacao.pet_id} - Usuario ${associacao.usuario_id}`);
        } else {
          // Verificar se o usuário ainda existe
          const usuario = await Usuario.findByPk(associacao.usuario_id);
          
          if (!usuario) {
            // Usuário não existe mais, remover associação
            await MyPets.destroy({
              where: {
                pet_id: associacao.pet_id,
                usuario_id: associacao.usuario_id
              }
            });
            associacoesRemovidas++;
            console.log(`🗑️ Removida associação órfã: Pet ${associacao.pet_id} - Usuario inexistente ${associacao.usuario_id}`);
          }
        }
      }

      console.log(`✅ Limpeza concluída. ${associacoesRemovidas} associações órfãs removidas.`);

      res.status(200).json({
        message: 'Limpeza de associações órfãs concluída',
        associacoes_removidas: associacoesRemovidas,
        total_verificadas: todasAssociacoes.length
      });

    } catch (error) {
      console.error('❌ Erro na limpeza de associações órfãs:', error);
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

      // Converter para números
      const petIdNumber = parseInt(pet_id);
      const usuarioIdNumber = parseInt(usuario_id);

      if (isNaN(petIdNumber) || isNaN(usuarioIdNumber)) {
        res.status(400).json({ error: 'pet_id e usuario_id devem ser números válidos' });
        return;
      }

      // Verificar se a associação existe
      const associacao = await MyPets.findOne({
        where: {
          pet_id: petIdNumber,
          usuario_id: usuarioIdNumber,
        },
      });

      if (!associacao) {
        res.status(404).json({ error: 'Associação não encontrada' });
        return;
      }

      // Verificar se o pet existe
      const pet = await Pet.findByPk(petIdNumber);
      if (!pet) {
        res.status(404).json({ error: 'Pet não encontrado' });
        return;
      }

      console.log('🔍 Debug - Pet Info:', {
        petId: petIdNumber,
        petUsuarioId: pet.usuario_id,
        petAdotanteId: pet.adotante_id,
        petDoadorId: pet.doador_id,
        petStatus: pet.status_id,
        usuarioSolicitante: usuarioIdNumber
      });

      // ✅ NOVA LÓGICA: Verificar se o usuário é o adotante atual OU tem associação válida
      const isAdotanteAtual = pet.adotante_id === usuarioIdNumber;
      const isResponsavelAtual = pet.usuario_id === usuarioIdNumber;
      
      if (isAdotanteAtual || isResponsavelAtual) {
        // ✅ USUÁRIO É O ADOTANTE/RESPONSÁVEL ATUAL
        
        if (pet.status_id === 4 && isAdotanteAtual) {
          // Pet adotado - devolver ao doador original
          const doadorOriginal = await Usuario.findByPk(pet.doador_id);
          if (!doadorOriginal) {
            res.status(404).json({ error: 'Doador original não encontrado' });
            return;
          }

          if (!doadorOriginal.cidade_id || !doadorOriginal.estado_id) {
            res.status(400).json({ error: 'Doador original não possui localização válida' });
            return;
          }

          const transaction = await Pet.sequelize!.transaction();

          try {
            // Remover TODAS as associações MyPets para este pet
            await MyPets.destroy({
              where: {
                pet_id: petIdNumber,
              },
              transaction
            });

            // Devolver pet ao doador original
            await pet.update({
              usuario_id: pet.doador_id,
              adotante_id: null,
              cidade_id: doadorOriginal.cidade_id,
              estado_id: doadorOriginal.estado_id,
              status_id: 2, // Disponível para adoção
            }, { transaction });

            await transaction.commit();

            console.log('✅ Pet devolvido com sucesso:', {
              petId: petIdNumber,
              doadorOriginalId: pet.doador_id,
              novoStatus: 2
            });

            res.status(200).json({
              message: 'Pet devolvido ao doador original com sucesso',
              acao: 'devolucao',
              pet_id: petIdNumber,
              novo_status: 2,
              doador_original: {
                id: pet.doador_id,
                nome: doadorOriginal.nome,
              },
            });

          } catch (transactionError) {
            await transaction.rollback();
            console.error('❌ Erro na transação:', transactionError);
            throw transactionError;
          }

        } else {
          // Pet em outros status - remover associação do usuário
          const deletedCount = await MyPets.destroy({
            where: {
              pet_id: petIdNumber,
              usuario_id: usuarioIdNumber,
            },
          });

          console.log('🗑️ Associações removidas:', deletedCount);

          // Verificar se ainda há outros interessados
          const outrosInteressados = await MyPets.count({
            where: { pet_id: petIdNumber },
          });

          // Se não há mais interessados e pet estava com interesse, voltar para disponível
          if (outrosInteressados === 0 && pet.status_id === 3) {
            await pet.update({ status_id: 2 });
          }

          res.status(200).json({
            message: 'Associação removida com sucesso',
            acao: 'remover_associacao',
            pet_id: petIdNumber,
            novo_status: outrosInteressados === 0 && pet.status_id === 3 ? 2 : pet.status_id,
            associacoes_removidas: deletedCount
          });
        }

      } else {
        // ✅ USUÁRIO NÃO É O RESPONSÁVEL: Apenas remover interesse
        
        const deletedCount = await MyPets.destroy({
          where: {
            pet_id: petIdNumber,
            usuario_id: usuarioIdNumber,
          },
        });

        console.log('🗑️ Interesse removido:', deletedCount);

        // Verificar se ainda há outros interessados
        const outrosInteressados = await MyPets.count({
          where: { pet_id: petIdNumber },
        });

        // Se não há mais interessados e pet estava com interesse, voltar para disponível
        if (outrosInteressados === 0 && pet.status_id === 3) {
          await pet.update({ status_id: 2 });
        }

        res.status(200).json({
          message: 'Interesse no pet removido com sucesso',
          acao: 'remover_interesse',
          pet_id: petIdNumber,
          novo_status: outrosInteressados === 0 && pet.status_id === 3 ? 2 : pet.status_id,
          associacoes_removidas: deletedCount
        });
      }

    } catch (error) {
      console.error('❌ Erro no MyPets delete:', error);
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

      const usuarioIdNumber = parseInt(usuario_id);
      if (isNaN(usuarioIdNumber)) {
        res.status(400).json({ error: 'ID do usuário deve ser um número válido' });
        return;
      }

      console.log('🔍 Buscando pets para usuário:', usuarioIdNumber);

      // Buscar todas as associações de pets do usuário
      const associacoes = await MyPets.findAll({
        where: { usuario_id: usuarioIdNumber },
      });

      console.log('📋 Associações encontradas:', associacoes.length);

      // Se não encontrou associações
      if (!associacoes || associacoes.length === 0) {
        res.status(200).json({ message: 'Nenhuma associação encontrada', data: [] });
        return;
      }

      // Buscar os dados completos de cada pet
      const petsCompletos = await Promise.all(
        associacoes.map(async (associacao) => {
          try {
            console.log('🐾 Buscando pet ID:', associacao.pet_id);
            
            // Buscar dados do pet
            const pet = await Pet.findByPk(associacao.pet_id);

            if (!pet) {
              console.log('❌ Pet não encontrado:', associacao.pet_id);
              return null;
            }

            console.log('✅ Pet encontrado:', {
              id: pet.id,
              nome: pet.nome,
              status: pet.status_id,
              usuario_id: pet.usuario_id,
              adotante_id: pet.adotante_id
            });

            return pet;
          } catch (error) {
            console.error('❌ Erro ao buscar pet:', associacao.pet_id, error);
            return null;
          }
        })
      );

      // Filtrar pets nulos e retornar
      const petsValidos = petsCompletos.filter((pet) => pet !== null);

      console.log('📊 Resultado final:', {
        associacoesEncontradas: associacoes.length,
        petsValidos: petsValidos.length,
        petIds: petsValidos.map(p => p?.id)
      });

      res.status(200).json({
        message: 'Associações encontradas com sucesso',
        data: petsValidos,
        debug: {
          usuario_id: usuarioIdNumber,
          total_associacoes: associacoes.length,
          pets_validos: petsValidos.length
        }
      });
    } catch (error) {
      console.error('❌ Erro no getByUsuarioId:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
}