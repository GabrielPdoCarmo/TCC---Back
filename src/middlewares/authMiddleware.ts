// src/middlewares/authMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Usuario } from '../models/usuarioModel';
import { jwtSecret } from '../config/jwtConfig';
// Interface para requisições autenticadas
export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    nome: string;
    email: string;
  };
}

/**
 * 🔐 Middleware de autenticação JWT
 */
export const authMiddleware = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({
        error: 'Token de acesso requerido',
        message: 'Forneça um token no header Authorization',
      });
      return;
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      res.status(401).json({
        error: 'Formato de token inválido',
        message: 'Use o formato: Bearer <token>',
      });
      return;
    }

    if (!jwtSecret) {
      res.status(500).json({
        error: 'Configuração do servidor inválida',
      });
      return;
    }

    const decoded = jwt.verify(token, jwtSecret) as any;
    const usuario = await Usuario.findByPk(decoded.id);

    if (!usuario) {
      res.status(401).json({
        error: 'Usuário não encontrado',
      });
      return;
    }

    req.user = {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
    };

    next();
  } catch (error: any) {
    if (error.name === 'JsonWebTokenError') {
      res.status(401).json({
        error: 'Token inválido',
      });
      return;
    }

    if (error.name === 'TokenExpiredError') {
      res.status(401).json({
        error: 'Token expirado',
      });
      return;
    }

    res.status(500).json({
      error: 'Erro interno do servidor',
    });
  }
};
