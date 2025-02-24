import { Router } from 'express';
import { StatusController } from '../controllers/statusController';

const router = Router();
const statusController = new StatusController(); // Criando uma instância da classe

router.get('/status', statusController.getAll);
router.get('/status/:id', statusController.getById);
router.post('/status', statusController.create);
router.put('/status/:id', statusController.update);

export default router;
