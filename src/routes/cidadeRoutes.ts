import express from 'express';
import Cidade from '../models/cidadeModel';

const router = express.Router();

router.get('/', async (req, res) => {
  const cidades = await Cidade.findAll({ include: 'estado' });
  res.json(cidades);
});
router.get('/:estado_id', async (req, res) => {
  const { estado_id } = req.params;

  try {
    const cidades = await Cidade.findAll({
      where: { estado_id },
    });

    res.json(cidades);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar cidades por estado.' });
  }
});

export default router;
