import { Request, Response, NextFunction, RequestHandler } from 'express';
import { Pet } from '../models/petModel';
import { DoencasDeficiencias } from '../models/doencasDeficienciasModel';
import { PetDoencaDeficiencia } from '../models/petDoencaDeficienciaModel';
import { Usuario } from '../models/usuarioModel';
import { Cidade } from '../models/cidadeModel';
import { supabase } from '../api/supabaseClient';

export class PetController {
  static getAll: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const pets = await Pet.findAll();
      res.json(pets); // REMOVIDO o "return"
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Erro ao listar os pets.' });
    }
  };

  static getById: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const pet = await Pet.findByPk(req.params.id);
      if (!pet) {
        res.status(404).json({ error: 'Pet não encontrado.' });
        return;
      }
      res.json(pet); // REMOVIDO o "return"
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Erro ao buscar o pet.' });
    }
  };

  static getByUsuarioId: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { usuario_id } = req.params;

      // Verificar se o ID do usuário foi fornecido
      if (!usuario_id) {
        res.status(400).json({ error: 'ID de usuário não fornecido.' });
        return;
      }

      // Verificar se o usuário existe
      const usuario = await Usuario.findByPk(usuario_id);
      if (!usuario) {
        res.status(404).json({ error: 'Usuário não encontrado.' });
        return;
      }

      // Buscar todos os pets associados ao usuário
      const pets = await Pet.findAll({
        where: { usuario_id: usuario_id },
      });

      // Se não encontrou nenhum pet, retornar um array vazio com status 200
      // ou você pode preferir status 404 com uma mensagem - conforme sua preferência
      res.status(200).json(pets);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Erro ao buscar pets por usuário.' });
    }
  };

  static create: RequestHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const {
        nome,
        especie_id,
        raca_id,
        idade,
        faixa_etaria_id,
        usuario_id,
        sexo_id,
        rg_Pet = null,
        motivoDoacao,
        doencas,
      } = req.body;

      console.log('Dados recebidos:', req.body);
      console.log('Arquivo recebido:', req.file);

      // Variável para armazenar a URL da foto
      let fotoUrl = null;

      // Verificar se um arquivo foi enviado
      if (req.file) {
        try {
          console.log('Arquivo presente, tamanho:', req.file.size);
          console.log('Tipo de arquivo:', req.file.mimetype);

          const fileBuffer = req.file.buffer;

          const filePath = `pets/${nome.replace(/\s+/g, '_')}_${Date.now()}.jpg`;
          const { data, error } = await supabase.storage.from('pet-images').upload(filePath, fileBuffer, {
            contentType: req.file.mimetype,
          });

          if (error) {
            console.error('Erro ao fazer upload da imagem no Supabase:', error);
          } else if (data?.path) {
            const { data: publicData } = supabase.storage.from('pet-images').getPublicUrl(data.path);
            fotoUrl = publicData?.publicUrl ?? null;
            console.log('URL da imagem gerada:', fotoUrl);
          }
        } catch (fileError) {
          console.error('Erro ao processar o arquivo:', fileError);
        }
      } else {
        console.log('Nenhum arquivo foi enviado');
      }

      // Continuar com a criação do pet
      // Buscar o usuário e a cidade dele
      const usuario = await Usuario.findByPk(usuario_id);
      if (!usuario) {
        res.status(400).json({ error: 'Usuário não encontrado.' });
        return;
      }

      const cidade = await Cidade.findByPk(usuario.cidade_id);
      if (!cidade) {
        res.status(400).json({ error: 'Cidade do usuário não encontrada.' });
        return;
      }

      // Remover formatação do RG (pontos, traços, espaços e outros caracteres não numéricos)
      const rgSemFormatacao = rg_Pet ? rg_Pet.replace(/[^0-9a-zA-Z]/g, '') : null;

      // Criar o novo pet com os dados recebidos e a URL da imagem
      const novoPet = await Pet.create({
        nome,
        especie_id,
        raca_id,
        idade,
        faixa_etaria_id,
        usuario_id,
        sexo_id,
        rg_Pet: rgSemFormatacao, // Salvar RG sem formatação
        motivoDoacao,
        status_id: 1, // Status padrão (1 = disponível)
        cidade_id: usuario.cidade_id,
        estado_id: cidade.estado_id,
        foto: fotoUrl, // Armazenar a URL da imagem (ou null caso não tenha imagem)
      });

      console.log('Pet criado com sucesso:', novoPet.id);

      // Se houver doenças relacionadas ao pet, associe-as
      if (doencas && Array.isArray(doencas)) {
        await Promise.all(
          doencas.map(async (nome: string) => {
            const [doenca] = await DoencasDeficiencias.findOrCreate({
              where: { nome },
            });

            await PetDoencaDeficiencia.create({
              pet_id: novoPet.id,
              doencaDeficiencia_id: doenca.id,
              possui: true,
            });
          })
        );
        console.log('Doenças associadas ao pet');
      }

      res.status(201).json(novoPet); // Retorne o pet recém-criado
    } catch (error) {
      console.error('Erro completo:', error);
      next(error); // Passa o erro para o próximo middleware de tratamento de erros
      return; // Encerra a execução da função
    }
  };

  static update: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { doencas, ...dadosAtualizados } = req.body;

      // Buscar o Pet pelo ID
      const pet = await Pet.findByPk(id);
      if (!pet) {
        res.status(404).json({ error: 'Pet não encontrado.' });
        return;
      }

      // Verificar se tem um arquivo de imagem
      let fotoUrl = dadosAtualizados.foto || pet.foto; // Mantém a foto atual se não for enviada nova

      if (req.file) {
        try {
          // Se o pet já tiver uma foto e estamos fazendo upload de uma nova,
          // devemos deletar a antiga do Supabase
          if (pet.foto) {
            try {
              // Extrair o caminho do arquivo da URL
              // A URL completa é algo como: https://xxxxx.supabase.co/storage/v1/object/public/pet-images/pets/nome_123456789.jpg
              // E precisamos extrair: pets/nome_123456789.jpg

              // Método 1: Se o formato da URL for consistente e tiver 'pet-images/' como parte do caminho
              const urlParts = pet.foto.split('pet-images/');
              if (urlParts.length > 1) {
                const filePath = urlParts[1];

                console.log('Tentando deletar imagem antiga:', filePath);

                const { error: deleteError } = await supabase.storage.from('pet-images').remove([filePath]);

                if (deleteError) {
                  console.error('Erro ao deletar imagem antiga do Supabase:', deleteError);
                } else {
                  console.log('Imagem antiga deletada com sucesso');
                }
              }
            } catch (deleteError) {
              console.error('Erro ao tentar deletar imagem antiga:', deleteError);
              // Continuar mesmo se falhar a deleção da imagem antiga
            }
          }

          // Fazer upload da nova imagem
          const fileBuffer = req.file.buffer;
          const filePath = `pets/${pet.nome.replace(/\s+/g, '_')}_${Date.now()}.jpg`;

          const { data, error } = await supabase.storage.from('pet-images').upload(filePath, fileBuffer, {
            contentType: req.file.mimetype,
          });

          if (error) {
            console.error('Erro ao fazer upload da imagem no Supabase:', error);
          } else if (data?.path) {
            const { data: publicData } = supabase.storage.from('pet-images').getPublicUrl(data.path);
            fotoUrl = publicData?.publicUrl ?? null;
            console.log('Nova URL da imagem gerada:', fotoUrl);
          }
        } catch (fileError) {
          console.error('Erro ao processar o arquivo:', fileError);
        }
      }

      // Adicionar a URL da foto aos dados atualizados
      dadosAtualizados.foto = fotoUrl;

      // Atualizar o pet com os dados recebidos
      await pet.update(dadosAtualizados);

      // Se tiver doenças/deficiências, atualizar as associações
      if (doencas && Array.isArray(doencas)) {
        // Processar cada doença recebida
        const doencasProcessadas = await Promise.all(
          doencas.map(async (doenca: string | number) => {
            let doencaId: number;

            // Se for um ID (número)
            if (typeof doenca === 'number') {
              const doencaExistente = await DoencasDeficiencias.findByPk(doenca);
              if (!doencaExistente) return null; // Ignorar se a doença não existir
              doencaId = doenca;
            }
            // Se for um nome (string)
            else if (typeof doenca === 'string') {
              const [doencaObj] = await DoencasDeficiencias.findOrCreate({
                where: { nome: doenca },
              });
              doencaId = doencaObj.id;
            } else {
              return null; // Ignorar tipos inválidos
            }

            return doencaId;
          })
        );

        // Filtrar valores nulos
        const doencasIds = doencasProcessadas.filter((id) => id !== null) as number[];

        // IMPORTANTE: Em vez de verificar e criar/atualizar individualmente,
        // vamos remover todas e adicionar apenas as que foram enviadas
        // Isso evita duplicações e mantém sincronizado com os dados enviados

        // 1. Remover todas as associações existentes
        await PetDoencaDeficiencia.destroy({
          where: { pet_id: pet.id },
        });

        // 2. Criar novas associações com os IDs processados
        if (doencasIds.length > 0) {
          await Promise.all(
            doencasIds.map((doencaId) =>
              PetDoencaDeficiencia.create({
                pet_id: pet.id,
                doencaDeficiencia_id: doencaId,
                possui: true,
              })
            )
          );
        }
      }

      // Buscar o pet atualizado com suas relações para retornar na resposta
      const petAtualizado = await Pet.findByPk(id, {
        include: [
          {
            model: DoencasDeficiencias,
            as: 'doencasDeficiencias',
            through: { attributes: ['possui'] },
          },
        ],
      });

      res.json(petAtualizado);
    } catch (error) {
      console.error('Erro ao atualizar o pet:', error);
      res.status(500).json({ error: 'Erro ao atualizar o pet.' });
    }
  };

  static updateStatus: RequestHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      // Buscar o Pet pelo ID
      const pet = await Pet.findByPk(id);
      if (!pet) {
        res.status(404).json({ error: 'Pet não encontrado.' });
        return;
      }

      let novoStatus: number;

      // Verificar status atual e definir o novo status
      if (pet.status_id === 1) {
        novoStatus = 2;
      } else if (pet.status_id === 3) {
        novoStatus = 4;
      } else {
        res.status(400).json({
          error: 'Apenas pets com status 1 ou 2 podem ser atualizados.',
          status_atual: pet.status_id,
        });
        return;
      }

      // Atualizar para o novo status
      await pet.update({ status_id: novoStatus });

      // Buscar o pet atualizado para retornar na resposta
      const petAtualizado = await Pet.findByPk(id);

      res.json(petAtualizado);
    } catch (error) {
      console.error('Erro ao atualizar o status do pet:', error);
      res.status(500).json({ error: 'Erro ao atualizar o status do pet.' });
    }
  };

  static getByStatusId: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const status_id = 2; // Status fixo, apenas status 2 é permitido

      // Buscar todos os pets com o status especificado (status 2)
      const pets = await Pet.findAll({
        where: { status_id },
      });

      // Retornar a lista de pets (mesmo que seja vazia)
      res.status(200).json(pets);
    } catch (error) {
      console.error('Erro ao buscar pets por status:', error);
      res.status(500).json({ error: 'Erro ao buscar pets por status.' });
    }
  };
  static delete: RequestHandler = async (req, res, next) => {
    try {
      const { id } = req.params;

      // Verificar se o pet existe e recuperar seus dados, incluindo a URL da imagem
      const pet = await Pet.findByPk(id);
      if (!pet) {
        res.status(404).json({ message: 'Pet não encontrado.' });
        return;
      }

      // Obter a referência da imagem antes de deletar o pet
      const petData = pet.get({ plain: true });
      const imageUrl = petData.imageUrl || petData.image_url; // Considere os dois possíveis nomes de campo

      // Extrair o caminho/nome do arquivo da URL da imagem (se existir)
      let imagePath = null;
      if (imageUrl) {
        // Assumindo que o URL segue um padrão como ".../storage/v1/object/bucket-name/filename.jpg"
        // Extraímos apenas o filename.jpg
        imagePath = imageUrl.split('/').pop();
      }

      // Primeiro remover as associações com doenças/deficiências
      // para evitar problemas de chaves estrangeiras
      await PetDoencaDeficiencia.destroy({
        where: { pet_id: id },
      });

      // Agora podemos deletar o pet com segurança
      await pet.destroy();

      // Se tiver uma imagem, deletá-la do Supabase Storage
      if (imagePath) {
        try {
          const { supabase } = require('../config/supabaseClient'); // Ajuste o caminho conforme necessário

          // Assumindo que suas imagens estão em um bucket chamado 'pets'
          const { error } = await supabase.storage
            .from('pets') // Use o nome correto do seu bucket
            .remove([imagePath]);

          if (error) {
            console.error('Erro ao deletar imagem do Supabase:', error);
            res.status(200).json({
              message: 'Pet deletado com sucesso, mas houve um erro ao deletar a imagem.',
            });
            return;
          }
        } catch (imageError) {
          console.error('Exceção ao tentar deletar imagem:', imageError);
          res.status(200).json({
            message: 'Pet deletado com sucesso, mas houve um erro ao deletar a imagem.',
          });
          return;
        }
      }

      res.status(200).json({ message: 'Pet e imagem associada deletados com sucesso.' });
    } catch (error) {
      console.error('Erro ao deletar pet:', error);
      res.status(500).json({ error: 'Erro ao deletar pet.' });
    }
  };
}
