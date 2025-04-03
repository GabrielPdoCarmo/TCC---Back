import { Router } from 'express';
import { DoencasDeficienciasController } from '../controllers/DoencasDeficienciasController';

const router = Router();
router.get('/doencasdeficiencias/:id', DoencasDeficienciasController.getById);

export default router;
