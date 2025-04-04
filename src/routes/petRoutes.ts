import { Router } from 'express';
import { PetController } from '../controllers/PetController';

const router = Router();

router.get('/', PetController.getAll);
router.get('/:id', PetController.getById);
router.post('/', PetController.create);
router.put('/:id', PetController.update);
router.delete('/:id', PetController.delete); // <-- essa linha é ESSENCIAL

export default router;
