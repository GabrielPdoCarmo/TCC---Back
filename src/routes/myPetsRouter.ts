import express from 'express';
import { MyPetsController } from '../controllers/myPetsController';

const router = express.Router();

// Rota para criar uma nova associação de pet com usuário
router.post('/', MyPetsController.create);
// Rota para remover uma associação de pet com usuário
router.delete('/pets/:pet_id/usuario/:usuario_id', MyPetsController.delete);
// Rota para listar os pets de um usuário específico
router.get('/usuario/:usuario_id', MyPetsController.getByUsuarioId);

export default router;
