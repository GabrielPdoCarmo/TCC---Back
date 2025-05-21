import { Router } from 'express';
import { FavoritosController } from '../controllers/favoritosController';

const router = Router();

// Adicionar favorito (passando usuario_id como parâmetro)
router.post('/usuario/:usuario_id/pet/:pet_id', FavoritosController.create);

// Remover favorito (passando usuario_id como parâmetro)
router.delete('/usuario/:usuario_id/pet/:pet_id', FavoritosController.delete);

// Obter favoritos de um usuário
router.get('/usuario/:usuario_id', FavoritosController.getByUserId);

router.get('/usuario/:usuario_id/pet/:pet_id/check', FavoritosController.checkFavorito);

export default router;
