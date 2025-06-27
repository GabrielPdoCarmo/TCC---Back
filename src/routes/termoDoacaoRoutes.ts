// routes/termoDoacaoRoutes.ts - Rotas atualizadas para Termo de Doação

import { Router } from 'express';
import { TermoDoacaoController } from '../controllers/termoDoacaoController';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();

// === ROTAS PÚBLICAS (ADMIN) ===
router.get('/stats', TermoDoacaoController.stats);
router.get('/:id/validate', TermoDoacaoController.validar);

// === ROTAS PROTEGIDAS (USUÁRIO LOGADO) ===
//  Rota principal para criar/atualizar termo (suporta isDataUpdate)
router.post('/', authMiddleware, TermoDoacaoController.create);

//  Rota ATUALIZADA para verificar permissões (inclui verificação de dados)
router.get('/pode-cadastrar-pets', authMiddleware, TermoDoacaoController.podeCadastrarPets);

// Buscar termo do usuário logado
router.get('/meu-termo', authMiddleware, TermoDoacaoController.meuTermo);

// Histórico de termos do usuário
router.get('/meu-historico', authMiddleware, TermoDoacaoController.meuHistorico);

// Buscar termo específico por ID
router.get('/:id', authMiddleware, TermoDoacaoController.buscarPorId);

// === ROTAS DE PDF ===
// Gerar e enviar PDF por email
router.post('/:id/gerar-pdf', authMiddleware, TermoDoacaoController.gerarPDF);

// Reenviar PDF por email
router.post('/:id/enviar-pdf', authMiddleware, TermoDoacaoController.enviarPDF);

// === ROTA DE EXCLUSÃO ===
// Deletar termo (soft delete)
router.delete('/:id', authMiddleware, TermoDoacaoController.delete);

export default router;