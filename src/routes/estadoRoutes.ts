import express from 'express';
import Estado from '../models/estadoModel';

const router = express.Router();

router.get('/', async (req, res) => {
  const estados = await Estado.findAll();
  res.json(estados);
});

export default router;
