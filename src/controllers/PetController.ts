import { Request, Response, NextFunction, RequestHandler } from 'express';
import { Pet } from '../models/petModel';
import { DoencasDeficiencias } from '../models/doencasDeficienciasModel'; // <-- Adicione esta linha

export class PetController {
  static getAll: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const pets = await Pet.findAll();
      res.json(pets); // REMOVIDO o "return"
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Erro ao listar os pets.' });
    }
  };

  static getById: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const pet = await Pet.findByPk(req.params.id);
      if (!pet) {
        res.status(404).json({ error: 'Pet não encontrado.' });
        return;
      }
      res.json(pet); // REMOVIDO o "return"
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Erro ao buscar o pet.' });
    }
  };

  static create: RequestHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const {
        nome,
        especie_id,
        raca_id,
        idade,
        faixa_etaria_id,
        usuario_id,
        sexo,
        motivoDoacao,
        status_id,
        cidade_id,
        doenca,
      } = req.body;

      // 1. Criar o Pet inicialmente
      const novoPet = await Pet.create({
        nome,
        especie_id,
        raca_id,
        idade,
        faixa_etaria_id,
        usuario_id,
        sexo,
        motivoDoacao,
        status_id,
        cidade_id,
      });

      // 2. Se informar uma doença, cria o registro e associa ao pet
      if (doenca) {
        const novaDoenca = await DoencasDeficiencias.create({
          nome: doenca,
          petId: novoPet.id,
        });

        // Atualizar o Pet com a doença vinculada
        await novoPet.update({ doencaDeficiencia_id: novaDoenca.id });
      }

      res.status(201).json(novoPet);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Erro ao criar um pet.' });
    }
  };

  static update: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { doenca_id, ...dadosAtualizados } = req.body;

      // Buscar o Pet pelo ID
      const pet = await Pet.findByPk(req.params.id);
      if (!pet) {
        res.status(404).json({ error: 'Pet não encontrado.' });
        return;
      }

      // Se tiver um doenca_id, validar se existe
      if (doenca_id) {
        const doencaExistente = await DoencasDeficiencias.findByPk(doenca_id);
        if (!doencaExistente) {
          res.status(400).json({ error: 'Doença/Deficiência não encontrada.' });
          return;
        }
      }

      // Atualizar o pet com os dados recebidos
      await pet.update({ ...dadosAtualizados, doenca_id });
      res.json(pet);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Erro ao atualizar o pet.' });
    }
  };

  static delete: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const pet = await Pet.findByPk(req.params.id);
      if (!pet) {
        res.status(404).json({ error: 'Pet não encontrado.' });
        return;
      }

      await pet.destroy();
      res.status(204).send(); // REMOVIDO o "return"
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Erro ao deletar o pet.' });
    }
  };
}
