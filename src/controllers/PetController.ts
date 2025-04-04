import { Request, Response, NextFunction, RequestHandler } from 'express';
import { Pet } from '../models/petModel';
import { DoencasDeficiencias } from '../models/doencasDeficienciasModel';
import { PetDoencaDeficiencia } from '../models/petDoencaDeficienciaModel';

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
        quantidade,
        doencas,
      } = req.body;

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
        quantidade,
      });

      // Se veio alguma doença no body
      if (doencas && Array.isArray(doencas)) {
        await Promise.all(
          doencas.map(async (nome: string) => {
            const [doenca] = await DoencasDeficiencias.findOrCreate({
              where: { nome },
            });

            await PetDoencaDeficiencia.create({
              pet_id: novoPet.id,
              doencaDeficiencia_id: doenca.id,
              possui: true, // valor padrão
            });
          })
        );
      }

      res.status(201).json(novoPet); // <- estava no lugar errado
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

  static delete: RequestHandler = async (req, res) => {
    try {
      const { id } = req.params;
      const pet = await Pet.findByPk(id);

      if (!pet) {
        res.status(404).json({ message: 'Pet não encontrado.' });
        return; // <- necessário pra não continuar a função depois do retorno
      }

      await pet.destroy();
      res.status(200).json({ message: 'Pet deletado com sucesso.' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Erro ao deletar pet.' });
    }
  };
}
