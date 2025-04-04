import { Router } from 'express';
import { StatusController } from '../controllers/statusController';

const router = Router();

router.get('/', StatusController.getAll);
router.get('/:id', StatusController.getById);
router.post('/', StatusController.create);
router.put('/:id', StatusController.update);

export default router;
