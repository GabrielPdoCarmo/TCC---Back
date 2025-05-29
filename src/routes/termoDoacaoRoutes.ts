// routes/termoDoacaoRoutes.ts - Rotas para Termo de Doação

import { Router } from 'express';
import { TermoDoacaoController } from '../controllers/termoDoacaoController';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();
router.get('/stats', TermoDoacaoController.stats);
router.get('/:id/validate', TermoDoacaoController.validar);
router.post('/', authMiddleware, TermoDoacaoController.create);
router.get('/meu-termo', authMiddleware, TermoDoacaoController.meuTermo);
router.get('/meu-historico', authMiddleware, TermoDoacaoController.meuHistorico);
router.get('/pode-cadastrar-pets', authMiddleware, TermoDoacaoController.podeCadastrarPets);
router.get('/:id', authMiddleware, TermoDoacaoController.buscarPorId);
router.post('/:id/gerar-pdf', authMiddleware, TermoDoacaoController.gerarPDF);
router.post('/:id/enviar-pdf', authMiddleware, TermoDoacaoController.enviarPDF);

export default router;
