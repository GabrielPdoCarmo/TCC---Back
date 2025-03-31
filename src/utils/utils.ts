import { Request, Response, NextFunction } from "express";  // Importando NextFunction

 export const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next); // Tratar qualquer erro de função assíncrona
  };
  