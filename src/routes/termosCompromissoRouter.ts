// routes/termosCompromisso.ts - Rotas para Termos de Compromisso

import { Router } from 'express';
import { TermosCompromissoController } from '../controllers/termosCompromissoController';
import { authMiddleware } from '../middlewares/authMiddleware';
import {
  validateTermoCompromissoMiddleware,
  validateStatusUpdateMiddleware,
  sanitizeTermoData,
} from '../middlewares/validationMiddleware';

// Criar instância do router
const router = Router();

// ===================================
// MIDDLEWARES GLOBAIS
// ===================================

/**
 * 🔐 Aplicar autenticação em todas as rotas
 * Todas as operações requerem usuário autenticado
 */
router.use(authMiddleware);

// ===================================
// ROTAS DE TERMOS DE COMPROMISSO
// ===================================

/**
 * 📝 Criar novo termo de compromisso
 * POST /api/termos-compromisso
 *
 * Headers:
 *   Authorization: Bearer <token>
 *
 * Body: {
 *   petId: number,
 *   petNome: string,
 *   petRaca: string,
 *   petIdade: string,
 *   doadorNome: string,
 *   doadorTelefone?: string,
 *   doadorEmail?: string,
 *   adotanteNome: string,
 *   adotanteEmail: string,
 *   adotanteTelefone?: string,
 *   adotanteCpf?: string,
 *   adotanteEndereco?: string,
 *   assinaturaDigital: string,
 *   dataAssinatura: string,
 *   termoVersao?: string,
 *   observacoes?: string
 * }
 *
 * Response: {
 *   message: string,
 *   data: {
 *     termoId: number,
 *     status: string,
 *     dataAssinatura: Date,
 *     hashDocumento: string
 *   }
 * }
 */
router.post('/', sanitizeTermoData, validateTermoCompromissoMiddleware, TermosCompromissoController.create);

/**
 * 📋 Buscar todos os termos de um usuário
 * GET /api/termos-compromisso/usuario/:usuarioId
 *
 * Params:
 *   usuarioId: number
 *
 * Query params:
 *   status?: 'ATIVO' | 'CANCELADO' | 'CONCLUIDO' | 'SUSPENSO'
 *   limit?: number (default: 50, max: 100)
 *   offset?: number (default: 0)
 *
 * Response: {
 *   message: string,
 *   data: TermoCompromisso[],
 *   total: number,
 *   pagination: {
 *     limit: number,
 *     offset: number,
 *     totalPages: number
 *   }
 * }
 */
router.get('/usuario/:usuarioId', TermosCompromissoController.findByUsuario);

/**
 * 📊 Buscar estatísticas de termos do usuário
 * GET /api/termos-compromisso/usuario/:usuarioId/stats
 *
 * Params:
 *   usuarioId: number
 *
 * Response: {
 *   message: string,
 *   data: {
 *     total: number,
 *     ativos: number,
 *     cancelados: number,
 *     concluidos: number,
 *     suspensos: number
 *   }
 * }
 */
router.get('/usuario/:usuarioId/stats', TermosCompromissoController.getStats);

/**
 * 🔍 Buscar termo por Pet e Usuário
 * GET /api/termos-compromisso/pet/:petId/usuario/:usuarioId
 *
 * Params:
 *   petId: number
 *   usuarioId: number
 *
 * Response: {
 *   message: string,
 *   data: TermoCompromisso
 * }
 */
router.get('/pet/:petId/usuario/:usuarioId', TermosCompromissoController.findByPetAndUsuario);

/**
 * 📄 Buscar termo específico por ID
 * GET /api/termos-compromisso/:termoId
 *
 * Params:
 *   termoId: string
 *
 * Response: {
 *   message: string,
 *   data: TermoCompromisso & {
 *     pet: Pet,
 *     adotante: Usuario
 *   }
 * }
 */
router.get('/:termoId', TermosCompromissoController.findById);

/**
 * ✅ Validar se termo ainda é válido
 * GET /api/termos-compromisso/:termoId/validate
 *
 * Params:
 *   termoId: string
 *
 * Response: {
 *   message: string,
 *   data: {
 *     valid: boolean,
 *     reason?: string,
 *     termo: {
 *       id: string,
 *       status: string,
 *       dataAssinatura: Date,
 *       dataVencimento?: Date
 *     }
 *   }
 * }
 */
router.get('/:termoId/validate', TermosCompromissoController.validate);

/**
 * 📱 Gerar e baixar PDF do termo
 * GET /api/termos-compromisso/:termoId/pdf
 *
 * Params:
 *   termoId: string
 *
 * Response: application/pdf
 * Headers:
 *   Content-Type: application/pdf
 *   Content-Disposition: attachment; filename="termo_{termoId}.pdf"
 */
router.get('/:termoId/pdf', TermosCompromissoController.generatePDF);

/**
 * 🔄 Atualizar status do termo
 * PUT /api/termos-compromisso/:termoId/status
 *
 * Params:
 *   termoId: string
 *
 * Body: {
 *   status: 'ATIVO' | 'CANCELADO' | 'CONCLUIDO' | 'SUSPENSO',
 *   motivo?: string
 * }
 *
 * Response: {
 *   message: string,
 *   data: {
 *     termoId: string,
 *     status: string,
 *     dataAlteracao: Date,
 *     motivo?: string
 *   }
 * }
 */
router.put('/:termoId/status', validateStatusUpdateMiddleware, TermosCompromissoController.updateStatus);

/**
 * 📧 Marcar email como enviado
 * POST /api/termos-compromisso/:termoId/email-sent
 *
 * Params:
 *   termoId: string
 *
 * Response: {
 *   message: string,
 *   data: {
 *     termoId: string,
 *     emailEnviado: boolean,
 *     dataEnvioEmail: Date
 *   }
 * }
 */
router.post('/:termoId/email-sent', TermosCompromissoController.markEmailSent);

// ===================================
// ROTAS DE AUDITORIA E RELATÓRIOS
// ===================================

/**
 * 📈 Relatório detalhado de termos
 * GET /api/termos-compromisso/relatorio/detalhado
 *
 * Query params:
 *   dataInicio?: string (ISO date)
 *   dataFim?: string (ISO date)
 *   status?: string
 *   usuarioId?: number
 *
 * Response: {
 *   message: string,
 *   data: {
 *     termos: TermoCompromisso[],
 *     estatisticas: {
 *       total: number,
 *       porStatus: Record<string, number>,
 *       porMes: Record<string, number>
 *     }
 *   }
 * }
 */
router.use((error: any, req: any, res: any, next: any) => {
  console.error('❌ Erro nas rotas de termos de compromisso:', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    body: req.body,
    user: req.user?.id,
  });

  // Erros específicos de validação já foram tratados pelos middlewares

  // Erro de constraint de banco de dados
  if (error.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({
      error: 'Conflito de dados',
      message: 'Já existe um registro com esses dados',
      details: error.errors?.map((e: any) => e.message),
    });
  }

  // Erro de foreign key
  if (error.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(400).json({
      error: 'Referência inválida',
      message: 'Um dos IDs fornecidos não existe',
    });
  }

  // Erro genérico
  return res.status(error.status || 500).json({
    error: error.message || 'Erro interno do servidor',
    message: 'Tente novamente mais tarde',
    timestamp: new Date().toISOString(),
  });
});

export default router;
