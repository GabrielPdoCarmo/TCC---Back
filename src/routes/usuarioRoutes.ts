import { Router } from 'express';
import { UsuarioController } from '../controllers/UsuarioController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { upload } from '../uploads/uploads';

const router = Router();

// ✅ ROTAS ESPECÍFICAS PRIMEIRO (antes das rotas com parâmetros)

// Rotas de validação
router.post('/validar', UsuarioController.checkDuplicateFields);
router.post('/check-duplicate', UsuarioController.checkDuplicateFields); // ✅ Alias para compatibilidade
router.post('/validar-edicao', UsuarioController.checkDuplicateFieldsForEdit);

// Rotas de recuperação de senha
router.post('/recuperar-senha/sendRecoveryCode', UsuarioController.sendRecoveryCode);
router.post('/recuperar-senha/checkCode', UsuarioController.checkCode);

// ✅ ROTAS GERAIS
router.get('/', UsuarioController.getAll);
router.post('/', upload.single('foto'), (req, res, next) => {
  UsuarioController.create(req, res, next);
});

// ✅ ROTAS COM PARÂMETROS (sempre por último)

// Rota específica para verificar se pode excluir conta (deve vir antes de /:id)
router.get('/:id/pode-excluir-conta', authMiddleware, UsuarioController.podeExcluirConta);

// Rotas por email (deve vir antes de /:id para evitar conflitos)
router.get('/email/:email', UsuarioController.getByEmail);

// Rotas básicas por ID
router.get('/:id', UsuarioController.getById);
router.put('/:id', upload.single('foto'), (req, res, next) => {
  UsuarioController.update(req, res, next);
});

// ✅ CORREÇÃO: Apenas uma rota DELETE (com autenticação)
router.delete('/:id', authMiddleware, UsuarioController.delete);

export default router;