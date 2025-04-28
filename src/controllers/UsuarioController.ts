import { Request, Response, NextFunction } from 'express';
import { Usuario } from '../models/usuarioModel';
import { ValidationError, UniqueConstraintError, DatabaseError } from 'sequelize';
import axios from 'axios';
import { Estado } from '../models/estadoModel';
import { Cidade } from '../models/cidadeModel';
import bcrypt from 'bcrypt';

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
    let { nome, sexo_id, telefone, email, senha, cpf, cep, cidade_id } = req.body;

    try {
      // Verificar se a senha foi fornecida
      if (!senha) {
        return res.status(400).json({ error: 'Senha é obrigatória.' });
      }

      // Verificar se a senha tem pelo menos 12 caracteres
      if (senha.length < 12) {
        return res.status(400).json({ error: 'Senha muito curta', message: 'A senha deve ter pelo menos 12 caracteres.' });
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
      const usuario = await Usuario.create({ nome, sexo_id, telefone, email, senha: senhaHash, cpf, cep, cidade_id });

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
      const usuario = await Usuario.findByPk(Number(req.params.id));
      if (!usuario) {
        res.status(404).json({ error: 'Usuário não encontrado' });
        return;
      }

      await usuario.update(req.body);
      res.json(usuario);
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);

      if (error instanceof UniqueConstraintError) {
        // Tratamento para violação de chave única (email ou CPF duplicado)
        res.status(400).json({
          error: 'Dados duplicados',
          message: 'Email ou CPF já em uso por outro usuário.',
        });
      } else if (error instanceof ValidationError) {
        // Tratamento para erros de validação
        res.status(400).json({
          error: 'Dados inválidos',
          message: error.message,
          details: error.errors.map((e) => ({ field: e.path, message: e.message })),
        });
      } else {
        // Outros erros de banco de dados
        res.status(500).json({ error: 'Erro ao atualizar usuário.' });
      }
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const usuario = await Usuario.findByPk(Number(req.params.id));
      if (!usuario) {
        res.status(404).json({ error: 'Usuário não encontrado' });
        return;
      }

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
