import { Router } from 'express';
import { PetController } from '../controllers/PetController';
import { upload } from '../uploads/uploads';

const router = Router();

router.get('/', PetController.getAll);
router.get('/:id', PetController.getById);
router.get('/usuario/:usuario_id', PetController.getByUsuarioId);
router.post('/', upload.single('foto'), PetController.create);
router.put('/:id', PetController.update);
router.delete('/:id', PetController.delete); // <-- essa linha é ESSENCIAL

export default router;