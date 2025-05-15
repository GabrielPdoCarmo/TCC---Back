// routes/sexoRoutes.ts
import { Router } from 'express';
import { SexoController } from '../controllers/sexoPetController';

const router = Router();

router.get('/', SexoController.getAll);
router.get('/:id', SexoController.getById);

// Adicione outras rotas conforme necessário (POST, PUT, DELETE)

export default router;