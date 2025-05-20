import { Request, Response, NextFunction } from 'express';
import { Usuario } from '../models/usuarioModel';
import { ValidationError, UniqueConstraintError, DatabaseError } from 'sequelize';
import axios from 'axios';
import { Estado } from '../models/estadoModel';
import { Cidade } from '../models/cidadeModel';
import bcrypt from 'bcrypt';
import { supabase } from '../api/supabaseClient'; // certifique-se que esse client esteja criado corretamente
const saltRounds = 10; // número de rounds de salt
import { cpf } from 'cpf-cnpj-validator';
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
    let { nome, sexo_id, telefone, email, senha, cpf: cpfInput, cep, estado_id, cidade_id } = req.body;

    try {
      // Validação de CPF - adicionar aqui
      if (cpfInput) {
        // Remove caracteres não numéricos
        const cpfNumerico = cpfInput.replace(/\D/g, '');

        // Verifica se o CPF é válido
        if (!cpf.isValid(cpfNumerico)) {
          return res.status(400).json({
            error: 'CPF inválido',
            message: 'O CPF informado não é válido.',
          });
        }

        // Formata o CPF antes de salvar (opcional)
        cpfInput = cpf.format(cpfNumerico);
      } else {
        return res.status(400).json({
          error: 'CPF obrigatório',
          message: 'O CPF é obrigatório para cadastro.',
        });
      }

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
        cpf: cpfInput,
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

      // Desestruturar e extrair os campos permitidos
      let {
        foto: bodyFoto,
        nome,
        sexo_id,
        telefone,
        email,
        senha,
        cpf: cpfInput,
        cep,
        estado_id,
        cidade_id,
      } = req.body;
      if (cpfInput !== undefined && cpfInput !== null) {
        // Remove caracteres não numéricos
        const cpfNumerico = cpfInput.replace(/\D/g, '');

        // Verifica se o CPF é válido
        if (!cpf.isValid(cpfNumerico)) {
          res.status(400).json({
            error: 'CPF inválido',
            message: 'O CPF informado não é válido.',
          });
          return;
        }

        // Formata o CPF antes de salvar (opcional)
        cpfInput = cpf.format(cpfNumerico);
      }
      // Debug: Mostrar valores recebidos
      console.log('Valores recebidos do cliente:', {
        nome,
        sexo_id,
        telefone,
        email,
        senha: senha ? '[SENHA RECEBIDA]' : '[SEM SENHA]',
        cpf: cpfInput,
        cep,
        estado_id: estado_id || 'não informado',
        cidade_id: cidade_id || 'não informado',
      });

      // Inicializar dados atualizados - incluir TODOS os campos possíveis incluindo senha
      const dadosAtualizados: {
        nome: any;
        sexo_id: string | number;
        telefone: any;
        email: any;
        cpf: any;
        cep: any;
        estado_id: number;
        cidade_id: number;
        foto: any;
        senha?: string; // Tornar senha opcional
      } = {
        nome,
        sexo_id: sexo_id ? Number(sexo_id) : usuario.sexo_id,
        telefone,
        email,
        cpf: cpfInput,
        cep: cep !== undefined && cep !== null ? cep : usuario.cep,
        estado_id: estado_id ? Number(estado_id) : usuario.estado_id,
        cidade_id: cidade_id ? Number(cidade_id) : usuario.cidade_id,
        foto: bodyFoto,
      };

      // IMPORTANTE: Criptografar a senha aqui se foi fornecida
      const bcrypt = require('bcrypt');
      if (senha && senha.trim() !== '') {
        // Criptografar a senha manualmente (mesmo com hooks ativados, garantimos que será feito)
        const saltRounds = 10;
        dadosAtualizados.senha = await bcrypt.hash(senha, saltRounds);
        console.log('Nova senha recebida e criptografada manualmente');
      } else {
        console.log('Senha não informada, mantendo a atual');
        // Remover o campo senha se não foi fornecido
        delete dadosAtualizados.senha;
      }

      // Inicializar a URL da foto com a existente ou a do body
      let fotoUrl = bodyFoto || usuario.foto; // Mantém a foto atual se não for enviada nova

      // Resto do código de processamento de foto...
      // [código existente para upload de foto]

      // Adicionar a URL da foto aos dados atualizados
      dadosAtualizados.foto = fotoUrl;

      // Debug: mostrar objeto antes da atualização
      console.log('Valores do usuário ANTES da atualização:', {
        id: usuario.id,
        nome: usuario.nome,
        estado_id: usuario.estado_id,
        cidade_id: usuario.cidade_id,
        cep: usuario.cep, // Adicionado para depuração
      });

      // Imprimir a senha criptografada para depuração
      if (dadosAtualizados.senha) {
        console.log('Senha criptografada que será enviada:', dadosAtualizados.senha.substring(0, 10) + '...');
      }

      // ATUALIZAÇÃO COM HOOKS ATIVADOS
      await usuario.update(
        {
          ...dadosAtualizados,
          estado_id: Number(estado_id) || usuario.estado_id,
          cidade_id: Number(cidade_id) || usuario.cidade_id,
          cep: cep !== undefined && cep !== null ? cep : usuario.cep,
        },
        {
          hooks: true, // Mantemos os hooks ativados, mas já criptografamos manualmente acima
        }
      );

      // Recarregar o usuário para garantir que temos os dados corretos
      const usuarioAtualizado = await Usuario.findByPk(id);

      // Verificar se usuarioAtualizado não é null antes de acessá-lo
      if (!usuarioAtualizado) {
        res.status(404).json({ error: 'Usuário não encontrado após atualização' });
        return;
      }

      // Debug: mostrar objeto após atualização
      console.log('Valores do usuário APÓS a atualização:', {
        id: usuarioAtualizado.id,
        nome: usuarioAtualizado.nome,
        estado_id: usuarioAtualizado.estado_id,
        cidade_id: usuarioAtualizado.cidade_id,
        senha: usuarioAtualizado.senha ? 'Senha definida e criptografada' : 'Sem senha',
      });

      // Retorna o usuário com a URL pública para a foto
      res.json({
        ...usuarioAtualizado.toJSON(),
        fotoUrl,
      });
    } catch (error) {
      // Tratamento de erros existente...
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
