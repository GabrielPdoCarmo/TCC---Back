// controllers/termoDoacaoController.ts - Controller para Termo de Doação

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
}

export class TermoDoacaoController {
  /**
   * 📋 Listar todos os termos de doação (Admin)
   * GET /api/termos-doacao
   */
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
      console.error('Erro ao listar termos de doação:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        message: error.message,
      });
    }
  }

  /**
   * 📝 Criar novo termo de doação
   * POST /api/termos-doacao
   */
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

      // 🆕 BUSCAR DADOS COMPLETOS DO USUÁRIO
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
        console.error('❌ Erro ao buscar dados do usuário:', error);
        res.status(500).json({
          error: 'Erro ao buscar dados do usuário',
        });
        return;
      }

      // Criar termo usando o método do modelo com dados completos do usuário
      const novoTermo = await TermoDoacao.criarComDados({
        doador_id: doadorId,
        doador_nome: dadosUsuario.nome || assinaturaDigital,
        doador_email: dadosUsuario.email,
        doador_telefone: dadosUsuario.telefone, // ✅ TELEFONE DO USUÁRIO
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
      emailTermoDoacaoService
        .enviarConfirmacaoTermo(termoCompleto!)
        .catch((error) => console.error('Erro ao enviar email de confirmação:', error));

      res.status(201).json({
        message: 'Termo de doação criado com sucesso',
        data: termoCompleto,
      });
    } catch (error: any) {
      console.error('Erro ao criar termo de doação:', error);

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

  /**
   * 📄 Buscar termo por ID
   * GET /api/termos-doacao/:id
   */
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
      console.error('Erro ao buscar termo:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        message: error.message,
      });
    }
  }

  /**
   * 👤 Buscar termo ativo do usuário logado
   * GET /api/termos-doacao/meu-termo
   */
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
      console.error('Erro ao buscar termo:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        message: error.message,
      });
    }
  }

  /**
   * 📚 Histórico de termos do usuário
   * GET /api/termos-doacao/meu-historico
   */
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
      console.error('Erro ao buscar histórico:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        message: error.message,
      });
    }
  }

  /**
   * ✅ Verificar se usuário pode cadastrar pets
   * GET /api/termos-doacao/pode-cadastrar-pets
   */
  /**
   * ✅ Verificar se usuário pode cadastrar pets
   * GET /api/termos-doacao/pode-cadastrar-pets
   */
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

      console.log(`🔍 Verificando se usuário ${usuarioId} pode cadastrar pets...`);

      // Verificar se usuário pode cadastrar pets
      let podecastrar = false;
      let temTermo = false;

      try {
        podecastrar = await TermoDoacao.usuarioPodeCadastrarPets(usuarioId);

        // Se pode cadastrar, é porque tem termo
        if (podecastrar) {
          temTermo = true;
          console.log(`✅ Usuário ${usuarioId} pode cadastrar pets`);
        } else {
          // Verificar se tem termo mas não pode cadastrar
          const termo = await TermoDoacao.findByDoador(usuarioId);
          temTermo = !!termo;
          console.log(`ℹ️ Usuário ${usuarioId} - temTermo: ${temTermo}, podecastrar: ${podecastrar}`);
        }
      } catch (modelError: any) {
        console.error(`❌ Erro ao verificar termo do usuário ${usuarioId}:`, modelError);
        // Em caso de erro, assumir que não pode cadastrar por segurança
        podecastrar = false;
        temTermo = false;
      }

      // SEMPRE retornar status 200 para não quebrar o frontend
      res.status(200).json({
        message: 'Verificação concluída',
        data: {
          podecastrar,
          temTermo,
        },
      });
    } catch (error: any) {
      console.error('❌ Erro ao verificar se usuário pode cadastrar pets:', error);

      // IMPORTANTE: SEMPRE retornar 200 com podecastrar: false em caso de erro
      res.status(200).json({
        message: 'Erro na verificação',
        data: {
          podecastrar: false,
          temTermo: false,
        },
      });
    }
  }

  /**
   * 📊 Estatísticas gerais (Admin)
   * GET /api/termos-doacao/stats
   */
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

  /**
   * ✅ Validar integridade do termo
   * GET /api/termos-doacao/:id/validate
   */
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
      console.error('Erro ao validar termo:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        message: error.message,
      });
    }
  }

  /**
   * 📄 Gerar PDF do termo
   * POST /api/termos-doacao/:id/gerar-pdf
   */
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
      console.error('Erro ao gerar e enviar PDF:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        message: error.message,
      });
    }
  }

  /**
   * 📧 Enviar PDF por email
   * POST /api/termos-doacao/:id/enviar-pdf
   */
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
      console.error('Erro ao enviar PDF:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        message: error.message,
      });
    }
  }
}
