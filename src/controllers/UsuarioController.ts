import { Request, Response, NextFunction } from 'express';
import { Usuario } from '../models/usuarioModel';
import { ValidationError, UniqueConstraintError, DatabaseError } from 'sequelize';
import axios from 'axios';
import { Estado } from '../models/estadoModel';
import { Cidade } from '../models/cidadeModel';
import bcrypt from 'bcrypt';
import { supabase } from '../api/supabaseClient'; // certifique-se que esse client esteja criado corretamente
const saltRounds = 10; // número de rounds de salt

export class UsuarioController {
  static async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const usuarios = await Usuario.findAll();
      res.json(usuarios);
    } catch (error) {
      console.error('Erro ao listar usuários:', error);
      res.status(500).json({ error: 'Erro ao listar usuários.' });
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const usuario = await Usuario.findByPk(Number(req.params.id));
      if (!usuario) {
        res.status(404).json({ error: 'Usuário não encontrado' });
        return;
      }
      res.json(usuario);
    } catch (error) {
      console.error('Erro ao buscar usuário:', error);
      res.status(500).json({ error: 'Erro ao buscar usuário.' });
    }
  }

  static async create(req: Request, res: Response, next: NextFunction): Promise<Response> {
    let { nome, sexo_id, telefone, email, senha, cpf, cep, estado_id, cidade_id } = req.body;

    try {
      // Verificar se a senha foi fornecida
      if (!senha) {
        return res.status(400).json({ error: 'Senha é obrigatória.' });
      }

      // Verificar se a senha tem pelo menos 12 caracteres
      if (senha.length < 12) {
        return res
          .status(400)
          .json({ error: 'Senha muito curta', message: 'A senha deve ter pelo menos 12 caracteres.' });
      }

      // Hash da senha antes de salvar
      const senhaHash = await bcrypt.hash(senha, saltRounds);

      // Se cidade_id não for informado, buscar via CEP
      if (!cidade_id && cep) {
        const response = await axios.get(`https://viacep.com.br/ws/${cep}/json/`);
        const endereco = response.data;

        if (endereco?.erro) {
          return res.status(400).json({ error: 'CEP inválido ou não encontrado' });
        }

        const estado = await Estado.findOne({ where: { sigla: endereco.uf } });
        if (!estado) {
          return res.status(400).json({ error: 'Estado não encontrado no banco de dados' });
        }

        const cidade = await Cidade.findOne({
          where: {
            nome: endereco.localidade,
            estado_id: estado.id,
          },
        });

        if (!cidade) {
          return res.status(400).json({ error: 'Cidade não encontrada no banco de dados' });
        }

        cidade_id = cidade.id;
      }
      cep = cep || null; // Se o CEP não for informado, atribui null
      const usuario = await Usuario.create({
        nome,
        sexo_id,
        telefone,
        email,
        senha: senhaHash,
        cpf,
        cep,
        estado_id,
        cidade_id,
      });

      return res.status(201).json(usuario); // Alteração: 'return' adicionada para o tipo Promise<Response>
    } catch (error) {
      console.error('Erro ao criar usuário:', error);

      if (error instanceof UniqueConstraintError) {
        return res.status(400).json({
          error: 'Dados duplicados',
          message: 'Email ou CPF já cadastrado no sistema.',
        });
      } else if (error instanceof ValidationError) {
        return res.status(400).json({
          error: 'Dados inválidos',
          message: error.message,
          details: error.errors.map((e) => ({ field: e.path, message: e.message })),
        });
      } else {
        return res.status(500).json({ error: 'Erro ao criar usuário.' });
      }
    }
  }
  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({ error: 'ID de usuário inválido' });
        return;
      }

      const usuario = await Usuario.findByPk(id);
      if (!usuario) {
        res.status(404).json({ error: 'Usuário não encontrado' });
        return;
      }

      // Define o caminho da foto atual
      let fotoPath: string = usuario.foto;

      // Verifica se veio uma URL local no body (sem arquivo)
      const bodyFoto = req.body.foto;
      const isLocalImage = bodyFoto && typeof bodyFoto === 'string' && bodyFoto.startsWith('file:///');

      // Se for uma URL local sem novo arquivo, mantém a foto existente
      if (isLocalImage && !req.file) {
        console.log('URL local detectada sem novo arquivo:', bodyFoto);
        // Mantém a foto atual
        console.log('Mantendo a foto atual:', fotoPath);
      }
      // Verifica se veio imagem nova
      else if (req.file?.buffer) {
        // Se o usuário já tem foto no Supabase, excluir a antiga
        if (fotoPath && !isLocalImage) {
          try {
            console.log('Tentando deletar imagem antiga do usuário:', fotoPath);
            const { error: deleteError } = await supabase.storage.from('usuarios').remove([fotoPath]);

            if (deleteError) {
              console.error('Erro ao deletar imagem antiga:', deleteError);
            } else {
              console.log('Imagem antiga deletada com sucesso');
            }
          } catch (deleteError) {
            console.error('Erro ao tentar deletar imagem antiga:', deleteError);
          }
        }

        // Upload da nova imagem
        const fileName = `usuario_${id}_${Date.now()}.jpg`;
        const filePath = `usuarios/${fileName}`;
        const { data, error } = await supabase.storage.from('usuarios').upload(filePath, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert: true,
        });

        if (error) {
          console.error('Erro ao enviar imagem:', error);
          res.status(500).json({ error: 'Erro ao fazer upload da imagem.' });
          return;
        }

        fotoPath = data.path;
        console.log('Nova imagem enviada com sucesso:', fotoPath);
      }

      // Extrair apenas os campos permitidos
      const { nome, sexo_id, telefone, email, senha, cpf, cep, estado_id, cidade_id } = req.body;

      // Atualiza o usuário com os dados recebidos + caminho da nova foto
      await usuario.update({
        nome,
        sexo_id,
        telefone,
        email,
        senha,
        cpf,
        cep,
        foto: fotoPath,
        estado_id,
        cidade_id,
      });

      // Gerar URL pública para a resposta
      let fotoUrl = null;
      if (fotoPath) {
        const { data: publicData } = supabase.storage.from('usuarios').getPublicUrl(fotoPath);
        fotoUrl = publicData?.publicUrl;
      }

      // Retorna o usuário com a URL pública para a foto
      res.json({
        ...usuario.toJSON(),
        fotoUrl,
      });
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);

      if (error instanceof UniqueConstraintError) {
        res.status(400).json({
          error: 'Dados duplicados',
          message: 'Email ou CPF já em uso por outro usuário.',
        });
      } else if (error instanceof ValidationError) {
        res.status(400).json({
          error: 'Dados inválidos',
          message: error.message,
          details: error.errors.map((e) => ({ field: e.path, message: e.message })),
        });
      } else {
        res.status(500).json({ error: 'Erro ao atualizar usuário.' });
      }
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      const usuario = await Usuario.findByPk(id);

      if (!usuario) {
        res.status(404).json({ error: 'Usuário não encontrado' });
        return;
      }

      // Verificar se o usuário tem uma foto para deletar
      const fotoPath = usuario.foto;
      if (fotoPath && !fotoPath.startsWith('file:///')) {
        try {
          console.log('Tentando deletar imagem do usuário:', fotoPath);
          const { error: deleteError } = await supabase.storage.from('usuarios').remove([fotoPath]);

          if (deleteError) {
            console.error('Erro ao deletar imagem do usuário:', deleteError);
          } else {
            console.log('Imagem do usuário deletada com sucesso');
          }
        } catch (deleteError) {
          console.error('Erro ao tentar deletar imagem do usuário:', deleteError);
        }
      }

      // Deletar o usuário
      await usuario.destroy();
      res.status(204).send();
    } catch (error) {
      console.error('Erro ao deletar usuário:', error);

      if (error instanceof DatabaseError) {
        // Caso exista algum constraint que impede a exclusão (ex: registros relacionados)
        res.status(400).json({
          error: 'Não foi possível excluir',
          message: 'Este usuário possui registros relacionados e não pode ser excluído.',
        });
      } else {
        // Outros erros
        res.status(500).json({ error: 'Erro ao deletar usuário.' });
      }
    }
  }
}
