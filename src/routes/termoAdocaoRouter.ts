// routes/termosCompromissoRoutes.ts - Rotas Atualizadas com Verificação de Nome

import { Router } from 'express';
import { TermoAdocaoController } from '../controllers/termoAdocaoController';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();

// Rotas públicas (sem autenticação)
router.get('/stats', TermoAdocaoController.stats);
router.get('/:id/validate', TermoAdocaoController.validar);
router.get('/:id/pdf', TermoAdocaoController.gerarPDF);
router.post('/:id/enviar-email', TermoAdocaoController.enviarPorEmail);
router.post('/', authMiddleware, TermoAdocaoController.create);
router.get('/', authMiddleware, TermoAdocaoController.listar);
router.get('/meus-doacoes', authMiddleware, TermoAdocaoController.meusDoacoes);
router.get('/minhas-adocoes', authMiddleware, TermoAdocaoController.minhasAdocoes);
router.get('/pode-adotar/:petId', authMiddleware, TermoAdocaoController.podeAdotar);
router.get('/pet/:petId', authMiddleware, TermoAdocaoController.buscarPorPet);
router.get('/:id', authMiddleware, TermoAdocaoController.buscarPorId);

export default router;