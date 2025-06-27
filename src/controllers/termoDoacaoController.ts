// controllers/termoDoacaoController.ts - Controller atualizado com verificação completa de dados

import { Request, Response } from 'express';
import { TermoDoacao } from '../models/termoDoacaoModel';
import { Usuario } from '../models/usuarioModel';
import { Estado } from '../models/estadoModel';
import { Cidade } from '../models/cidadeModel';
import { emailTermoDoacaoService } from '../services/emailTermoDoacaoService';

// === INTERFACES ===
interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    nome: string;
    email: string;
  };
}

interface CreateTermoDoacaoBody {
  motivoDoacao: string;
  assinaturaDigital: string;
  condicoesAdocao?: string;
  observacoes?: string;
  confirmaResponsavelLegal: boolean;
  autorizaVisitas: boolean;
  aceitaAcompanhamento: boolean;
  confirmaSaude: boolean;
  autorizaVerificacao: boolean;
  compromesteContato: boolean;
  // Flag para indicar se é atualização de dados
  isDataUpdate?: boolean;
}

export class TermoDoacaoController {
  static async listar(req: Request, res: Response): Promise<void> {
    try {
      const { limit = 50, offset = 0, search } = req.query;

      const whereClause: any = {};

      // Filtro de busca
      if (search) {
        const { Op } = require('sequelize');
        whereClause[Op.or] = [
          { id: { [Op.like]: `%${search}%` } },
          { doador_nome: { [Op.like]: `%${search}%` } },
          { doador_email: { [Op.like]: `%${search}%` } },
          { motivo_doacao: { [Op.like]: `%${search}%` } },
        ];
      }

      const { count, rows: termos } = await TermoDoacao.findAndCountAll({
        where: whereClause,
        include: [
          { model: Usuario, as: 'doador' },
          { model: Estado, as: 'estado' },
          { model: Cidade, as: 'cidade' },
        ],
        order: [['data_assinatura', 'DESC']],
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      });

      res.json({
        message: 'Termos de doação listados com sucesso',
        data: termos,
        total: count,
        pagination: {
          limit: parseInt(limit as string),
          offset: parseInt(offset as string),
          totalPages: Math.ceil(count / parseInt(limit as string)),
        },
      });
    } catch (error: any) {
      res.status(500).json({
        error: 'Erro interno do servidor',
        message: error.message,
      });
    }
  }

  static async create(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const doadorId = req.user?.id;

      if (!doadorId) {
        res.status(401).json({
          error: 'Usuário não autenticado',
        });
        return;
      }

      const {
        motivoDoacao,
        assinaturaDigital,
        condicoesAdocao,
        observacoes,
        confirmaResponsavelLegal,
        autorizaVisitas,
        aceitaAcompanhamento,
        confirmaSaude,
        autorizaVerificacao,
        compromesteContato,
        isDataUpdate = false, // Flag para indicar atualização de dados
      }: CreateTermoDoacaoBody = req.body;

      // Validações básicas
      if (!motivoDoacao || !assinaturaDigital) {
        res.status(400).json({
          error: 'Dados obrigatórios não fornecidos',
          required: ['motivoDoacao', 'assinaturaDigital'],
        });
        return;
      }

      // Verificar se todos os compromissos foram aceitos
      if (
        !confirmaResponsavelLegal ||
        !autorizaVisitas ||
        !aceitaAcompanhamento ||
        !confirmaSaude ||
        !autorizaVerificacao ||
        !compromesteContato
      ) {
        res.status(400).json({
          error: 'Todos os compromissos devem ser aceitos para cadastrar o termo de doação',
          missing_commitments: {
            confirmaResponsavelLegal,
            autorizaVisitas,
            aceitaAcompanhamento,
            confirmaSaude,
            autorizaVerificacao,
            compromesteContato,
          },
        });
        return;
      }

      // BUSCAR DADOS COMPLETOS DO USUÁRIO
      let dadosUsuario;
      try {
        dadosUsuario = await Usuario.findByPk(doadorId);
        if (!dadosUsuario) {
          res.status(404).json({
            error: 'Usuário não encontrado',
          });
          return;
        }
      } catch (error) {
        res.status(500).json({
          error: 'Erro ao buscar dados do usuário',
        });
        return;
      }

      // VERIFICAR SE JÁ EXISTE TERMO PARA ATUALIZAÇÃO DE DADOS
      const termoExistente = await TermoDoacao.findByDoador(doadorId);

      if (termoExistente && isDataUpdate) {
        // Atualizar termo existente com novos dados
        const termoAtualizado = await TermoDoacao.atualizarComDadosAtualizados(termoExistente.id, {
          doador_id: doadorId,
          doador_nome: dadosUsuario.nome || assinaturaDigital,
          doador_email: dadosUsuario.email,
          doador_telefone: dadosUsuario.telefone,
          doador_cpf: dadosUsuario.cpf,
          doador_cidade_id: dadosUsuario.cidade_id,
          doador_estado_id: dadosUsuario.estado_id,
          motivo_doacao: motivoDoacao,
          assinatura_digital: assinaturaDigital,
          condicoes_adocao: condicoesAdocao,
          observacoes: observacoes,
          confirma_responsavel_legal: confirmaResponsavelLegal,
          autoriza_visitas: autorizaVisitas,
          aceita_acompanhamento: aceitaAcompanhamento,
          confirma_saude: confirmaSaude,
          autoriza_verificacao: autorizaVerificacao,
          compromete_contato: compromesteContato,
        });

        // Buscar termo completo para resposta
        const termoCompleto = await TermoDoacao.findByDoador(doadorId);

        // Enviar email com novo PDF (não bloqueia a resposta)
        emailTermoDoacaoService.enviarTermoDoacaoPDF(termoCompleto!).catch((error) => {});

        res.status(200).json({
          message: 'Termo de doação atualizado com sucesso (dados atualizados)',
          data: termoCompleto,
          updated: true,
        });
        return;
      }

      // 🔄 LÓGICA ORIGINAL - CRIAR NOVO TERMO
      if (termoExistente && !isDataUpdate) {
        res.status(409).json({
          error: 'Você já possui um termo de doação',
          data: termoExistente,
        });
        return;
      }

      // Criar termo usando o método do modelo com dados completos do usuário
      const novoTermo = await TermoDoacao.criarComDados({
        doador_id: doadorId,
        doador_nome: dadosUsuario.nome || assinaturaDigital,
        doador_email: dadosUsuario.email,
        doador_telefone: dadosUsuario.telefone,
        doador_cpf: dadosUsuario.cpf,
        doador_cidade_id: dadosUsuario.cidade_id,
        doador_estado_id: dadosUsuario.estado_id,
        motivo_doacao: motivoDoacao,
        assinatura_digital: assinaturaDigital,
        condicoes_adocao: condicoesAdocao,
        observacoes: observacoes,
        confirma_responsavel_legal: confirmaResponsavelLegal,
        autoriza_visitas: autorizaVisitas,
        aceita_acompanhamento: aceitaAcompanhamento,
        confirma_saude: confirmaSaude,
        autoriza_verificacao: autorizaVerificacao,
        compromete_contato: compromesteContato,
      });

      // Buscar termo completo para resposta
      const termoCompleto = await TermoDoacao.findByDoador(doadorId);

      // Enviar email de confirmação (não bloqueia a resposta)
      emailTermoDoacaoService.enviarConfirmacaoTermo(termoCompleto!).catch((error) => {});

      res.status(201).json({
        message: 'Termo de doação criado com sucesso',
        data: termoCompleto,
        updated: false,
      });
    } catch (error: any) {
      let statusCode = 500;
      let errorMessage = 'Erro interno do servidor';

      if (error.message.includes('já possui um termo de responsabilidade')) {
        statusCode = 409;
        errorMessage = 'Você já possui um termo de doação';
      } else if (error.message.includes('Usuário doador não encontrado')) {
        statusCode = 404;
        errorMessage = 'Usuário não encontrado';
      } else if (error.message.includes('Todos os compromissos devem ser aceitos')) {
        statusCode = 400;
        errorMessage = 'Todos os compromissos devem ser aceitos';
      }

      res.status(statusCode).json({
        error: errorMessage,
        message: error.message,
      });
    }
  }

  static async buscarPorId(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const termo = await TermoDoacao.findOne({
        where: { id: id },
        include: [
          { model: Usuario, as: 'doador' },
          { model: Estado, as: 'estado' },
          { model: Cidade, as: 'cidade' },
        ],
      });

      if (!termo) {
        res.status(404).json({
          error: 'Termo de doação não encontrado',
        });
        return;
      }

      res.json({
        message: 'Termo encontrado',
        data: termo,
      });
    } catch (error: any) {
      res.status(500).json({
        error: 'Erro interno do servidor',
        message: error.message,
      });
    }
  }

  static async meuTermo(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const usuarioId = req.user?.id;

      if (!usuarioId) {
        res.status(401).json({
          error: 'Usuário não autenticado',
        });
        return;
      }

      const termo = await TermoDoacao.findByDoador(usuarioId);

      if (!termo) {
        res.status(404).json({
          canCreatePets: false,
        });
        return;
      }

      res.json({
        message: 'Termo encontrado',
        data: termo,
        canCreatePets: true,
      });
    } catch (error: any) {
      res.status(500).json({
        error: 'Erro interno do servidor',
        message: error.message,
      });
    }
  }

  static async meuHistorico(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const usuarioId = req.user?.id;

      if (!usuarioId) {
        res.status(401).json({
          error: 'Usuário não autenticado',
        });
        return;
      }

      const termos = await TermoDoacao.findAllByDoador(usuarioId);

      res.json({
        message: 'Histórico de termos encontrado',
        data: termos,
        total: termos.length,
      });
    } catch (error: any) {
      res.status(500).json({
        error: 'Erro interno do servidor',
        message: error.message,
      });
    }
  }

  static async podeCadastrarPets(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const usuarioId = req.user?.id;

      if (!usuarioId) {
        res.status(401).json({
          error: 'Usuário não autenticado',
          message: 'Token de acesso inválido ou expirado',
        });
        return;
      }

      // BUSCAR DADOS ATUAIS DO USUÁRIO
      let dadosUsuarioAtual;
      try {
        dadosUsuarioAtual = await Usuario.findByPk(usuarioId);
        if (!dadosUsuarioAtual) {
          res.status(200).json({
            message: 'Usuário não encontrado',
            data: {
              podecastrar: false,
              temTermo: false,
              dadosDesatualizados: false,
            },
          });
          return;
        }
      } catch (error) {
        res.status(200).json({
          message: 'Erro ao buscar dados do usuário',
          data: {
            podecastrar: false,
            temTermo: false,
            dadosDesatualizados: false,
          },
        });
        return;
      }

      // Verificar se usuário pode cadastrar pets
      let podecastrar = false;
      let temTermo = false;
      let dadosDesatualizados = false; // Flag para indicar se dados principais mudaram

      try {
        const termo = await TermoDoacao.findByDoador(usuarioId);

        if (termo) {
          temTermo = true;

          // VERIFICAR SE DADOS PRINCIPAIS NO TERMO SÃO DIFERENTES DOS DADOS ATUAIS
          const dadosAtualUsuario = {
            nome: dadosUsuarioAtual.nome || '',
            email: dadosUsuarioAtual.email || '',
            telefone: dadosUsuarioAtual.telefone || '',
            cidade_id: dadosUsuarioAtual.cidade_id || null,
            estado_id: dadosUsuarioAtual.estado_id || null,
          };

          const dadosNoTermo = {
            nome: termo.doador_nome || '',
            email: termo.doador_email || '',
            telefone: termo.doador_telefone || '',
            cidade_id: termo.doador_cidade_id || null,
            estado_id: termo.doador_estado_id || null,
          };

          // Verificar se algum dos dados principais mudou (incluindo localização)
          const nomeIgual = dadosAtualUsuario.nome === dadosNoTermo.nome;
          const emailIgual = dadosAtualUsuario.email === dadosNoTermo.email;
          const telefoneIgual = dadosAtualUsuario.telefone === dadosNoTermo.telefone;
          const cidadeIgual = dadosAtualUsuario.cidade_id === dadosNoTermo.cidade_id;
          const estadoIgual = dadosAtualUsuario.estado_id === dadosNoTermo.estado_id;

          if (!nomeIgual || !emailIgual || !telefoneIgual || !cidadeIgual || !estadoIgual) {
            // Dados foram alterados - precisa reAssinar termo
            dadosDesatualizados = true;
            podecastrar = false;
          } else {
            // Dados estão iguais - pode cadastrar normalmente
            podecastrar = await TermoDoacao.usuarioPodeCadastrarPets(usuarioId);
          }
        } else {
          // Não tem termo

          podecastrar = false;
          temTermo = false;
        }
      } catch (modelError: any) {
        // Em caso de erro, assumir que não pode cadastrar por segurança
        podecastrar = false;
        temTermo = false;
        dadosDesatualizados = false;
      }

      // SEMPRE retornar status 200 para não quebrar o frontend
      res.status(200).json({
        message: 'Verificação concluída',
        data: {
          podecastrar,
          temTermo,
          dadosDesatualizados, // Indica se precisa reAssinar por dados diferentes
        },
      });
    } catch (error: any) {
      // IMPORTANTE: SEMPRE retornar 200 com podecastrar: false em caso de erro
      res.status(200).json({
        message: 'Erro na verificação',
        data: {
          podecastrar: false,
          temTermo: false,
          dadosDesatualizados: false,
        },
      });
    }
  }

  static async stats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await TermoDoacao.contarTermos();

      res.json({
        message: 'Estatísticas obtidas',
        data: stats,
      });
    } catch (error: any) {
      res.status(500).json({
        error: 'Erro interno do servidor',
        message: error.message,
      });
    }
  }

  static async validar(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const termo = await TermoDoacao.findOne({
        where: { id: id },
      });

      if (!termo) {
        res.status(404).json({
          error: 'Termo não encontrado',
        });
        return;
      }

      const integridadeOk = termo.verificarIntegridade();
      const compromissosOk = termo.validarCompromissos();

      res.json({
        message: 'Validação concluída',
        data: {
          integridadeOk,
          compromissosOk,
          dataAssinatura: termo.data_assinatura,
          hashDocumento: termo.hash_documento,
        },
      });
    } catch (error: any) {
      res.status(500).json({
        error: 'Erro interno do servidor',
        message: error.message,
      });
    }
  }

  static async gerarPDF(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const usuarioId = req.user?.id;

      if (!usuarioId) {
        res.status(401).json({
          error: 'Usuário não autenticado',
        });
        return;
      }

      const termo = await TermoDoacao.findOne({
        where: {
          id: id,
          doador_id: usuarioId,
        },
        include: [
          { model: Usuario, as: 'doador' },
          { model: Estado, as: 'estado' },
          { model: Cidade, as: 'cidade' },
        ],
      });

      if (!termo) {
        res.status(404).json({
          error: 'Termo não encontrado ou não pertence a você',
        });
        return;
      }

      // Gerar e enviar PDF por email usando o serviço
      await emailTermoDoacaoService.enviarTermoDoacaoPDF(termo);

      res.json({
        message: 'PDF gerado e enviado por email com sucesso',
        data: {
          termoId: termo.id,
          emailEnviado: termo.doador_email,
          dataEnvio: new Date(),
        },
      });
    } catch (error: any) {
      res.status(500).json({
        error: 'Erro interno do servidor',
        message: error.message,
      });
    }
  }

  static async enviarPDF(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const usuarioId = req.user?.id;

      if (!usuarioId) {
        res.status(401).json({
          error: 'Usuário não autenticado',
        });
        return;
      }

      const termo = await TermoDoacao.findOne({
        where: {
          id: id,
          doador_id: usuarioId,
        },
        include: [
          { model: Usuario, as: 'doador' },
          { model: Estado, as: 'estado' },
          { model: Cidade, as: 'cidade' },
        ],
      });

      if (!termo) {
        res.status(404).json({
          error: 'Termo não encontrado ou não pertence a você',
        });
        return;
      }

      // Enviar PDF por email usando o serviço
      await emailTermoDoacaoService.enviarTermoDoacaoPDF(termo);

      res.json({
        message: 'PDF enviado por email com sucesso',
        data: {
          termoId: termo.id,
          emailEnviado: termo.doador_email,
          dataEnvio: termo.data_envio_pdf,
        },
      });
    } catch (error: any) {
      res.status(500).json({
        error: 'Erro interno do servidor',
        message: error.message,
      });
    }
  }

  static async delete(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const usuarioId = req.user?.id;

      if (!usuarioId) {
        res.status(401).json({
          error: 'Usuário não autenticado',
        });
        return;
      }

      // Buscar o termo para verificar se existe e pertence ao usuário
      const termo = await TermoDoacao.findOne({
        where: {
          id: id,
          doador_id: usuarioId,
        },
        include: [
          { model: Usuario, as: 'doador' },
          { model: Estado, as: 'estado' },
          { model: Cidade, as: 'cidade' },
        ],
      });

      if (!termo) {
        res.status(404).json({
          error: 'Termo não encontrado ou não pertence a você',
        });
        return;
      }

      // Realizar soft delete (recomendado para manter histórico)
      await termo.update({
        ativo: false,
        data_inativacao: new Date(),
        motivo_inativacao: 'Deletado pelo usuário',
      });

      res.json({
        message: 'Termo de doação deletado com sucesso',
        data: {
          termoId: termo.id,
          dataDelecao: new Date(),
          doadorNome: termo.doador_nome,
        },
      });
    } catch (error: any) {
      let statusCode = 500;
      let errorMessage = 'Erro interno do servidor';

      if (error.message.includes('foreign key constraint')) {
        statusCode = 400;
        errorMessage = 'Não é possível deletar termo com dependências ativas';
      }

      res.status(statusCode).json({
        error: errorMessage,
        message: error.message,
      });
    }
  }
}
