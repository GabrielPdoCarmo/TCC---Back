// controllers/termosCompromissoController.ts - Controller completo para Termos de Compromisso

import { Request, Response } from 'express';
import { TermoCompromisso } from '../models/termosCompromissoModel';
import { Pet } from '../models/petModel';
import { Usuario } from '../models/usuarioModel';
import PDFDocument from 'pdfkit';
import * as crypto from 'crypto';

// === INTERFACES ===
interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    nome: string;
    email: string;
  };
}

interface CreateTermoBody {
  petId: number;
  petNome: string;
  petRaca: string;
  petIdade: string;
  doadorNome: string;
  doadorTelefone?: string;
  doadorEmail?: string;
  adotanteNome: string;
  adotanteEmail: string;
  adotanteTelefone?: string;
  adotanteCpf?: string;
  adotanteEndereco?: string;
  assinaturaDigital: string;
  dataAssinatura: string;
  termoVersao?: string;
  observacoes?: string;
}

export class TermosCompromissoController {
  
  /**
   * 📝 Criar novo termo de compromisso
   * POST /api/termos-compromisso
   */
  static async create(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const usuarioId = req.user?.id;
      
      if (!usuarioId) {
        res.status(401).json({
          error: 'Usuário não autenticado'
        });
        return;
      }

      const {
        petId,
        petNome,
        petRaca,
        petIdade,
        doadorNome,
        doadorTelefone,
        doadorEmail,
        adotanteNome,
        adotanteEmail,
        adotanteTelefone,
        adotanteCpf,
        adotanteEndereco,
        assinaturaDigital,
        dataAssinatura,
        termoVersao = '1.0',
        observacoes
      }: CreateTermoBody = req.body;

      // Validações
      if (!petId || !assinaturaDigital || !adotanteNome || !adotanteEmail) {
        res.status(400).json({
          error: 'Dados obrigatórios não fornecidos',
          required: ['petId', 'assinaturaDigital', 'adotanteNome', 'adotanteEmail']
        });
        return;
      }

      // Verificar se já existe termo ativo para este pet e usuário
      const termoExistente = await TermoCompromisso.findByPetAndUsuario(petId, usuarioId);
      
      if (termoExistente) {
        res.status(409).json({
          error: 'Já existe um termo ativo para este pet e usuário',
          termoExistente: {
            id: termoExistente.termo_id,
            status: termoExistente.status,
            dataAssinatura: termoExistente.data_assinatura
          }
        });
        return;
      }

      // Verificar se o pet existe
      const pet = await Pet.findByPk(petId);
      if (!pet) {
        res.status(404).json({
          error: 'Pet não encontrado'
        });
        return;
      }

      // Capturar dados da requisição
      const ipUsuario = req.ip || req.socket.remoteAddress || 'unknown';
      const userAgent = req.get('User-Agent') || '';

      // Criar novo termo
      const novoTermo = await TermoCompromisso.create({
        pet_id: petId,
        usuario_id: usuarioId,
        pet_nome: petNome,
        pet_raca: petRaca,
        pet_idade: petIdade,
        doador_nome: doadorNome,
        doador_telefone: doadorTelefone,
        doador_email: doadorEmail,
        adotante_nome: adotanteNome,
        adotante_email: adotanteEmail,
        adotante_telefone: adotanteTelefone,
        adotante_cpf: adotanteCpf,
        adotante_endereco: adotanteEndereco,
        assinatura_digital: assinaturaDigital,
        data_assinatura: new Date(dataAssinatura),
        termo_versao: termoVersao,
        ip_usuario: ipUsuario,
        user_agent: userAgent,
        observacoes: observacoes
      });

      // Gerar hash do documento
      novoTermo.hash_documento = novoTermo.gerarHashDocumento();
      await novoTermo.save();

      // Log de auditoria
      console.log(`✅ Termo criado: ${novoTermo.termo_id} - Pet: ${petNome} - Adotante: ${adotanteNome}`);

      res.status(201).json({
        message: 'Termo de compromisso criado com sucesso',
        data: {
          termoId: novoTermo.termo_id,
          status: novoTermo.status,
          dataAssinatura: novoTermo.data_assinatura,
          hashDocumento: novoTermo.hash_documento
        }
      });

    } catch (error: any) {
      console.error('Erro ao criar termo:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        message: error.message
      });
    }
  }

  /**
   * 🔍 Buscar termo por Pet e Usuário
   * GET /api/termos-compromisso/pet/:petId/usuario/:usuarioId
   */
  static async findByPetAndUsuario(req: Request, res: Response): Promise<void> {
    try {
      const { petId, usuarioId } = req.params;

      const termo = await TermoCompromisso.findByPetAndUsuario(
        parseInt(petId), 
        parseInt(usuarioId)
      );

      if (!termo) {
        res.status(404).json({
          error: 'Termo não encontrado'
        });
        return;
      }

      res.json({
        message: 'Termo encontrado',
        data: termo
      });

    } catch (error: any) {
      console.error('Erro ao buscar termo:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        message: error.message
      });
    }
  }

  /**
   * 📄 Buscar termo específico por ID
   * GET /api/termos-compromisso/:termoId
   */
  static async findById(req: Request, res: Response): Promise<void> {
    try {
      const { termoId } = req.params;

      const termo = await TermoCompromisso.findOne({
        where: { termo_id: termoId },
        include: [
          { model: Pet, as: 'pet' },
          { model: Usuario, as: 'adotante' }
        ]
      });

      if (!termo) {
        res.status(404).json({
          error: 'Termo não encontrado'
        });
        return;
      }

      res.json({
        message: 'Termo encontrado',
        data: termo
      });

    } catch (error: any) {
      console.error('Erro ao buscar termo:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        message: error.message
      });
    }
  }

  /**
   * 📋 Buscar todos os termos de um usuário
   * GET /api/termos-compromisso/usuario/:usuarioId
   */
  static async findByUsuario(req: Request, res: Response): Promise<void> {
    try {
      const { usuarioId } = req.params;
      const { status, limit = 50, offset = 0 } = req.query;

      const whereClause: any = {
        usuario_id: parseInt(usuarioId)
      };

      if (status) {
        whereClause.status = status;
      }

      const { count, rows: termos } = await TermoCompromisso.findAndCountAll({
        where: whereClause,
        include: [
          { model: Pet, as: 'pet' }
        ],
        order: [['data_assinatura', 'DESC']],
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      });

      res.json({
        message: 'Termos encontrados',
        data: termos,
        total: count,
        pagination: {
          limit: parseInt(limit as string),
          offset: parseInt(offset as string),
          totalPages: Math.ceil(count / parseInt(limit as string))
        }
      });

    } catch (error: any) {
      console.error('Erro ao buscar termos do usuário:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        message: error.message
      });
    }
  }

  /**
   * 📊 Buscar estatísticas de termos
   * GET /api/termos-compromisso/usuario/:usuarioId/stats
   */
  static async getStats(req: Request, res: Response): Promise<void> {
    try {
      const { usuarioId } = req.params;

      const stats = await TermoCompromisso.contarPorStatus(parseInt(usuarioId));

      res.json({
        message: 'Estatísticas obtidas',
        data: stats
      });

    } catch (error: any) {
      console.error('Erro ao buscar estatísticas:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        message: error.message
      });
    }
  }

  /**
   * 📱 Gerar PDF do termo
   * GET /api/termos-compromisso/:termoId/pdf
   */
  static async generatePDF(req: Request, res: Response): Promise<void> {
    try {
      const { termoId } = req.params;

      const termo = await TermoCompromisso.findOne({
        where: { termo_id: termoId },
        include: [
          { model: Pet, as: 'pet' },
          { model: Usuario, as: 'adotante' }
        ]
      });

      if (!termo) {
        res.status(404).json({
          error: 'Termo não encontrado'
        });
        return;
      }

      // Configurar response headers
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="termo_${termoId}.pdf"`);

      // Criar PDF
      const doc = new PDFDocument();
      doc.pipe(res);

      // Gerar conteúdo do PDF
      TermosCompromissoController.gerarConteudoPDF(doc, termo);

      // Finalizar PDF
      doc.end();

    } catch (error: any) {
      console.error('Erro ao gerar PDF:', error);
      res.status(500).json({
        error: 'Erro ao gerar PDF',
        message: error.message
      });
    }
  }

  /**
   * 🔄 Atualizar status do termo
   * PUT /api/termos-compromisso/:termoId/status
   */
  static async updateStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { termoId } = req.params;
      const { status, motivo } = req.body;
      const usuarioId = req.user?.id;

      const termo = await TermoCompromisso.findOne({
        where: { termo_id: termoId }
      });

      if (!termo) {
        res.status(404).json({
          error: 'Termo não encontrado'
        });
        return;
      }

      // Atualizar status usando métodos do modelo
      switch (status) {
        case 'CANCELADO':
          await termo.cancelar(motivo, usuarioId);
          break;
        case 'CONCLUIDO':
          await termo.concluir(motivo, usuarioId);
          break;
        case 'SUSPENSO':
          await termo.suspender(motivo, usuarioId);
          break;
        case 'ATIVO':
          await termo.reativar(motivo, usuarioId);
          break;
        default:
          res.status(400).json({
            error: 'Status inválido',
            validStatuses: ['ATIVO', 'CANCELADO', 'CONCLUIDO', 'SUSPENSO']
          });
          return;
      }

      res.json({
        message: 'Status do termo atualizado com sucesso',
        data: {
          termoId: termo.termo_id,
          status: termo.status,
          dataAlteracao: termo.data_alteracao,
          motivo: termo.motivo_alteracao
        }
      });

    } catch (error: any) {
      console.error('Erro ao atualizar status:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        message: error.message
      });
    }
  }

  /**
   * ✅ Validar termo
   * GET /api/termos-compromisso/:termoId/validate
   */
  static async validate(req: Request, res: Response): Promise<void> {
    try {
      const { termoId } = req.params;

      const termo = await TermoCompromisso.findOne({
        where: { termo_id: termoId }
      });

      if (!termo) {
        res.status(404).json({
          error: 'Termo não encontrado'
        });
        return;
      }

      const isValido = termo.isValido();
      let reason = '';

      if (!isValido) {
        if (termo.status !== 'ATIVO') {
          reason = `Termo está com status: ${termo.status}`;
        } else if (termo.data_vencimento && new Date() > termo.data_vencimento) {
          reason = 'Termo vencido';
        }
      }

      res.json({
        message: 'Validação concluída',
        data: {
          valid: isValido,
          reason: reason || undefined,
          termo: {
            id: termo.termo_id,
            status: termo.status,
            dataAssinatura: termo.data_assinatura,
            dataVencimento: termo.data_vencimento
          }
        }
      });

    } catch (error: any) {
      console.error('Erro ao validar termo:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        message: error.message
      });
    }
  }

  /**
   * 📧 Marcar email como enviado
   * POST /api/termos-compromisso/:termoId/email-sent
   */
  static async markEmailSent(req: Request, res: Response): Promise<void> {
    try {
      const { termoId } = req.params;

      const termo = await TermoCompromisso.findOne({
        where: { termo_id: termoId }
      });

      if (!termo) {
        res.status(404).json({
          error: 'Termo não encontrado'
        });
        return;
      }

      await termo.marcarEmailEnviado();

      res.json({
        message: 'Email marcado como enviado',
        data: {
          termoId: termo.termo_id,
          emailEnviado: termo.email_enviado,
          dataEnvioEmail: termo.data_envio_email
        }
      });

    } catch (error: any) {
      console.error('Erro ao marcar email:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        message: error.message
      });
    }
  }

  // === MÉTODOS AUXILIARES ===

  /**
   * 🔧 Gerar conteúdo do PDF
   */
  private static gerarConteudoPDF(doc: PDFKit.PDFDocument, termo: TermoCompromisso): void {
    const dataFormatada = new Date(termo.data_assinatura).toLocaleDateString('pt-BR');

    // Cabeçalho
    doc.fontSize(20)
       .font('Helvetica-Bold')
       .text('TERMO DE COMPROMISSO DE ADOÇÃO', 0, 50, { align: 'center' });

    doc.fontSize(12)
       .font('Helvetica')
       .text(`Data: ${dataFormatada}`, 0, 90, { align: 'center' })
       .text(`ID do Termo: ${termo.termo_id}`, 0, 110, { align: 'center' });

    // Dados do Pet
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .text('DADOS DO PET:', 50, 150);

    doc.fontSize(12)
       .font('Helvetica')
       .text(`Nome: ${termo.pet_nome}`, 50, 170)
       .text(`Raça: ${termo.pet_raca}`, 50, 190)
       .text(`Idade: ${termo.pet_idade}`, 50, 210);

    // Dados do Doador
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .text('DADOS DO DOADOR:', 50, 240);

    doc.fontSize(12)
       .font('Helvetica')
       .text(`Nome: ${termo.doador_nome}`, 50, 260)
       .text(`Telefone: ${termo.doador_telefone || 'Não informado'}`, 50, 280)
       .text(`Email: ${termo.doador_email || 'Não informado'}`, 50, 300);

    // Dados do Adotante
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .text('DADOS DO ADOTANTE:', 50, 330);

    doc.fontSize(12)
       .font('Helvetica')
       .text(`Nome: ${termo.adotante_nome}`, 50, 350)
       .text(`CPF: ${termo.adotante_cpf || 'Não informado'}`, 50, 370)
       .text(`Email: ${termo.adotante_email}`, 50, 390)
       .text(`Telefone: ${termo.adotante_telefone || 'Não informado'}`, 50, 410);

    // Compromissos
    if (doc.y > 600) {
      doc.addPage();
    }

    doc.fontSize(14)
       .font('Helvetica-Bold')
       .text('COMPROMISSOS DO ADOTANTE:', 50, doc.y + 30);

    const compromissos = [
      'Proporcionar cuidados veterinários adequados ao pet.',
      'Oferecer alimentação adequada e de qualidade.',
      'Providenciar abrigo seguro e confortável.',
      'Não abandonar, maltratar ou submeter o animal a maus-tratos.',
      'Entrar em contato com o doador antes de repassar a terceiros.',
      'Permitir visitas do doador mediante agendamento prévio.',
      'Informar mudanças de endereço ou contato.'
    ];

    doc.fontSize(12)
       .font('Helvetica');

    compromissos.forEach((compromisso, index) => {
      doc.text(`${index + 1}. ${compromisso}`, 50, doc.y + 15);
    });

    // Assinatura Digital
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .text('ASSINATURA DIGITAL:', 50, doc.y + 30);

    doc.fontSize(12)
       .font('Helvetica')
       .text(`Assinatura: ${termo.assinatura_digital}`, 50, doc.y + 15)
       .text(`Data da Assinatura: ${dataFormatada}`, 50, doc.y + 10)
       .text(`IP de Origem: ${termo.ip_usuario}`, 50, doc.y + 10)
       .text(`Hash do Documento: ${termo.hash_documento}`, 50, doc.y + 10);

    // Rodapé
    doc.fontSize(10)
       .font('Helvetica')
       .text('Documento gerado digitalmente pelo App de Adoção de Pets', 0, doc.page.height - 50, { 
         align: 'center' 
       })
       .text(`Versão do Termo: ${termo.termo_versao}`, 0, doc.page.height - 35, { 
         align: 'center' 
       });
  }
}