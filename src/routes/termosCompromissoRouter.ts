// routes/termosCompromissoRoutes.ts - Rotas Atualizadas com Verificação de Nome

import { Router } from 'express';
import { TermosCompromissoController } from '../controllers/termosCompromissoController';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();

// Rotas públicas (sem autenticação)
router.get('/stats', TermosCompromissoController.stats);
router.get('/:id/validate', TermosCompromissoController.validar);
router.get('/:id/pdf', TermosCompromissoController.gerarPDF);
router.post('/:id/enviar-email', TermosCompromissoController.enviarPorEmail);
router.post('/', authMiddleware, TermosCompromissoController.create);
router.get('/', authMiddleware, TermosCompromissoController.listar);
router.get('/meus-doacoes', authMiddleware, TermosCompromissoController.meusDoacoes);
router.get('/minhas-adocoes', authMiddleware, TermosCompromissoController.minhasAdocoes);
router.get('/pode-adotar/:petId', authMiddleware, TermosCompromissoController.podeAdotar);
router.get('/pet/:petId', authMiddleware, TermosCompromissoController.buscarPorPet);
router.get('/:id', authMiddleware, TermosCompromissoController.buscarPorId);

export default router;