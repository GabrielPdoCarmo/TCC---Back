import { Router } from 'express';
import { PetController } from '../controllers/PetController';
import { upload } from '../uploads/uploads';

const router = Router();

router.get('/', PetController.getAll);
router.get('/:id', PetController.getById);
router.get('/usuario/:usuario_id', PetController.getByUsuarioId);
router.post('/', upload.single('foto'), PetController.create);
router.put('/:id', upload.single('foto'), PetController.update);
router.delete('/:id', PetController.delete);
router.put('/status/:id', PetController.updateStatus);
router.get('/status/:status_id', PetController.getByStatusId);
router.get('/nome/:nome', PetController.getByNamePet);
router.get('/raca/:raca_id', PetController.getByRacaId);
router.get('/especie/:especie_id', PetController.getByEspecieId);
router.get('/estado/:estado_id/cidade/:cidade_id', PetController.getByEstadoId_CidadeId);
router.get('/faixa-etaria/:faixa_etaria_id/idade/:idade', PetController.getByFaixaEtariaId_Idade);
router.get('/faixa-etaria/:faixa_etaria_id/idade/:idade/status/:status_id',PetController.getByFaixaEtariaId_Idade_StatusId);
router.get('/meus-pets/nome/:nome', PetController.getMyPetsByName);
router.get('/raca/:raca_id/status/:status_id', PetController.getByRacaId_StatusId);
router.get('/especie/:especie_id/status/:status_id', PetController.getByEspecieId_StatusId);
router.get('/estado/:estado_id/cidade/:cidade_id/status/:status_id', PetController.getByEstadoId_CidadeId_StatusId);
router.put('/:id/transfer', PetController.transferPet);
export default router;
