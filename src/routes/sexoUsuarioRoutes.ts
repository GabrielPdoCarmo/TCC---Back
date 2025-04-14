import { Router } from 'express';
import { Sexo_UsuarioController } from '../controllers/sexoUsuarioController';

const router = Router();

router.get('/', Sexo_UsuarioController.getAll);

export default router;
