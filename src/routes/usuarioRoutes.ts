import { Router } from 'express';
import { UsuarioController } from '../controllers/UsuarioController';
import { upload } from '../uploads/uploads';
const router = Router();

// Definindo as rotas com os controladores
router.get('/', UsuarioController.getAll);
router.post('/', upload.single('foto'), (req, res, next) => {
  UsuarioController.create(req, res, next);
});
router.put('/:id', upload.single('foto'), (req, res, next) => {
  UsuarioController.update(req, res, next);
});

router.delete('/:id', UsuarioController.delete);
router.get('/:id', UsuarioController.getById); // <-- Corrigido e adicionado
export default router;
