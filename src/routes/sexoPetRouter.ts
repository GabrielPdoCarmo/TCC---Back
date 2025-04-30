// routes/sexoRoutes.ts
import { Router } from 'express';
import { SexoController } from '../controllers/sexoPetController';

const router = Router();

router.get('/', SexoController.getAll);

export default router;
