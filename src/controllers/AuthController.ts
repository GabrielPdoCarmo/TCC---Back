import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Usuario } from '../models/usuarioModel';

const secretKey = process.env.JWT_SECRET || 'chave_secreta';

export class AuthController {
  static async login(req: Request, res: Response): Promise<void> {
    const { email, senha } = req.body;

    if (!email || !senha) {
      res.status(400).json({ message: 'Email e senha são obrigatórios.' });
      return;
    }

    try {
      const usuario = await Usuario.findOne({ where: { email } });

      if (!usuario) {
        res.status(404).json({ message: 'Usuário não encontrado.' });
        return;
      }

      console.log('Senha fornecida:', senha); // Senha que o usuário forneceu
      console.log('Senha armazenada (hash):', usuario.senha); // Hash armazenado no banco

      const senhaValida = await bcrypt.compare(senha, usuario.senha);
      if (!senhaValida) {
        res.status(401).json({ message: 'Senha ou Email inválida.' });
        return;
      }

      const token = jwt.sign({ id: usuario.id, email: usuario.email }, secretKey, {
        expiresIn: '1d',
      });

      res.status(200).json({
        message: 'Login realizado com sucesso.',
        token,
        usuario: {
          id: usuario.id,
          nome: usuario.nome,
          email: usuario.email,
        },
      });
    } catch (error) {
      console.error('Erro no login:', error);
      res.status(500).json({ message: 'Erro interno no servidor.' });
    }
  }

  static logout(req: Request, res: Response): void {
    // No backend, não há necessidade de fazer nada a não ser responder com sucesso
    res.status(200).json({ message: 'Deslogado com sucesso.' });
  }
}

