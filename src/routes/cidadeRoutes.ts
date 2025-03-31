import express from 'express';
import Cidade from '../models/cidadeModel';

const router = express.Router();

router.get('/', async (req, res) => {
  const cidades = await Cidade.findAll({ include: 'estado' });
  res.json(cidades);
});

export default router;
