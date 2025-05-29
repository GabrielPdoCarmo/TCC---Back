// routes/termosCompromissoRoutes.ts - Rotas Atualizadas

import { Router } from 'express';
import { TermosCompromissoController } from '../controllers/termosCompromissoController';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();

router.get('/', TermosCompromissoController.listar);
router.get('/:id', TermosCompromissoController.buscarPorId);
router.get('/pet/:petId', TermosCompromissoController.buscarPorPet);
router.get('/stats', TermosCompromissoController.stats);
router.get('/:id/pdf', TermosCompromissoController.gerarPDF);
router.get('/:id/validate', TermosCompromissoController.validar);
router.post('/', authMiddleware, TermosCompromissoController.create);
router.get('/meus-doacoes', authMiddleware, TermosCompromissoController.meusDoacoes);
router.get('/minhas-adocoes', authMiddleware, TermosCompromissoController.minhasAdocoes);
router.post('/:id/enviar-email', TermosCompromissoController.enviarPorEmail);

export default router;
