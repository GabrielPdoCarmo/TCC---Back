import { Request, Response, NextFunction, RequestHandler } from 'express';
import { Pet } from '../models/petModel';
import { DoencasDeficiencias } from '../models/doencasDeficienciasModel';
import { PetDoencaDeficiencia } from '../models/petDoencaDeficienciaModel';
import { Usuario } from '../models/usuarioModel';
import { Cidade } from '../models/cidadeModel';
import { supabase } from '../api/supabaseClient';
import { Op } from 'sequelize';
import { MyPets } from '../models/mypetsModel';
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

  // 🔧 CONTROLLER SIMPLIFICADO: Apenas pets que EU QUERO ADOTAR (MyPets)
  static getMyPetsByName: RequestHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { nome } = req.params;
      const { usuario_id } = req.query;

      // Validações básicas
      if (!nome || nome.trim() === '') {
        res.status(400).json({
          error: 'Nome do pet não fornecido.',
          data: [],
        });
        return;
      }

      if (!usuario_id) {
        res.status(400).json({
          error: 'ID do usuário não fornecido.',
          data: [],
        });
        return;
      }

      // Validação: Converter e validar usuario_id
      const usuarioIdNumber = parseInt(usuario_id as string, 10);
      if (isNaN(usuarioIdNumber)) {
        res.status(400).json({
          error: 'ID do usuário inválido.',
          data: [],
        });
        return;
      }

      // 🎯 BUSCAR APENAS PETS DE INTERESSE (não pets próprios)
      // Passo 1: Buscar IDs dos pets pelos quais me interessei
      const meusPetsInteresse = await MyPets.findAll({
        where: {
          usuario_id: usuarioIdNumber,
        },
        attributes: ['pet_id'],
      });

      // Se não tenho interesse em nenhum pet, retornar array vazio
      if (meusPetsInteresse.length === 0) {
        res.status(200).json([]);
        return;
      }

      // Extrair apenas os pet_ids em um array
      const petIdsInteresse = meusPetsInteresse.map((mp) => mp.pet_id);

      // Passo 2: Buscar os pets pelos quais me interessei que atendem ao filtro
      const pets = await Pet.findAll({
        where: {
          // Filtro por nome
          nome: {
            [Op.like]: `%${nome}%`,
          },
          // Apenas pets pelos quais me interessei
          id: {
            [Op.in]: petIdsInteresse,
          },
          // Status de pets disponíveis para adoção
          status_id: [3, 4], // "Para Adoção" ou "Adotado"
        },
        order: [['nome', 'ASC']],
      });

      // Sempre retornar array (mesmo que vazio)
      res.status(200).json(pets);
    } catch (error: any) {
      // Erro consistente: Sempre retornar array vazio em caso de erro
      res.status(500).json({
        error: 'Erro ao buscar pets de interesse.',
        data: [],
        details: process.env.NODE_ENV !== 'production' ? error.message : undefined,
      });
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
        descricaoGeral,
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
      if (!descricaoGeral || descricaoGeral.trim() === '' || descricaoGeral === 'undefined') {
        res.status(400).json({ error: 'Descrição geral do pet é obrigatória e não pode ser vazia ou undefined.' });
        return;
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
        doador_id: usuario_id, // Doador é o mesmo usuário que está criando o pet
        adotante_id: null, // Inicialmente não tem adotante
        sexo_id,
        rg_Pet: rgSanitizado,
        motivoDoacao,
        descricaoGeral,
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
  /**
   * Método responsável por transferir um pet para um novo usuário
   * Atualiza automaticamente a localização (cidade_id e estado_id) baseada no novo usuário
   */
  /**
   * Método responsável por transferir um pet para um novo usuário
   * CORRIGIDO: Associações Sequelize com 'as' corretos
   */
  static transferPet: RequestHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { usuario_id, adotante_id } = req.body;

      // ========== VALIDAÇÕES ==========

      if (!id) {
        res.status(400).json({ error: 'ID do pet não fornecido.' });
        return;
      }

      if (!usuario_id) {
        res.status(400).json({ error: 'ID do usuário atual (usuario_id) não fornecido.' });
        return;
      }

      if (!adotante_id) {
        res.status(400).json({ error: 'ID do adotante não fornecido.' });
        return;
      }

      const pet = await Pet.findByPk(id);
      if (!pet) {
        res.status(404).json({ error: 'Pet não encontrado.' });
        return;
      }

      // ✅ VALIDAÇÃO: Confirmar se o usuario_id corresponde ao responsável atual
      if (pet.usuario_id !== parseInt(usuario_id)) {
        res.status(400).json({
          error: 'Usuário não é o responsável atual deste pet.',
          responsavel_atual: pet.usuario_id,
          usuario_informado: usuario_id,
        });
        return;
      }

      // Verificar se o adotante existe
      const adotante = await Usuario.findByPk(adotante_id);
      if (!adotante) {
        res.status(404).json({ error: 'Adotante não encontrado.' });
        return;
      }

      // Verificar se o usuário atual existe
      const usuarioAtual = await Usuario.findByPk(usuario_id);
      if (!usuarioAtual) {
        res.status(404).json({ error: 'Usuário atual não encontrado.' });
        return;
      }

      // Verificar localização do adotante
      if (!adotante.cidade_id || !adotante.estado_id) {
        res.status(400).json({
          error: 'Adotante não possui localização válida (cidade/estado).',
          adotante_id: adotante_id,
          cidade_id: adotante.cidade_id,
          estado_id: adotante.estado_id,
        });
        return;
      }

      // ========== VERIFICAÇÕES DE NEGÓCIO ==========

      // ✅ Aceitar pets com status 3 (Disponível para adoção) OU status 2 (Ativo/Publicado)
      if (pet.status_id !== 3 && pet.status_id !== 2) {
        res.status(400).json({
          error: 'Pet não está disponível para adoção.',
          status_atual: pet.status_id,
          status_esperado: '3 (Disponível para adoção) ou 2 (Ativo)',
        });
        return;
      }

      // ✅ VALIDAÇÃO: Verificar se usuário atual e adotante são diferentes
      if (parseInt(usuario_id) === parseInt(adotante_id)) {
        res.status(400).json({
          error: 'O responsável atual não pode adotar o próprio pet.',
          usuario_id: usuario_id,
          adotante_id: adotante_id,
        });
        return;
      }

      // Verificar se o pet já foi adotado por este usuário
      if (pet.adotante_id === parseInt(adotante_id)) {
        res.status(400).json({
          error: 'Este pet já foi adotado por este usuário.',
          adotante_atual: pet.adotante_id,
        });
        return;
      }

      // ========== ATUALIZAÇÃO DO PET (ADOÇÃO) COM TRANSAÇÃO ==========

      // Usar transação para garantir consistência
      const transaction = await Pet.sequelize!.transaction();

      try {
        // Salvar dados anteriores para log
        const dadosAnteriores = {
          usuario_anterior: pet.usuario_id,
          adotante_anterior: pet.adotante_id,
          cidade_anterior: pet.cidade_id,
          estado_anterior: pet.estado_id,
          status_anterior: pet.status_id,
        };

        // ✅ ATUALIZAÇÃO COMPLETA EM UMA ÚNICA OPERAÇÃO
        await pet.update(
          {
            usuario_id: adotante_id, // ✅ NOVO responsável é o adotante
            // doador_id permanece inalterado (doador original)
            adotante_id: adotante_id, // ✅ Define quem adotou
            cidade_id: adotante.cidade_id, // Localização do adotante
            estado_id: adotante.estado_id, // Estado do adotante
            status_id: 4, // ✅ AUTOMATICAMENTE muda para "Adotado"
          },
          { transaction }
        );

        // Confirmar transação
        await transaction.commit();

        // ✅ CORRIGIDO: Buscar pet atualizado com associações corretas usando os 'as' do modelo
        const petAtualizado = await Pet.findByPk(id, {
          include: [
            {
              model: Usuario,
              as: 'doador', // ✅ Corresponde a @BelongsTo(() => Usuario, 'doador_id') doador!: Usuario;
              attributes: ['id', 'nome', 'email', 'telefone'],
            },
            {
              model: Usuario,
              as: 'responsavel', // ✅ CORRIGIDO: era 'usuario', mas o modelo define como 'responsavel'
              attributes: ['id', 'nome', 'email', 'telefone'],
            },
            {
              model: Usuario,
              as: 'adotante', // ✅ Corresponde a @BelongsTo(() => Usuario, 'adotante_id') adotante!: Usuario;
              attributes: ['id', 'nome', 'email', 'telefone'],
            },
            {
              model: Cidade,
              as: 'cidade', // ✅ Corresponde a @BelongsTo(() => Cidade) cidade!: Cidade;
              attributes: ['id', 'nome'],
            },
          ],
        });

        // ✅ RESPOSTA COM LOG DETALHADO
        res.status(200).json({
          message: 'Pet adotado com sucesso!',
          pet: petAtualizado,
          adocao: {
            data_adocao: new Date(),
            doador_original: {
              id: pet.doador_id,
              nome: petAtualizado?.doador?.nome,
              permanece_como_doador: true,
            },
            responsavel_anterior: {
              id: dadosAnteriores.usuario_anterior,
              nome: usuarioAtual.nome,
            },
            novo_responsavel: {
              id: adotante.id,
              nome: adotante.nome,
              eh_tambem_adotante: true,
            },
            transferencia: {
              de_usuario: usuario_id,
              para_usuario: adotante_id,
              cidade_anterior: dadosAnteriores.cidade_anterior,
              nova_cidade: adotante.cidade_id,
              estado_anterior: dadosAnteriores.estado_anterior,
              novo_estado: adotante.estado_id,
              status_anterior: dadosAnteriores.status_anterior,
              novo_status: 4, // Adotado
            },
          },
        });
      } catch (transactionError) {
        // Reverter transação em caso de erro
        await transaction.rollback();
        throw transactionError;
      }
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).json({
          error: 'Erro ao processar adoção do pet.',
          message: error.message,
          details: process.env.NODE_ENV !== 'production' ? error.stack : undefined,
        });
      } else {
        res.status(500).json({
          error: 'Erro desconhecido ao processar adoção.',
          details: process.env.NODE_ENV !== 'production' ? String(error) : undefined,
        });
      }
    }
  };
  /**
   * Versão ULTRA-SEGURA: removePet sem dependência de includes problemáticos
   * CORRIGIDO: Remove erro de associações múltiplas do Sequelize
   */
  static removePet: RequestHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { usuario_id, motivo } = req.body;

      // ========== VALIDAÇÕES BÁSICAS ==========

      if (!id) {
        res.status(400).json({ error: 'ID do pet não fornecido.' });
        return;
      }

      if (!usuario_id) {
        res.status(400).json({ error: 'ID do usuário atual não fornecido.' });
        return;
      }

      // ========== BUSCAR DADOS NECESSÁRIOS (sem includes problemáticos) ==========

      const pet = await Pet.findByPk(id);
      if (!pet) {
        res.status(404).json({ error: 'Pet não encontrado.' });
        return;
      }

      // Buscar usuários separadamente (evita problemas de associação)
      const usuarioAtual = await Usuario.findByPk(usuario_id);
      if (!usuarioAtual) {
        res.status(404).json({ error: 'Usuário atual não encontrado.' });
        return;
      }

      const doadorOriginal = await Usuario.findByPk(pet.doador_id);
      if (!doadorOriginal) {
        res.status(404).json({ error: 'Doador original não encontrado.' });
        return;
      }

      // ========== VALIDAÇÕES DE NEGÓCIO ==========

      // Confirmar se o usuario_id é o responsável atual
      if (pet.usuario_id !== parseInt(usuario_id)) {
        res.status(400).json({
          error: 'Usuário não é o responsável atual deste pet.',
          responsavel_atual: pet.usuario_id,
          usuario_informado: usuario_id,
        });
        return;
      }

      // Pet deve estar adotado (status 4)
      if (pet.status_id !== 4) {
        res.status(400).json({
          error: 'Pet não está em status de adotado.',
          status_atual: pet.status_id,
          status_esperado: 4,
        });
        return;
      }

      // Não pode ser o próprio doador devolvendo
      if (pet.doador_id === parseInt(usuario_id)) {
        res.status(400).json({
          error: 'O doador original não pode "devolver" o próprio pet.',
          doador_id: pet.doador_id,
          usuario_id: usuario_id,
        });
        return;
      }

      // Verificar localização do doador original
      if (!doadorOriginal.cidade_id || !doadorOriginal.estado_id) {
        res.status(400).json({
          error: 'Doador original não possui localização válida.',
          doador_id: pet.doador_id,
          cidade_doador: doadorOriginal.cidade_id,
          estado_doador: doadorOriginal.estado_id,
        });
        return;
      }

      // ========== DEVOLUÇÃO SEGURA ==========

      const transaction = await Pet.sequelize!.transaction();

      try {
        // Salvar dados anteriores para log
        const dadosAnteriores = {
          usuario_anterior: pet.usuario_id,
          adotante_anterior: pet.adotante_id,
          cidade_anterior: pet.cidade_id,
          estado_anterior: pet.estado_id,
          status_anterior: pet.status_id,
        };

        // ✅ REVERTER ADOÇÃO (sem problemas de associação)
        await pet.update(
          {
            usuario_id: pet.doador_id, // Volta para o doador original
            adotante_id: null, // Remove adotante
            cidade_id: doadorOriginal.cidade_id, // Localização do doador
            estado_id: doadorOriginal.estado_id, // Estado do doador
            status_id: 2, // Disponível para adoção
          },
          { transaction }
        );

        await transaction.commit();

        // ✅ BUSCAR PET ATUALIZADO DE FORMA SEGURA (sem includes)
        const petAtualizado = await Pet.findByPk(id);

        // ✅ RESPOSTA SIMPLES E SEGURA (sem associações problemáticas)
        res.status(200).json({
          message: 'Pet devolvido ao doador original com sucesso!',
          pet: {
            ...petAtualizado?.toJSON(),
            // Adicionar dados dos usuários manualmente
            doador_nome: doadorOriginal.nome,
            ex_adotante_nome: usuarioAtual.nome,
          },
          devolucao: {
            data_devolucao: new Date(),
            motivo: motivo || 'Não informado',
            doador_original: {
              id: pet.doador_id,
              nome: doadorOriginal.nome,
              email: doadorOriginal.email,
              telefone: doadorOriginal.telefone,
              recebeu_pet_de_volta: true,
            },
            ex_adotante: {
              id: dadosAnteriores.usuario_anterior,
              nome: usuarioAtual.nome,
              email: usuarioAtual.email,
            },
            mudancas: {
              responsavel_anterior: dadosAnteriores.usuario_anterior,
              novo_responsavel: pet.doador_id,
              adotante_removido: dadosAnteriores.adotante_anterior,
              cidade_anterior: dadosAnteriores.cidade_anterior,
              nova_cidade: doadorOriginal.cidade_id,
              estado_anterior: dadosAnteriores.estado_anterior,
              novo_estado: doadorOriginal.estado_id,
              status_anterior: dadosAnteriores.status_anterior,
              novo_status: 3, // Disponível para adoção
            },
          },
        });
      } catch (transactionError) {
        await transaction.rollback();
        throw transactionError;
      }
    } catch (error) {
      console.error('❌ Erro no removePet:', error);

      if (error instanceof Error) {
        res.status(500).json({
          error: 'Erro ao processar devolução do pet.',
          message: error.message,
          details: process.env.NODE_ENV !== 'production' ? error.stack : undefined,
        });
      } else {
        res.status(500).json({
          error: 'Erro desconhecido ao processar devolução.',
          details: process.env.NODE_ENV !== 'production' ? String(error) : undefined,
        });
      }
    }
  };
}
