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
router.post('/validar', UsuarioController.checkDuplicateFields);
router.delete('/:id', UsuarioController.delete);
router.get('/:id', UsuarioController.getById); // <-- Corrigido e adicionado
router.post('/validar-edicao', UsuarioController.checkDuplicateFieldsForEdit);

router.get('/email/:email', UsuarioController.getByEmail); // <-- Corrigido e adicionado
router.post('/recuperar-senha/sendRecoveryCode', UsuarioController.sendRecoveryCode);
router.post('/recuperar-senha/checkCode', UsuarioController.checkCode);
export default router;
