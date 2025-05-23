import express from 'express';
import Estado from '../models/estadoModel';

const router = express.Router();

router.get('/', async (req, res) => {
  const estados = await Estado.findAll();
  res.json(estados);
});

router.get('/:id', async (req, res) => {
  const estado = await Estado.findByPk(req.params.id);
  if (estado) {
    res.json(estado);
  } else {
    res.status(404).json({ message: 'Estado não encontrado' });
  }
});
export default router;
