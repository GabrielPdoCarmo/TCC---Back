import { Request, Response } from "express";
import { EspecieFaixaEtaria } from "../models/EspecieFaixaEtaria";

export class FaixaEtariaController {
    static async getAll(req: Request, res: Response) {
      try {
        const faixas = await EspecieFaixaEtaria.findAll();
        res.json(faixas);
      } catch (error) {
        res.status(500).json({ error: "Erro ao buscar faixas etárias" });
      }
    }
  
    static async getById(req: Request, res: Response) {
      try {
        const faixa = await EspecieFaixaEtaria.findByPk(Number(req.params.id));
        if (!faixa) return res.status(404).json({ error: "Faixa não encontrada" });
        res.json(faixa);
      } catch (error) {
        res.status(500).json({ error: "Erro ao buscar faixa etária" });
      }
    }
    static async create(req: Request, res: Response) {
      try {
        const faixa = await EspecieFaixaEtaria.create(req.body);
        res.status(201).json(faixa);
      } catch (error) {
        res.status(400).json({ error: "Erro ao criar faixa etária" });
      }
    }
  
    static async update(req: Request, res: Response) {
      try {
        const faixa = await EspecieFaixaEtaria.findByPk(Number(req.params.id));
        if (!faixa) return res.status(404).json({ error: "Faixa não encontrada" });
  
        await faixa.update(req.body);
        res.json(faixa);
      } catch (error) {
        res.status(400).json({ error: "Erro ao atualizar faixa etária" });
      }
    }
  
    static async delete(req: Request, res: Response) {
      try {
        const faixa = await EspecieFaixaEtaria.findByPk(Number(req.params.id));
        if (!faixa) return res.status(404).json({ error: "Faixa não encontrada" });
  
        await faixa.destroy();
        res.status(204).send();
      } catch (error) {
        res.status(400).json({ error: "Erro ao deletar faixa etária" });
      }
    }
  }
  