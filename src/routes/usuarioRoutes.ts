import { Router } from 'express';
import { UsuarioController } from '../controllers/UsuarioController';

const router = Router();

// Definindo as rotas com os controladores
router.get('/', UsuarioController.getAll);
router.post('/', (req, res, next) => {
  UsuarioController.create(req, res, next);
});
router.put('/:id', UsuarioController.update);
router.delete('/:id', UsuarioController.delete);

export default router;
