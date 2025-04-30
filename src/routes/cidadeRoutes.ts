import express, { Request, Response } from 'express';
import Cidade from '../models/cidadeModel';
import Estado from '../models/estadoModel';

const router = express.Router(); // ✅ CORRETO!

router.get('/', async (req: Request, res: Response) => {
  const cidades = await Cidade.findAll({ include: 'estado' });
  res.json(cidades);
});

router.get('/:estado_id', async (req: Request, res: Response) => {
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
router.get('/:id/:estado_id', async (req: Request, res: Response) => {
  const { id, estado_id } = req.params;
  try {
    const cidades = await Cidade.findAll({
      where: { id, estado_id },
    });
    res.json(cidades);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar cidades por estado.' });
  }
});
export default router;
