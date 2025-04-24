// Exemplo usando Express + Sequelize
import express from 'express';
import { Cidade } from '../models/cidadeModel'; // ajuste o caminho conforme sua estrutura
import { Estado } from '../models/estadoModel';
import { Request, Response } from 'express';

const router = express.Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const estados = await Estado.findAll({
      include: [
        {
          model: Cidade,
          as: 'cidades', // Certifique-se que esse alias é o mesmo usado no @HasMany
          attributes: ['id', 'nome'],
        },
      ],
      order: [
        ['nome', 'ASC'],
        [{ model: Cidade, as: 'cidades' }, 'nome', 'ASC'],
      ],
    });

    const resultado = {
      estados: estados.map((estado) => ({
        id: estado.id,
        nome: estado.nome,
        sigla: estado.sigla,
        cidades:
          estado.cidades?.map((cidade) => ({
            id: cidade.id,
            nome: cidade.nome,
          })) ?? [],
      })),
    };

    res.json(resultado);
  } catch (error) {
    console.error('Erro ao gerar JSON para o frontend:', error);
    res.status(500).json({ error: 'Erro ao gerar JSON.' });
  }
});

export default router;
