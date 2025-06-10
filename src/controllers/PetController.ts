import { Request, Response, NextFunction, RequestHandler } from 'express';
import { Pet } from '../models/petModel';
import { DoencasDeficiencias } from '../models/doencasDeficienciasModel';
import { PetDoencaDeficiencia } from '../models/petDoencaDeficienciaModel';
import { Usuario } from '../models/usuarioModel';
import { Cidade } from '../models/cidadeModel';
import { supabase } from '../api/supabaseClient';

export class PetController {
  // ✅ Função helper para sanitizar rg_Pet
  private static sanitizeRgPet(value: any): string | null {
    if (!value || value === '' || (typeof value === 'string' && value.trim() === '')) {
      return null; // ✅ Converte string vazia para NULL
    }

    // Remove formatação (pontos, traços, espaços)
    const cleaned = value.toString().replace(/[^0-9a-zA-Z]/g, '');

    // Se após limpeza ficar vazio, retorna null
    return cleaned === '' ? null : cleaned;
  }

  // Funções existentes mantidas...
  static getAll: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const pets = await Pet.findAll();
      res.json(pets); // REMOVIDO o "return"
    } catch (error) {
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

      // Buscar o pet pelo nome E com status_id = 2
      const pet = await Pet.findAll({
        where: {
          nome,
          status_id: 2,
        },
      });

      // Se não encontrou nenhum pet, retornar erro 404
      if (pet.length === 0) {
        res.status(404).json({ error: 'Pet não encontrado com status ativo.' });
        return;
      }

      res.status(200).json(pet);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar pet pelo nome.' });
    }
  };

  static getByNomePet_StatusId: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { nome } = req.params;
      const { usuario_id } = req.body;

      // Verificar se o nome foi fornecido
      if (!nome) {
        res.status(400).json({ error: 'Nome do pet não fornecido.' });
        return;
      }

      // Verificar se o usuario_id foi fornecido
      if (!usuario_id) {
        res.status(400).json({ error: 'ID do usuário não fornecido.' });
        return;
      }

      // Verificar se o usuário existe
      const usuario = await Usuario.findByPk(usuario_id);
      if (!usuario) {
        res.status(404).json({ error: 'Usuário não encontrado.' });
        return;
      }

      // Buscar o pet pelo nome, status_id 3 ou 4 E que pertença ao usuário logado
      const pets = await Pet.findAll({
        where: {
          nome: nome,
          status_id: [3, 4], // Filtra apenas pets com status 3 ou 4
          usuario_id: usuario_id, // NOVO: Filtra apenas pets do usuário logado
        },
      });

      // Se não encontrou nenhum pet
      if (pets.length === 0) {
        res.status(404).json({
          error: 'Nenhum pet encontrado com este nome, status válido (3 ou 4) e que pertença ao usuário.',
        });
        return;
      }

      res.status(200).json(pets);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar pet pelo nome, status e usuário.' });
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
      res.status(500).json({ error: 'Erro ao buscar pets por raça.' });
    }
  };

  static getByRacaId_StatusId: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { raca_id, status_id } = req.params;
      // Verificar se o ID da raça e o status foram fornecidos
      if (!raca_id || !status_id) {
        res.status(400).json({ error: 'ID da raça ou status não fornecido.' });
        return;
      }
      // Buscar todos os pets associados à raça e ao status
      const pets = await Pet.findAll({
        where: {
          raca_id: raca_id,
          status_id: 3,
        },
      });
      // Se não encontrou nenhum pet, retornar um array vazio com status 200
      // ou você pode preferir status 404 com uma mensagem - conforme sua preferência
      if (pets.length === 0) {
        res.status(404).json({ error: 'Nenhum pet encontrado para esta raça e status.' });
        return;
      }
      res.status(200).json(pets);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar pets por raça e status.' });
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
      res.status(500).json({ error: 'Erro ao buscar pets por espécie.' });
    }
  };

  static getByEspecieId_StatusId: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { especie_id, status_id } = req.params;
      // Verificar se o ID da espécie e o status foram fornecidos
      if (!especie_id || !status_id) {
        res.status(400).json({ error: 'ID da espécie ou status não fornecido.' });
        return;
      }
      // Buscar todos os pets associados à espécie e ao status
      const pets = await Pet.findAll({
        where: {
          especie_id: especie_id,
          status_id: 3,
        },
      });
      // Se não encontrou nenhum pet, retornar um array vazio com status 200
      // ou você pode preferir status 404 com uma mensagem - conforme sua preferência
      if (pets.length === 0) {
        res.status(404).json({ error: 'Nenhum pet encontrado para esta espécie e status.' });
        return;
      }
      res.status(200).json(pets);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar pets por espécie e status.' });
    }
  };

  static getByEstadoId_CidadeId: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { estado_id, cidade_id } = req.params;
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
      res.status(500).json({ error: 'Erro ao buscar pets por cidade e estado.' });
    }
  };

  static getByEstadoId_CidadeId_StatusId: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { estado_id, cidade_id, status_id } = req.params;
      // Verificar se o ID da cidade, do estado e o status foram fornecidos
      if (!cidade_id || !estado_id || !status_id) {
        res.status(400).json({ error: 'ID da cidade, estado ou status não fornecido.' });
        return;
      }
      // Buscar todos os pets associados à cidade, estado e status
      const pets = await Pet.findAll({
        where: {
          cidade_id: cidade_id,
          estado_id: estado_id,
          status_id: 3, // Status fixo, apenas status 3 é permitido
        },
      });
      // Se não encontrou nenhum pet, retornar um array vazio com status 200
      // ou você pode preferir status 404 com uma mensagem - conforme sua preferência
      if (pets.length === 0) {
        res.status(404).json({ error: 'Nenhum pet encontrado para esta cidade, estado e status.' });
        return;
      }
      res.status(200).json(pets);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar pets por cidade, estado e status.' });
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
      res.status(500).json({ error: 'Erro ao buscar pets por faixa etária e idade.' });
    }
  };
  static getByFaixaEtariaId_Idade_StatusId: RequestHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { faixa_etaria_id, idade, status_id } = req.params;
      // Verificar se o ID da faixa etária, idade e status foram fornecidos
      if (!faixa_etaria_id || !idade || !status_id) {
        res.status(400).json({ error: 'ID da faixa etária, idade ou status não fornecido.' });
        return;
      }
      // Buscar todos os pets associados à faixa etária, idade e status
      const pets = await Pet.findAll({
        where: {
          faixa_etaria_id: faixa_etaria_id,
          idade: idade,
          status_id: 3, // Status fixo, apenas status 3 é permitido
        },
      });
      // Se não encontrou nenhum pet, retornar um array vazio com status 200
      // ou você pode preferir status 404 com uma mensagem - conforme sua preferência
      if (pets.length === 0) {
        res.status(404).json({ error: 'Nenhum pet encontrado para esta faixa etária, idade e status.' });
        return;
      }
      res.status(200).json(pets);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar pets por faixa etária, idade e status.' });
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
      res.status(500).json({ error: 'Erro ao buscar pets por usuário.' });
    }
  };

  /**
   * Método responsável pelo cadastro de novos pets no sistema
   * Implementa upload de imagens, validações de negócio e criação de relacionamentos
   */
  static create: RequestHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Desestruturação dos dados recebidos do frontend
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

      // ========== PROCESSAMENTO DE UPLOAD DE IMAGEM ==========
      let fotoUrl = null;

      // Verificar se um arquivo de imagem foi enviado via multer
      if (req.file) {
        try {
          const fileBuffer = req.file.buffer;

          // Gerar nome único para o arquivo evitando conflitos
          const filePath = `pets/${nome.replace(/\s+/g, '_')}_${Date.now()}.jpg`;

          // Upload para Supabase Storage
          const { data, error } = await supabase.storage.from('pet-images').upload(filePath, fileBuffer, {
            contentType: req.file.mimetype,
          });

          if (error) {
          } else if (data?.path) {
            // Obter URL pública da imagem para armazenar no banco
            const { data: publicData } = supabase.storage.from('pet-images').getPublicUrl(data.path);
            fotoUrl = publicData?.publicUrl ?? null;
          }
        } catch (fileError) {}
      }

      // ========== VALIDAÇÕES DE NEGÓCIO ==========

      // Validar se o usuário existe
      const usuario = await Usuario.findByPk(usuario_id);
      if (!usuario) {
        res.status(400).json({ error: 'Usuário não encontrado.' });
        return;
      }

      // Buscar cidade do usuário para definir localização do pet
      const cidade = await Cidade.findByPk(usuario.cidade_id);
      if (!cidade) {
        res.status(400).json({ error: 'Cidade do usuário não encontrada.' });
        return;
      }

      // ========== SANITIZAÇÃO DE DADOS ==========
      // Converter string vazia em null para campos opcionais
      const rgSanitizado = PetController.sanitizeRgPet(rg_Pet);

      // ========== CRIAÇÃO DO REGISTRO DO PET ==========
      const novoPet = await Pet.create({
        nome,
        especie_id,
        raca_id,
        idade,
        faixa_etaria_id,
        usuario_id,
        sexo_id,
        rg_Pet: rgSanitizado,
        motivoDoacao,
        status_id: 1, // Status padrão: disponível para adoção
        cidade_id: usuario.cidade_id, // Herda localização do usuário
        estado_id: cidade.estado_id,
        foto: fotoUrl, // URL da imagem no Supabase ou null
      });

      // ========== CRIAÇÃO DE RELACIONAMENTOS ==========
      // Associar doenças/deficiências ao pet (relacionamento N:N)
      if (doencas && Array.isArray(doencas)) {
        await Promise.all(
          doencas.map(async (nome: string) => {
            // Buscar ou criar doença/deficiência
            const [doenca] = await DoencasDeficiencias.findOrCreate({
              where: { nome },
            });

            // Criar associação na tabela intermediária
            await PetDoencaDeficiencia.create({
              pet_id: novoPet.id,
              doencaDeficiencia_id: doenca.id,
              possui: true,
            });
          })
        );
      }

      // Retornar pet criado com status HTTP 201
      res.status(201).json(novoPet);
    } catch (error) {
      next(error); // Delegação para middleware de tratamento de erros
      return;
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

      // Sanitizar rg_Pet se necessário
      if ('rg_Pet' in dadosAtualizados) {
        dadosAtualizados.rg_Pet = PetController.sanitizeRgPet(dadosAtualizados.rg_Pet);
      }

      // ✅ PROCESSAMENTO APRIMORADO DA FOTO
      let fotoUrl = pet.foto; // Manter a foto atual por padrão

      // ✅ CASO 1: Nova imagem enviada como arquivo (FormData)
      if (req.file) {
        try {
          // Deletar foto anterior se existir
          if (pet.foto && pet.foto.includes('supabase')) {
            const urlParts = pet.foto.split('pet-images/');
            if (urlParts.length > 1) {
              const filePath = urlParts[1].split('?')[0];
              const { error: deleteError } = await supabase.storage.from('pet-images').remove([filePath]);
              if (!deleteError) {
              }
            }
          }

          // Upload da nova foto
          const nomePet = dadosAtualizados.nome || pet.nome;
          const fileBuffer = req.file.buffer;
          const filePath = `pets/${nomePet.replace(/\s+/g, '_')}_${Date.now()}.jpg`;

          const { data, error } = await supabase.storage.from('pet-images').upload(filePath, fileBuffer, {
            contentType: req.file.mimetype,
          });

          if (error) {
            fotoUrl = pet.foto; // Manter foto anterior
          } else if (data?.path) {
            const { data: publicData } = supabase.storage.from('pet-images').getPublicUrl(data.path);
            fotoUrl = publicData?.publicUrl ?? pet.foto;
          }
        } catch (fileError) {
          fotoUrl = pet.foto; // Manter foto anterior
        }
      }
      // ✅ CASO 2: Foto enviada via JSON (URL existente ou remoção)
      else if ('foto' in dadosAtualizados) {
        if (dadosAtualizados.foto === '' || dadosAtualizados.foto === null) {
          // Remover foto

          // Deletar do Supabase se for uma URL válida
          if (pet.foto && pet.foto.includes('supabase')) {
            try {
              const urlParts = pet.foto.split('pet-images/');
              if (urlParts.length > 1) {
                const filePath = urlParts[1].split('?')[0];
                const { error: deleteError } = await supabase.storage.from('pet-images').remove([filePath]);
                if (!deleteError) {
                }
              }
            } catch (deleteError) {}
          }

          fotoUrl = ''; // String vazia para remoção
        } else if (typeof dadosAtualizados.foto === 'string' && dadosAtualizados.foto.startsWith('http')) {
          // Foto existente (URL válida) - manter

          fotoUrl = dadosAtualizados.foto;
        } else {
          fotoUrl = pet.foto;
        }
      }
      // ✅ CASO 3: Nenhuma informação sobre foto - manter atual
      else {
        fotoUrl = pet.foto;
      }

      // Atualizar dados do pet
      dadosAtualizados.foto = fotoUrl;

      // ✅ ATUALIZAR PET NO BANCO
      await pet.update(dadosAtualizados);

      // ✅ PROCESSAR DOENÇAS/DEFICIÊNCIAS
      if (doencas && Array.isArray(doencas)) {
        // Remover associações existentes
        await PetDoencaDeficiencia.destroy({
          where: { pet_id: id },
        });

        // Criar novas associações
        await Promise.all(
          doencas.map(async (nome: string) => {
            const [doenca] = await DoencasDeficiencias.findOrCreate({
              where: { nome },
            });

            await PetDoencaDeficiencia.create({
              pet_id: parseInt(id),
              doencaDeficiencia_id: doenca.id,
              possui: true,
            });
          })
        );
      }

      // ✅ BUSCAR PET ATUALIZADO PARA RESPOSTA
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
      // ✅ TRATAMENTO DE ERRO APRIMORADO
      if (error instanceof Error) {
        res.status(500).json({
          error: 'Erro ao atualizar o pet.',
          message: error.message,
          details: process.env.NODE_ENV !== 'production' ? error.stack : undefined,
        });
      } else {
        res.status(500).json({
          error: 'Erro desconhecido ao atualizar o pet.',
          details: process.env.NODE_ENV !== 'production' ? String(error) : undefined,
        });
      }
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

      // Primeiro remover as associações com doenças/deficiências
      await PetDoencaDeficiencia.destroy({
        where: { pet_id: id },
      });

      // Agora deletar o pet do banco de dados
      await pet.destroy();

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

            const { error: deleteError } = await supabase.storage.from('pet-images').remove([filePath]);

            if (deleteError) {
              res.status(200).json({
                message: 'Pet deletado com sucesso, mas houve um erro ao deletar a imagem.',
                imageError: deleteError.message,
              });
              return;
            } else {
              imagemDeletada = true;
            }
          }
        } catch (deleteError) {}
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
      res.status(500).json({ error: 'Erro ao buscar pets por status.' });
    }
  };
}
