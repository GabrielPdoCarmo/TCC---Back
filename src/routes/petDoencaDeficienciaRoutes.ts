import { Router } from 'express';
import PetDoencaDeficienciaController from '../controllers/PetDoencaDeficienciaController ';

const router = Router();

router.get('/:pet_id', PetDoencaDeficienciaController.listarPorPetId);

export default router;