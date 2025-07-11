import { Router } from 'express';
import { FaixaEtariaController } from '../controllers/faixaEtariaController';

const router = Router();

router.get('/', FaixaEtariaController.getAll);
router.get('/:id', FaixaEtariaController.getById);
router.post('/', FaixaEtariaController.create);
router.put('/:id', FaixaEtariaController.update);
router.get('/especie/:especie_id', FaixaEtariaController.getByEspecieId);
export default router;
