import { Router } from 'express';
import { FavoritosController } from '../controllers/FavoritosController';

const router = Router();

router.post('/favoritos', FavoritosController.create); // Adicionar favorito
router.get('/favoritos/:usuarioId', FavoritosController.getByUserId); // Listar favoritos de um usuário
router.delete('/favoritos/:usuarioId/:petId', FavoritosController.delete); // Remover favorito

export default router;
