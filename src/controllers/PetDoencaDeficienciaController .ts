import { Request, Response, NextFunction, RequestHandler } from 'express';
import { Pet } from '../models/petModel';
import { DoencasDeficiencias } from '../models/doencasDeficienciasModel';
import { PetDoencaDeficiencia } from '../models/petDoencaDeficienciaModel';

export class PetDoencaDeficienciaController {
  /**
   * Lista todas as doenças/deficiências associadas a um pet pelo ID do pet
   */
  static listarPorPetId: RequestHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { pet_id } = req.params;

      // Verificar se o pet existe
      const petExiste = await Pet.findByPk(pet_id);
      if (!petExiste) {
        res.status(404).json({ error: 'Pet não encontrado.' });
        return;
      }

      // Buscar todas as associações com as informações das doenças
      const doencasPet = await PetDoencaDeficiencia.findAll({
        where: { pet_id },
        include: [
          {
            model: DoencasDeficiencias,
            as: 'doenca', // nome que demos no model
            attributes: ['id', 'nome'],
          },
        ],
      });

      res.status(200).json(doencasPet);
    } catch (error) {
      console.error('Erro ao listar doenças/deficiências do pet:', error);
      next(error);
    }
  };
}

export default PetDoencaDeficienciaController;
