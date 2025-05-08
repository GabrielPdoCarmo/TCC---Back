import { Request, Response } from 'express';
import { PetDoencaDeficiencia } from '../models/petDoencaDeficienciaModel';


export class PetDoencaDeficienciaController {
  static async findByPetId(req: Request, res: Response): Promise<void> {
    try {
      const { petId } = req.params;

      const petDoencasDeficiencias = await PetDoencaDeficiencia.findAll({
        where: { pet_id: petId }
      });
      res.status(200).json(petDoencasDeficiencias);
    } catch (error) {
      console.error('Erro ao buscar doenças/deficiências do pet:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
}