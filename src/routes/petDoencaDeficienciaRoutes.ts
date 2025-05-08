import { Router } from 'express';
import { PetDoencaDeficienciaController } from '../controllers/PetDoencaDeficienciaController';


const router = Router();

router.get('/pets/:petId', PetDoencaDeficienciaController.findByPetId);

export default router