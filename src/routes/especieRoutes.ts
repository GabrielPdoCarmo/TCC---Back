import { Router } from 'express';
import { EspecieController } from '../controllers/especiesController';

const router = Router();

// Definindo as rotas com os controladores
router.get('/', EspecieController.getAll);
router.get('/:id', EspecieController.getById);
router.post('/', EspecieController.create);
router.put('/:id', EspecieController.update);
router.delete('/:id', EspecieController.delete);

export default router;
