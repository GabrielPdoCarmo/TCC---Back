// routes/termosCompromissoRoutes.ts - Rotas Atualizadas com DELETE

import { Router } from 'express';
import { TermoAdocaoController } from '../controllers/termoAdocaoController';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();

// Rotas públicas (sem autenticação)
router.get('/stats', TermoAdocaoController.stats);
router.get('/:id/validate', TermoAdocaoController.validar);
router.get('/:id/pdf', TermoAdocaoController.gerarPDF);
router.post('/:id/enviar-email', TermoAdocaoController.enviarPorEmail);

// Rotas protegidas (com autenticação)
router.post('/', authMiddleware, TermoAdocaoController.create);
router.get('/', authMiddleware, TermoAdocaoController.listar);
router.get('/meus-doacoes', authMiddleware, TermoAdocaoController.meusDoacoes);
router.get('/minhas-adocoes', authMiddleware, TermoAdocaoController.minhasAdocoes);
router.get('/pode-adotar/:petId', authMiddleware, TermoAdocaoController.podeAdotar);
router.get('/pet/:petId', authMiddleware, TermoAdocaoController.buscarPorPet);

// 🆕 NOVAS ROTAS DE DELETE
router.delete('/pet/:petId', authMiddleware, TermoAdocaoController.deletarPorPet);
router.delete('/:id', authMiddleware, TermoAdocaoController.deletar);

// Rota específica por ID deve vir por último para não conflitar
router.get('/:id', authMiddleware, TermoAdocaoController.buscarPorId);

export default router;