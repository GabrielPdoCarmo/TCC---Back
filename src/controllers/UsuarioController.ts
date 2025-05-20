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

      // Processamento de imagem (similar ao criar do pet)
      let fotoUrl = null;

      if (req.file) {
        try {
          console.log('Arquivo presente, tamanho:', req.file.size);
          console.log('Tipo de arquivo:', req.file.mimetype);

          const fileBuffer = req.file.buffer;

          // Criar um nome de arquivo único baseado no nome do usuário e timestamp
          const filePath = `usuarios/${nome.replace(/\s+/g, '_')}_${Date.now()}.jpg`;
          const { data, error } = await supabase.storage.from('user-images').upload(filePath, fileBuffer, {
            contentType: req.file.mimetype,
          });

          if (error) {
            console.error('Erro ao fazer upload da imagem no Supabase:', error);
          } else if (data?.path) {
            const { data: publicData } = supabase.storage.from('user-images').getPublicUrl(data.path);
            fotoUrl = publicData?.publicUrl ?? null;
            console.log('URL da imagem gerada:', fotoUrl);
          }
        } catch (fileError) {
          console.error('Erro ao processar o arquivo:', fileError);
        }
      } else {
        console.log('Nenhum arquivo foi enviado');
      }

      // Criar o usuário com a foto (se houver)
      const usuario = await Usuario.create({
        nome,
        sexo_id,
        telefone,
        email,
        senha: senhaHash,
        cpf,
        cep,
        foto: fotoUrl, // Adiciona o caminho da foto
        estado_id,
        cidade_id,
      });

      // Retorna o usuário criado junto com a URL pública da foto (se houver)
      return res.status(201).json({
        ...usuario.toJSON(),
        fotoUrl,
      });
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

      // Desestruturar e extrair os campos permitidos (incluindo foto)
      const { foto: bodyFoto, nome, sexo_id, telefone, email, senha, cpf, cep, estado_id, cidade_id } = req.body;

      // Incluir foto no objeto dadosAtualizados
      const dadosAtualizados = {
        nome,
        sexo_id,
        telefone,
        email,
        senha,
        cpf,
        cep,
        estado_id,
        cidade_id,
        foto: bodyFoto, // Adicionar a foto aqui
      };

      // Inicializar a URL da foto com a existente ou a do body
      let fotoUrl = bodyFoto || usuario.foto; // Mantém a foto atual se não for enviada nova

      // Verificar se a URL da foto é local (começa com file:///)
      const isLocalImage = typeof fotoUrl === 'string' && fotoUrl.startsWith('file:///');

      // Se for uma URL local, precisamos verificar como proceder
      if (isLocalImage && !req.file) {
        console.log('URL local detectada sem novo arquivo de upload, essa URL não pode ser usada:', fotoUrl);

        // Duas opções aqui:
        // 1. Manter a URL anterior do Supabase (se existir)
        // 2. Informar erro ao cliente

        // Opção 1: Manter a URL anterior
        if (usuario.foto && usuario.foto.includes('supabase')) {
          console.log('Mantendo a URL anterior do Supabase:', usuario.foto);
          fotoUrl = usuario.foto;
        } else {
          // Opção 2: Informar erro
          res.status(400).json({
            error:
              'A URL da imagem é um caminho local e não pode ser usada no servidor. Por favor, envie o arquivo novamente.',
          });
          return;
        }
      }

      // Se tiver arquivo de upload, processar normalmente
      if (req.file) {
        try {
          // Se o usuário já tiver uma foto e estamos fazendo upload de uma nova,
          // devemos deletar a antiga do Supabase APENAS se for uma URL do Supabase
          const usuarioFoto = usuario.foto;
          if (usuarioFoto && usuarioFoto.includes('supabase')) {
            console.log('Tentando deletar imagem antiga do Supabase ao atualizar usuário:', usuarioFoto);

            const urlParts = usuarioFoto.split('user-images/');
            if (urlParts.length > 1) {
              const filePath = urlParts[1].split('?')[0]; // Extrair caminho correto
              console.log('Caminho extraído para deleção:', filePath);

              const { error: deleteError } = await supabase.storage.from('user-images').remove([filePath]);

              if (deleteError) {
                console.error('Erro ao deletar imagem antiga do Supabase:', deleteError);
              } else {
                console.log('Imagem antiga deletada com sucesso durante atualização');
              }
            } else {
              console.error('Formato de URL inesperado, não foi possível extrair caminho para deleção:', usuarioFoto);
            }
          }

          // Usar o nome atualizado do usuário se disponível
          const nomeUsuario = nome || usuario.nome;

          // Fazer upload da nova imagem
          const fileBuffer = req.file.buffer;
          const filePath = `usuarios/${nomeUsuario.replace(/\s+/g, '_')}_${Date.now()}.jpg`;

          const { data, error } = await supabase.storage.from('user-images').upload(filePath, fileBuffer, {
            contentType: req.file.mimetype,
          });

          if (error) {
            console.error('Erro ao fazer upload da imagem no Supabase:', error);
          } else if (data?.path) {
            const { data: publicData } = supabase.storage.from('user-images').getPublicUrl(data.path);
            fotoUrl = publicData?.publicUrl ?? null;
            console.log('Nova URL da imagem gerada:', fotoUrl);
          }
        } catch (fileError) {
          console.error('Erro ao processar o arquivo:', fileError);
        }
      }

      // Adicionar a URL da foto aos dados atualizados
      dadosAtualizados.foto = fotoUrl;

      // Atualizar o usuário com os dados recebidos
      await usuario.update(dadosAtualizados);

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
          const { error: deleteError } = await supabase.storage.from('user-images').remove([fotoPath]);

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
