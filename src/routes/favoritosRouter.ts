import { Router } from 'express';
import { FavoritosController } from '../controllers/favoritosController';

const router = Router();

router.post('/', FavoritosController.create); // Adicionar favorito
router.get('/:usuarioId', FavoritosController.getByUserId); // Listar favoritos de um usuário
router.delete('/:usuarioId/:petId', FavoritosController.delete); // Remover favorito

export default router;
