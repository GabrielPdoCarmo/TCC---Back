import { Request, Response, NextFunction, RequestHandler } from 'express';
import { Pet } from '../models/petModel';
import { DoencasDeficiencias } from '../models/doencasDeficienciasModel';
import { PetDoencaDeficiencia } from '../models/petDoencaDeficienciaModel';
import { Usuario } from '../models/usuarioModel';
import { Cidade } from '../models/cidadeModel';
import { supabase } from '../api/supabaseClient'; 

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

  static getByUsuarioId: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { usuario_id } = req.params;
      
      // Verificar se o ID do usuário foi fornecido
      if (!usuario_id) {
        res.status(400).json({ error: 'ID de usuário não fornecido.' });
        return;
      }
      
      // Verificar se o usuário existe
      const usuario = await Usuario.findByPk(usuario_id);
      if (!usuario) {
        res.status(404).json({ error: 'Usuário não encontrado.' });
        return;
      }
      
      // Buscar todos os pets associados ao usuário
      const pets = await Pet.findAll({
        where: { usuario_id: usuario_id }
      });
      
      // Se não encontrou nenhum pet, retornar um array vazio com status 200
      // ou você pode preferir status 404 com uma mensagem - conforme sua preferência
      res.status(200).json(pets);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Erro ao buscar pets por usuário.' });
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
        sexo_id,
        motivoDoacao,
        quantidade,
        doencas,
      } = req.body;
  
      console.log('Dados recebidos:', req.body);
      console.log('Arquivo recebido:', req.file);
  
      // Variável para armazenar a URL da foto
      let fotoUrl = null;
  
      // Verificar se um arquivo foi enviado
      if (req.file) {
        try {
          console.log('Arquivo presente, tamanho:', req.file.size);
          console.log('Tipo de arquivo:', req.file.mimetype);
      
          const fileBuffer = req.file.buffer;
      
          const filePath = `pets/${nome.replace(/\s+/g, '_')}_${Date.now()}.jpg`;
          const { data, error } = await supabase.storage
            .from('pet-images')
            .upload(filePath, fileBuffer, {
              contentType: req.file.mimetype,
            });
      
          if (error) {
            console.error('Erro ao fazer upload da imagem no Supabase:', error);
          } else if (data?.path) {
            const { data: publicData } = supabase.storage.from('pet-images').getPublicUrl(data.path);
            fotoUrl = publicData?.publicUrl ?? null;
            console.log('URL da imagem gerada:', fotoUrl);
          }
        } catch (fileError) {
          console.error('Erro ao processar o arquivo:', fileError);
        }
      } else {
        console.log('Nenhum arquivo foi enviado');
      }
      
  
      // Continuar com a criação do pet
      // Buscar o usuário e a cidade dele
      const usuario = await Usuario.findByPk(usuario_id);
      if (!usuario) {
        res.status(400).json({ error: 'Usuário não encontrado.' });
        return;
      }
  
      const cidade = await Cidade.findByPk(usuario.cidade_id);
      if (!cidade) {
        res.status(400).json({ error: 'Cidade do usuário não encontrada.' });
        return;
      }
  
      // Criar o novo pet com os dados recebidos e a URL da imagem
      const novoPet = await Pet.create({
        nome,
        especie_id,
        raca_id,
        idade,
        faixa_etaria_id,
        usuario_id,
        sexo_id,
        motivoDoacao,
        status_id: 1, // Status padrão (1 = disponível)
        cidade_id: usuario.cidade_id,
        estado_id: cidade.estado_id,
        quantidade,
        foto: fotoUrl, // Armazenar a URL da imagem (ou null caso não tenha imagem)
      });
  
      console.log('Pet criado com sucesso:', novoPet.id);
  
      // Se houver doenças relacionadas ao pet, associe-as
      if (doencas && Array.isArray(doencas)) {
        await Promise.all(
          doencas.map(async (nome: string) => {
            const [doenca] = await DoencasDeficiencias.findOrCreate({
              where: { nome },
            });
  
            await PetDoencaDeficiencia.create({
              pet_id: novoPet.id,
              doencaDeficiencia_id: doenca.id,
              possui: true,
            });
          })
        );
        console.log('Doenças associadas ao pet');
      }
  
      res.status(201).json(novoPet); // Retorne o pet recém-criado
    } catch (error) {
      console.error('Erro completo:', error);
      res.status(500).json({ error: 'Erro ao criar um pet.' });
    }
  };

  static update: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { doenca_id, estado_id, ...dadosAtualizados } = req.body;

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
      await pet.update({ ...dadosAtualizados, estado_id, doenca_id });
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
