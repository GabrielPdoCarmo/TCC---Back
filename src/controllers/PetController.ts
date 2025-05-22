import { Request, Response, NextFunction, RequestHandler } from 'express';
import { Pet } from '../models/petModel';
import { DoencasDeficiencias } from '../models/doencasDeficienciasModel';
import { PetDoencaDeficiencia } from '../models/petDoencaDeficienciaModel';
import { Usuario } from '../models/usuarioModel';
import { Cidade } from '../models/cidadeModel';
import { supabase } from '../api/supabaseClient';

export class PetController {
  // Funções existentes mantidas...
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

  static getByNamePet: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { nome } = req.params;

      // Verificar se o nome foi fornecido
      if (!nome) {
        res.status(400).json({ error: 'Nome do pet não fornecido.' });
        return;
      }

      // Buscar o pet pelo nome
      const pet = await Pet.findOne({
        where: { nome },
      });

      // Se não encontrou nenhum pet, retornar um array vazio com status 200
      // ou você pode preferir status 404 com uma mensagem - conforme sua preferência
      if (!pet) {
        res.status(404).json({ error: 'Pet não encontrado.' });
        return;
      }

      res.status(200).json(pet);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Erro ao buscar pet pelo nome.' });
    }
  };
  static getByRacaId: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { raca_id } = req.params;
      // Verificar se o ID da raça foi fornecido
      if (!raca_id) {
        res.status(400).json({ error: 'ID da raça não fornecido.' });
        return;
      }
      // Buscar todos os pets associados à raça
      const pets = await Pet.findAll({
        where: { raca_id: raca_id },
      });
      // Se não encontrou nenhum pet, retornar um array vazio com status 200
      // ou você pode preferir status 404 com uma mensagem - conforme sua preferência
      if (pets.length === 0) {
        res.status(404).json({ error: 'Nenhum pet encontrado para esta raça.' });
        return;
      }
      res.status(200).json(pets);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Erro ao buscar pets por raça.' });
    }
  };
  static getByEspecieId: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { especie_id } = req.params;
      // Verificar se o ID da espécie foi fornecido
      if (!especie_id) {
        res.status(400).json({ error: 'ID da espécie não fornecido.' });
        return;
      }
      // Buscar todos os pets associados à espécie
      const pets = await Pet.findAll({
        where: { especie_id: especie_id },
      });
      // Se não encontrou nenhum pet, retornar um array vazio com status 200
      // ou você pode preferir status 404 com uma mensagem - conforme sua preferência
      if (pets.length === 0) {
        res.status(404).json({ error: 'Nenhum pet encontrado para esta espécie.' });
        return;
      }
      res.status(200).json(pets);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Erro ao buscar pets por espécie.' });
    }
  };
  static getByCidadeId_EstadoId: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { cidade_id, estado_id } = req.params;
      // Verificar se o ID da cidade e do estado foram fornecidos
      if (!cidade_id || !estado_id) {
        res.status(400).json({ error: 'ID da cidade ou do estado não fornecido.' });
        return;
      }
      // Buscar todos os pets associados à cidade e ao estado
      const pets = await Pet.findAll({
        where: {
          cidade_id: cidade_id,
          estado_id: estado_id,
        },
      });
      // Se não encontrou nenhum pet, retornar um array vazio com status 200
      // ou você pode preferir status 404 com uma mensagem - conforme sua preferência
      if (pets.length === 0) {
        res.status(404).json({ error: 'Nenhum pet encontrado para esta cidade e estado.' });
        return;
      }
      res.status(200).json(pets);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Erro ao buscar pets por cidade e estado.' });
    }
  };

  static getByFaixaEtariaId_Idade: RequestHandler = async (req: Request, res: Response, next: NextFunction) => { 
    try {
      const { faixa_etaria_id, idade } = req.params;
      // Verificar se o ID da faixa etária e a idade foram fornecidos
      if (!faixa_etaria_id || !idade) {
        res.status(400).json({ error: 'ID da faixa etária ou idade não fornecido.' });
        return;
      }
      // Buscar todos os pets associados à faixa etária e idade
      const pets = await Pet.findAll({
        where: {
          faixa_etaria_id: faixa_etaria_id,
          idade: idade,
        },
      });
      // Se não encontrou nenhum pet, retornar um array vazio com status 200
      // ou você pode preferir status 404 com uma mensagem - conforme sua preferência
      if (pets.length === 0) {
        res.status(404).json({ error: 'Nenhum pet encontrado para esta faixa etária e idade.' });
        return;
      }
      res.status(200).json(pets);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Erro ao buscar pets por faixa etária e idade.' });
    }
  }

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

  // Correção para o método update

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

      // Verificar se a URL da foto é local (começa com file:///)
      const isLocalImage = typeof fotoUrl === 'string' && fotoUrl.startsWith('file:///');

      // Se for uma URL local, precisamos fazer upload para o Supabase
      if (isLocalImage && !req.file) {
        console.log('URL local detectada sem novo arquivo de upload, essa URL não pode ser usada:', fotoUrl);
        // Duas opções aqui:
        // 1. Manter a URL anterior do Supabase (se existir)
        // 2. Informar erro ao cliente

        // Opção 1: Manter a URL anterior
        if (pet.foto && pet.foto.includes('supabase')) {
          console.log('Mantendo a URL anterior do Supabase:', pet.foto);
          fotoUrl = pet.foto;
        } else {
          // Opção 2: Informar erro
          res.status(400).json({
            error:
              'A URL da imagem é um caminho local e não pode ser usada no servidor. Por favor, envie o arquivo novamente.',
          });
          return;
        }
      }

      // Se tiver arquivo de upload, processar normalmente
      if (req.file) {
        try {
          // Se o pet já tiver uma foto e estamos fazendo upload de uma nova,
          // devemos deletar a antiga do Supabase APENAS se for uma URL do Supabase
          const petFoto = pet.foto;
          if (petFoto && petFoto.includes('supabase')) {
            console.log('Tentando deletar imagem antiga do Supabase ao atualizar pet:', petFoto);

            const urlParts = petFoto.split('pet-images/');
            if (urlParts.length > 1) {
              const filePath = urlParts[1].split('?')[0]; // Extrair caminho correto
              console.log('Caminho extraído para deleção:', filePath);

              const { error: deleteError } = await supabase.storage.from('pet-images').remove([filePath]);

              if (deleteError) {
                console.error('Erro ao deletar imagem antiga do Supabase:', deleteError);
              } else {
                console.log('Imagem antiga deletada com sucesso durante atualização');
              }
            } else {
              console.error('Formato de URL inesperado, não foi possível extrair caminho para deleção:', petFoto);
            }
          }

          // Usar o nome atualizado do pet se disponível
          const nomePet = dadosAtualizados.nome || pet.nome;

          // Fazer upload da nova imagem
          const fileBuffer = req.file.buffer;
          const filePath = `pets/${nomePet.replace(/\s+/g, '_')}_${Date.now()}.jpg`;

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

      // Resto do código permanece o mesmo...
      // Processamento de doenças/deficiências...

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
      // Usar apenas foto, padronizando com as outras rotas
      const fotoUrl = petData.foto;

      console.log('Pet a ser deletado:', { id, foto: fotoUrl });

      // Primeiro remover as associações com doenças/deficiências
      await PetDoencaDeficiencia.destroy({
        where: { pet_id: id },
      });

      // Agora deletar o pet do banco de dados
      await pet.destroy();
      console.log('Pet deletado do banco de dados com sucesso');

      // Tentar deletar a imagem apenas se for uma URL do Supabase
      // URLs locais (file:///) não precisam ser processadas no servidor
      let imagemDeletada = false;
      if (fotoUrl && fotoUrl.includes('supabase')) {
        try {
          // Extrair o caminho do arquivo diretamente da URL
          const urlParts = fotoUrl.split('pet-images/');

          if (urlParts.length > 1) {
            // Extrair o caminho corretamente removendo os parâmetros de consulta (tudo após ?)
            const filePath = urlParts[1].split('?')[0];
            console.log('Caminho extraído para deleção:', filePath);

            const { error: deleteError } = await supabase.storage.from('pet-images').remove([filePath]);

            if (deleteError) {
              console.error('Erro ao deletar imagem do Supabase:', deleteError);
              res.status(200).json({
                message: 'Pet deletado com sucesso, mas houve um erro ao deletar a imagem.',
                imageError: deleteError.message,
              });
              return;
            } else {
              console.log('Imagem deletada com sucesso');
              imagemDeletada = true;
            }
          } else {
            console.log(
              'URL da imagem não contém "pet-images/", não é uma URL do Supabase ou está em formato inesperado:',
              fotoUrl
            );
          }
        } catch (deleteError) {
          console.error('Erro ao tentar deletar imagem:', deleteError);
        }
      } else if (fotoUrl && fotoUrl.startsWith('file:///')) {
        console.log('URL do tipo arquivo local detectada, não é necessário excluir no servidor:', fotoUrl);
      } else if (!fotoUrl) {
        console.log('Nenhuma URL de imagem associada a este pet');
      }

      res.status(200).json({
        message: 'Pet deletado com sucesso',
        deletedPetId: id,
        imagemTipo: fotoUrl
          ? fotoUrl.includes('supabase')
            ? 'supabase'
            : fotoUrl.startsWith('file:///')
            ? 'arquivo_local'
            : 'outro'
          : 'sem_imagem',
        imagemDeletada: imagemDeletada,
      });
    } catch (error) {
      console.error('Erro ao deletar pet:', error);
      res.status(500).json({
        error: 'Erro ao deletar pet.',
      });
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
}
