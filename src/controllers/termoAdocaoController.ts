// controllers/termosCompromissoController.ts - Atualizado com localização completa e email para ambos

import { Request, Response } from 'express';
import { TermoAdocao } from '../models/termoAdocaoModel';
import { Pet } from '../models/petModel';
import { Usuario } from '../models/usuarioModel';
import { Cidade } from '../models/cidadeModel';
import { Estado } from '../models/estadoModel';
import PDFDocument from 'pdfkit';
import { emailService } from '../services/emailTermoAdocaoService';

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
  assinaturaDigital: string;
  observacoes?: string;
  // Flag para indicar se é atualização de nome
  isNameUpdate?: boolean;
}

export class TermoAdocaoController {
  /**
   * 📋 Listar todos os termos
   * GET /api/termos-compromisso
   */
  static async listar(req: Request, res: Response): Promise<void> {
    try {
      const { limit = 50, offset = 0, search } = req.query;

      const whereClause: any = {};

      if (search) {
        const { Op } = require('sequelize');
        whereClause[Op.or] = [
          { id: { [Op.like]: `%${search}%` } },
          { pet_nome: { [Op.like]: `%${search}%` } },
          { adotante_nome: { [Op.like]: `%${search}%` } },
          { doador_nome: { [Op.like]: `%${search}%` } },
        ];
      }

      const { count, rows: termos } = await TermoAdocao.findAndCountAll({
        where: whereClause,
        include: [
          { model: Pet, as: 'pet' },
          { model: Usuario, as: 'doador' },
          { model: Usuario, as: 'adotante' },
          // 🆕 Incluir relacionamentos de localização
          { model: Estado, as: 'estadoDoador' },
          { model: Cidade, as: 'cidadeDoador' },
          { model: Estado, as: 'estadoAdotante' },
          { model: Cidade, as: 'cidadeAdotante' },
        ],
        order: [['data_assinatura', 'DESC']],
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      });

      res.json({
        message: 'Termos listados com sucesso',
        data: termos,
        total: count,
        pagination: {
          limit: parseInt(limit as string),
          offset: parseInt(offset as string),
          totalPages: Math.ceil(count / parseInt(limit as string)),
        },
      });
    } catch (error: any) {
      res.status(500).json({
        error: 'Erro interno do servidor',
        message: error.message,
      });
    }
  }

  /**
   * 🆕 📝 Criar novo termo de compromisso OU atualizar termo existente com novo nome
   * POST /api/termos-compromisso
   */
  static async create(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const adotanteId = req.user?.id;

      if (!adotanteId) {
        res.status(401).json({
          error: 'Usuário não autenticado',
        });
        return;
      }

      const { petId, assinaturaDigital, observacoes, isNameUpdate = false }: CreateTermoBody = req.body;

      // Validações básicas
      if (!petId || !assinaturaDigital) {
        res.status(400).json({
          error: 'Dados obrigatórios não fornecidos',
          required: ['petId', 'assinaturaDigital'],
        });
        return;
      }

      // 🆕 Verificar se o pet existe e se não é do próprio usuário
      const pet = await Pet.findByPk(petId, {
        include: [
          {
            model: Usuario,
            as: 'responsavel',
            include: [
              { model: Cidade, as: 'cidade' },
              { model: Estado, as: 'estado' },
            ],
          },
        ],
      });

      if (!pet) {
        res.status(404).json({
          error: 'Pet não encontrado',
        });
        return;
      }

      if (pet.usuario_id === adotanteId) {
        res.status(400).json({
          error: 'Você não pode adotar seu próprio pet',
        });
        return;
      }

      // 🆕 BUSCAR DADOS COMPLETOS DO USUÁRIO ADOTANTE COM LOCALIZAÇÃO
      let dadosAdotante;
      try {
        dadosAdotante = await Usuario.findByPk(adotanteId, {
          include: [
            { model: Cidade, as: 'cidade' },
            { model: Estado, as: 'estado' },
          ],
        });

        if (!dadosAdotante) {
          res.status(404).json({
            error: 'Usuário adotante não encontrado',
          });
          return;
        }
      } catch (error) {
        res.status(500).json({
          error: 'Erro ao buscar dados do usuário adotante',
        });
        return;
      }

      // 🆕 VERIFICAR SE JÁ EXISTE TERMO PARA ATUALIZAÇÃO DE NOME
      const termoExistente = await TermoAdocao.findByPet(petId);

      if (termoExistente && isNameUpdate) {
        // Verificar se o termo pertence ao usuário atual
        if (termoExistente.adotante_id !== adotanteId) {
          res.status(403).json({
            error: 'Este termo não pertence a você',
          });
          return;
        }

        // 🆕 Atualizar termo existente com novos dados COMPLETOS
        const termoAtualizado = await TermoAdocao.atualizarComNovoNome(termoExistente.id, {
          adotante_id: adotanteId,
          adotante_nome: dadosAdotante.nome || assinaturaDigital,
          adotante_email: dadosAdotante.email,
          adotante_telefone: dadosAdotante.telefone,
          adotante_cpf: dadosAdotante.cpf,
          adotante_cidade_id: dadosAdotante.cidade_id,
          adotante_estado_id: dadosAdotante.estado_id,
          assinatura_digital: assinaturaDigital,
          observacoes: observacoes,
        });

        // Buscar termo completo para resposta
        const termoCompleto = await TermoAdocao.findByPet(petId);

        // 🆕 Enviar email personalizado para AMBOS (não bloqueia a resposta)
        emailService.enviarTermoPDF(termoCompleto!).catch((error) => {});

        res.status(200).json({
          message: 'Termo de compromisso atualizado com sucesso (novo nome)',
          data: termoCompleto,
          updated: true,
        });
        return;
      }

      // LÓGICA ORIGINAL - CRIAR NOVO TERMO
      if (termoExistente && !isNameUpdate) {
        res.status(409).json({
          error: 'Já existe um termo de compromisso para este pet',
          data: termoExistente,
        });
        return;
      }

      // Criar termo usando o método simplificado
      const novoTermo = await TermoAdocao.criarComDados({
        pet_id: petId,
        adotante_id: adotanteId,
        assinatura_digital: assinaturaDigital,
        observacoes: observacoes,
        isNameUpdate,
      });

      // Buscar termo completo para resposta
      const termoCompleto = await TermoAdocao.findByPet(petId);

      res.status(201).json({
        message: 'Termo de compromisso criado com sucesso',
        data: termoCompleto,
        updated: false,
      });
    } catch (error: any) {
      let statusCode = 500;
      let errorMessage = 'Erro interno do servidor';

      if (error.message.includes('Já existe um termo')) {
        statusCode = 409;
        errorMessage = 'Já existe um termo de compromisso para este pet';
      } else if (error.message.includes('não pode adotar seu próprio pet')) {
        statusCode = 400;
        errorMessage = 'Você não pode adotar seu próprio pet';
      } else if (error.message.includes('Pet não encontrado')) {
        statusCode = 404;
        errorMessage = 'Pet não encontrado';
      }

      res.status(statusCode).json({
        error: errorMessage,
        message: error.message,
      });
    }
  }

  /**
   * 📄 Buscar termo por ID
   * GET /api/termos-compromisso/:id
   */
  static async buscarPorId(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const termo = await TermoAdocao.findOne({
        where: { id: id },
        include: [
          { model: Pet, as: 'pet' },
          { model: Usuario, as: 'doador' },
          { model: Usuario, as: 'adotante' },
          // 🆕 Incluir relacionamentos de localização
          { model: Estado, as: 'estadoDoador' },
          { model: Cidade, as: 'cidadeDoador' },
          { model: Estado, as: 'estadoAdotante' },
          { model: Cidade, as: 'cidadeAdotante' },
        ],
      });

      if (!termo) {
        res.status(404).json({
          error: 'Termo não encontrado',
        });
        return;
      }

      res.json({
        message: 'Termo encontrado',
        data: termo,
      });
    } catch (error: any) {
      res.status(500).json({
        error: 'Erro interno do servidor',
        message: error.message,
      });
    }
  }

  /**
   * 🔍 Buscar termo por pet (COM VERIFICAÇÃO DE NOME ATUALIZADO)
   * GET /api/termos-compromisso/pet/:petId
   */
  static async buscarPorPet(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { petId } = req.params;
      const usuarioId = req.user?.id;

      const termo = await TermoAdocao.findByPet(parseInt(petId));

      if (!termo) {
        res.status(404).json({
          error: 'Termo não encontrado para este pet',
          data: null,
        });
        return;
      }

      // SE USUÁRIO ESTÁ LOGADO, VERIFICAR SE NOME MUDOU
      let nomeDesatualizado = false;

      if (usuarioId && termo.adotante_id === usuarioId) {
        try {
          // 🆕 Buscar dados atuais do usuário COM localização
          const dadosUsuarioAtual = await Usuario.findByPk(usuarioId, {
            include: [
              { model: Cidade, as: 'cidade' },
              { model: Estado, as: 'estado' },
            ],
          });

          if (dadosUsuarioAtual) {
            const nomeAtualUsuario = dadosUsuarioAtual.nome || '';
            const nomeNoTermo = termo.adotante_nome || '';

            if (nomeAtualUsuario !== nomeNoTermo) {
              nomeDesatualizado = true;
            }
          }
        } catch (error) {}
      }

      res.json({
        message: 'Termo encontrado',
        data: {
          ...termo.toJSON(),
          nomeDesatualizado,
          // 🆕 Adicionar informações de localização formatadas
          localizacaoDoador: termo.getLocalizacaoDoador(),
          localizacaoAdotante: termo.getLocalizacaoAdotante(),
        },
      });
    } catch (error: any) {
      res.status(500).json({
        error: 'Erro interno do servidor',
        message: error.message,
      });
    }
  }

  /**
   * ✅ VERIFICAR SE USUÁRIO PODE ADOTAR PET (COM VERIFICAÇÃO DE NOME)
   * GET /api/termos-compromisso/pode-adotar/:petId
   */
  static async podeAdotar(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { petId } = req.params;
      const usuarioId = req.user?.id;

      if (!usuarioId) {
        res.status(401).json({
          error: 'Usuário não autenticado',
          message: 'Token de acesso inválido ou expirado',
        });
        return;
      }

      // Verificar se pet existe
      const pet = await Pet.findByPk(petId);
      if (!pet) {
        res.status(404).json({
          error: 'Pet não encontrado',
        });
        return;
      }

      // Verificar se não é o próprio pet do usuário
      if (pet.usuario_id === usuarioId) {
        res.status(200).json({
          message: 'Verificação concluída',
          data: {
            podeAdotar: false,
            temTermo: false,
            nomeDesatualizado: false,
            motivo: 'proprio_pet',
          },
        });
        return;
      }

      // 🆕 BUSCAR DADOS ATUAIS DO USUÁRIO COM LOCALIZAÇÃO
      let dadosUsuarioAtual;
      try {
        dadosUsuarioAtual = await Usuario.findByPk(usuarioId, {
          include: [
            { model: Cidade, as: 'cidade' },
            { model: Estado, as: 'estado' },
          ],
        });

        if (!dadosUsuarioAtual) {
          res.status(200).json({
            message: 'Usuário não encontrado',
            data: {
              podeAdotar: false,
              temTermo: false,
              nomeDesatualizado: false,
            },
          });
          return;
        }
      } catch (error) {
        res.status(200).json({
          message: 'Erro ao buscar dados do usuário',
          data: {
            podeAdotar: false,
            temTermo: false,
            nomeDesatualizado: false,
          },
        });
        return;
      }

      // Verificar se já existe termo
      let podeAdotar = false;
      let temTermo = false;
      let nomeDesatualizado = false;

      try {
        const termo = await TermoAdocao.findByPet(parseInt(petId));

        if (termo && termo.adotante_id === usuarioId) {
          temTermo = true;

          // VERIFICAR SE NOME NO TERMO É DIFERENTE DO NOME ATUAL
          const nomeAtualUsuario = dadosUsuarioAtual.nome || '';
          const nomeNoTermo = termo.adotante_nome || '';

          if (nomeAtualUsuario !== nomeNoTermo) {
            // Nome foi alterado - precisa atualizar termo
            nomeDesatualizado = true;
            podeAdotar = false;
          } else {
            // Nome está igual - pode adotar normalmente
            podeAdotar = true;
          }
        } else if (termo && termo.adotante_id !== usuarioId) {
          // Termo existe mas é de outro usuário
          temTermo = true;
          podeAdotar = false;
        } else {
          // Não tem termo
          podeAdotar = true;
          temTermo = false;
        }
      } catch (error: any) {
        podeAdotar = false;
        temTermo = false;
        nomeDesatualizado = false;
      }

      res.status(200).json({
        message: 'Verificação concluída',
        data: {
          podeAdotar,
          temTermo,
          nomeDesatualizado,
        },
      });
    } catch (error: any) {
      res.status(200).json({
        message: 'Erro na verificação',
        data: {
          podeAdotar: false,
          temTermo: false,
          nomeDesatualizado: false,
        },
      });
    }
  }

  /**
   * 👤 Buscar termos como doador
   * GET /api/termos-compromisso/meus-doacoes
   */
  static async meusDoacoes(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const usuarioId = req.user?.id;

      if (!usuarioId) {
        res.status(401).json({
          error: 'Usuário não autenticado',
        });
        return;
      }

      const termos = await TermoAdocao.findByDoador(usuarioId);

      res.json({
        message: 'Pets doados encontrados',
        data: termos,
        total: termos.length,
      });
    } catch (error: any) {
      res.status(500).json({
        error: 'Erro interno do servidor',
        message: error.message,
      });
    }
  }

  /**
   * 🏠 Buscar termos como adotante
   * GET /api/termos-compromisso/minhas-adocoes
   */
  static async minhasAdocoes(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const usuarioId = req.user?.id;

      if (!usuarioId) {
        res.status(401).json({
          error: 'Usuário não autenticado',
        });
        return;
      }

      const termos = await TermoAdocao.findByAdotante(usuarioId);

      res.json({
        message: 'Pets adotados encontrados',
        data: termos,
        total: termos.length,
      });
    } catch (error: any) {
      res.status(500).json({
        error: 'Erro interno do servidor',
        message: error.message,
      });
    }
  }

  /**
   * 📊 Estatísticas gerais
   * GET /api/termos-compromisso/stats
   */
  static async stats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await TermoAdocao.contarTermos();

      res.json({
        message: 'Estatísticas obtidas',
        data: stats,
      });
    } catch (error: any) {
      res.status(500).json({
        error: 'Erro interno do servidor',
        message: error.message,
      });
    }
  }

  /**
   * 📱 Gerar PDF do termo (mantido para casos específicos)
   * GET /api/termos-compromisso/:id/pdf
   */
  static async gerarPDF(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const termo = await TermoAdocao.findOne({
        where: { id: id },
        include: [
          { model: Pet, as: 'pet' },
          { model: Usuario, as: 'doador' },
          { model: Usuario, as: 'adotante' },
          // 🆕 Incluir relacionamentos de localização
          { model: Estado, as: 'estadoDoador' },
          { model: Cidade, as: 'cidadeDoador' },
          { model: Estado, as: 'estadoAdotante' },
          { model: Cidade, as: 'cidadeAdotante' },
        ],
      });

      if (!termo) {
        res.status(404).json({
          error: 'Termo não encontrado',
        });
        return;
      }

      // Configurar headers
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="termo_${id}.pdf"`);

      // Criar PDF
      const doc = new PDFDocument();
      doc.pipe(res);

      // Gerar conteúdo
      TermoAdocaoController.gerarConteudoPDF(doc, termo);

      doc.end();
    } catch (error: any) {
      res.status(500).json({
        error: 'Erro ao gerar PDF',
        message: error.message,
      });
    }
  }

  /**
   * 🆕 📧 Enviar termo por email PARA AMBOS (doador e adotante)
   * POST /api/termos-compromisso/:id/enviar-email
   */
  static async enviarPorEmail(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Buscar termo completo COM relacionamentos de localização
      const termo = await TermoAdocao.findOne({
        where: { id: id },
        include: [
          { model: Pet, as: 'pet' },
          { model: Usuario, as: 'doador' },
          { model: Usuario, as: 'adotante' },
          // 🆕 Incluir relacionamentos de localização
          { model: Estado, as: 'estadoDoador' },
          { model: Cidade, as: 'cidadeDoador' },
          { model: Estado, as: 'estadoAdotante' },
          { model: Cidade, as: 'cidadeAdotante' },
        ],
      });

      if (!termo) {
        res.status(404).json({
          error: 'Termo não encontrado',
        });
        return;
      }

      // 🆕 Verificar se ambos os emails estão disponíveis
      if (!termo.doador_email || !termo.adotante_email) {
        res.status(400).json({
          error: 'Emails não disponíveis',
          details: {
            doadorEmail: termo.doador_email ? 'Disponível' : 'Não encontrado',
            adotanteEmail: termo.adotante_email ? 'Disponível' : 'Não encontrado',
          },
        });
        return;
      }

      // 🆕 Enviar email personalizado para AMBOS
      await emailService.enviarTermoPDF(termo);

      res.json({
        message: 'Termo enviado por email com sucesso para ambos os usuários',
        data: {
          termoId: id,
          destinatarios: {
            doador: termo.doador_email,
            adotante: termo.adotante_email,
          },
          petNome: termo.pet_nome,
          dataEnvio: new Date().toISOString(),
        },
      });
    } catch (error: any) {
      let errorMessage = 'Erro ao enviar emails';

      if (error.message.includes('Falha ao enviar email')) {
        errorMessage = 'Falha no envio dos emails. Verifique os endereços de email e tente novamente.';
      } else if (error.message.includes('Emails não disponíveis')) {
        errorMessage = 'Um ou ambos os emails não estão disponíveis no sistema.';
      }

      res.status(500).json({
        error: errorMessage,
        message: error.message,
      });
    }
  }

  /**
   * ✅ Validar integridade do termo
   * GET /api/termos-compromisso/:id/validate
   */
  static async validar(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const termo = await TermoAdocao.findOne({
        where: { id: id },
      });

      if (!termo) {
        res.status(404).json({
          error: 'Termo não encontrado',
        });
        return;
      }

      const integridadeOk = termo.verificarIntegridade();

      res.json({
        message: 'Validação concluída',
        data: {
          integridadeOk,
          dataAssinatura: termo.data_assinatura,
          hashDocumento: termo.hash_documento,
        },
      });
    } catch (error: any) {
      res.status(500).json({
        error: 'Erro interno do servidor',
        message: error.message,
      });
    }
  }

  // === MÉTODO AUXILIAR PARA PDF COM LOCALIZAÇÃO ===

  /**
   * 🆕 Método auxiliar para formatar telefone
   */
  private static formatTelefone(telefone: string | undefined): string {
    if (!telefone) return 'Não informado';

    const numbers = telefone.replace(/\D/g, '');

    if (!numbers) return 'Não informado';

    if (numbers.length === 11) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
    } else if (numbers.length === 10) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`;
    } else if (numbers.length === 13 && numbers.startsWith('55')) {
      return `+55 (${numbers.slice(2, 4)}) ${numbers.slice(4, 9)}-${numbers.slice(9)}`;
    } else if (numbers.length >= 8) {
      if (numbers.length === 8) {
        return `${numbers.slice(0, 4)}-${numbers.slice(4)}`;
      } else if (numbers.length === 9) {
        return `${numbers.slice(0, 5)}-${numbers.slice(5)}`;
      }
    }

    return numbers.replace(/(\d{4})(?=\d)/g, '$1-');
  }

  /**
   * 🆕 Gerar conteúdo do PDF COM informações de localização
   */
  private static gerarConteudoPDF(doc: PDFKit.PDFDocument, termo: TermoAdocao): void {
    const dataFormatada = new Date(termo.data_assinatura).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    let yPosition = 50;
    const marginBottom = 70;
    const pageHeight = doc.page.height - marginBottom;

    // Cabeçalho
    doc.fontSize(18).font('Helvetica-Bold').text('TERMO DE COMPROMISSO DE ADOÇÃO', 0, yPosition, { align: 'center' });

    yPosition += 25;
    doc
      .fontSize(10)
      .font('Helvetica')
      .text(`Documento ID: ${termo.id} | Data: ${dataFormatada}`, 0, yPosition, { align: 'center' });

    yPosition += 30;

    // Dados do Pet
    doc.fontSize(12).font('Helvetica-Bold').text('DADOS DO PET:', 50, yPosition);
    yPosition += 15;

    doc
      .fontSize(10)
      .font('Helvetica')
      .text(`Nome: ${termo.pet_nome} | Espécie: ${termo.pet_especie_nome}`, 50, yPosition);
    yPosition += 12;
    doc.text(
      `Raça: ${termo.pet_raca_nome} | Sexo: ${termo.pet_sexo_nome} | Idade: ${termo.pet_idade} anos`,
      50,
      yPosition
    );

    if (termo.pet_motivo_doacao) {
      yPosition += 12;
      doc.text(`Motivo da Doação: ${termo.pet_motivo_doacao}`, 50, yPosition);
    }

    yPosition += 20;

    // 🆕 Dados do Doador COM localização
    doc.fontSize(12).font('Helvetica-Bold').text('DADOS DO DOADOR:', 50, yPosition);
    yPosition += 15;

    doc.fontSize(10).font('Helvetica').text(`Nome: ${termo.doador_nome}`, 50, yPosition);
    yPosition += 12;
    doc.text(`Email: ${termo.doador_email}`, 50, yPosition);
    yPosition += 12;
    doc.text(`Telefone: ${this.formatTelefone(termo.doador_telefone)}`, 50, yPosition);
    yPosition += 12;
    doc.text(`Localização: ${termo.getLocalizacaoDoador()}`, 50, yPosition);

    yPosition += 20;

    // 🆕 Dados do Adotante COM localização
    doc.fontSize(12).font('Helvetica-Bold').text('DADOS DO ADOTANTE:', 50, yPosition);
    yPosition += 15;

    doc.fontSize(10).font('Helvetica').text(`Nome: ${termo.adotante_nome}`, 50, yPosition);
    yPosition += 12;
    doc.text(`Email: ${termo.adotante_email}`, 50, yPosition);
    yPosition += 12;
    doc.text(`Telefone: ${this.formatTelefone(termo.adotante_telefone)}`, 50, yPosition);
    yPosition += 12;
    doc.text(`Localização: ${termo.getLocalizacaoAdotante()}`, 50, yPosition);

    if (termo.adotante_cpf) {
      yPosition += 12;
      doc.text(`CPF: ${termo.adotante_cpf}`, 50, yPosition);
    }

    yPosition += 20;

    // Verificar se precisa de nova página
    if (yPosition > pageHeight - 150) {
      doc.addPage();
      yPosition = 50;
    }

    // Compromissos do Adotante
    doc.fontSize(12).font('Helvetica-Bold').text('COMPROMISSOS DO ADOTANTE:', 50, yPosition);

    yPosition += 15;

    const compromissos = [
      'Proporcionar cuidados veterinários adequados ao pet.',
      'Oferecer alimentação adequada e de qualidade.',
      'Providenciar abrigo seguro e confortável.',
      'Não abandonar, maltratar ou submeter o animal a maus-tratos.',
      'Entrar em contato com o doador antes de repassar a terceiros.',
      'Permitir visitas do doador mediante agendamento prévio.',
      'Informar mudanças de endereço ou contato.',
    ];

    doc.fontSize(9).font('Helvetica');
    compromissos.forEach((compromisso, index) => {
      if (yPosition > pageHeight - 100) {
        doc.addPage();
        yPosition = 50;
      }
      doc.text(`${index + 1}. ${compromisso}`, 50, yPosition, { width: 500 });
      yPosition += 11;
    });

    yPosition += 10;

    // Observações
    if (termo.observacoes) {
      const observacoesHeight = Math.min(80, termo.observacoes.length / 8 + 30);
      if (yPosition + observacoesHeight > pageHeight - 100) {
        doc.addPage();
        yPosition = 50;
      }

      doc.fontSize(12).font('Helvetica-Bold').text('OBSERVAÇÕES:', 50, yPosition);
      yPosition += 15;
      doc.fontSize(10).font('Helvetica').text(termo.observacoes, 50, yPosition, { width: 500 });
      yPosition += observacoesHeight - 30;
    }

    // Verificar espaço para assinatura
    if (yPosition + 140 > pageHeight) {
      doc.addPage();
      yPosition = 50;
    }

    yPosition += 15;

    // Assinatura
    doc.fontSize(12).font('Helvetica-Bold').text('ASSINATURA DIGITAL:', 50, yPosition);
    yPosition += 15;
    doc.fontSize(10).font('Helvetica').text(`Assinatura: ${termo.assinatura_digital}`, 50, yPosition);
    yPosition += 12;
    doc.text(`Data: ${dataFormatada}`, 50, yPosition);
    yPosition += 12;
    doc.text(`Hash: ${termo.hash_documento}`, 50, yPosition);

    yPosition += 30;

    // Declaração de validade
    doc
      .fontSize(10)
      .font('Helvetica-Oblique')
      .text(
        'Este documento foi assinado digitalmente e possui validade legal conforme a legislação vigente.',
        50,
        yPosition,
        { width: 500, align: 'center' }
      );

    yPosition += 30;

    // Rodapé
    doc
      .fontSize(8)
      .font('Helvetica')
      .text('Este documento foi gerado digitalmente pelo Petz_Up - Plataforma de Adoção de Pets', 50, yPosition, {
        width: 500,
        align: 'center',
      });
  }
  // Adicione este método no TermoAdocaoController (dentro da classe)

  /**
   * 🗑️ Deletar termo de compromisso
   * DELETE /api/termos-compromisso/:id
   */
  static async deletar(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const usuarioId = req.user?.id;

      if (!usuarioId) {
        res.status(401).json({
          error: 'Usuário não autenticado',
        });
        return;
      }

      // Buscar termo com todas as informações
      const termo = await TermoAdocao.findOne({
        where: { id: id },
        include: [
          { model: Pet, as: 'pet' },
          { model: Usuario, as: 'doador' },
          { model: Usuario, as: 'adotante' },
        ],
      });

      if (!termo) {
        res.status(404).json({
          error: 'Termo não encontrado',
        });
        return;
      }

      // Verificar se o usuário tem permissão para deletar
      // Pode deletar se for o doador OU o adotante
      const temPermissao = termo.doador_id === usuarioId || termo.adotante_id === usuarioId;

      if (!temPermissao) {
        res.status(403).json({
          error: 'Você não tem permissão para deletar este termo',
          message: 'Apenas o doador ou adotante podem deletar o termo de compromisso',
        });
        return;
      }

      // Salvar informações para log antes de deletar
      const petNome = termo.pet_nome;
      const doadorNome = termo.doador_nome;
      const adotanteNome = termo.adotante_nome;

      // Deletar o termo
      await termo.destroy();

      res.json({
        message: 'Termo de compromisso deletado com sucesso',
        data: {
          termoId: id,
          petNome: petNome,
          deletadoPor: usuarioId === termo.doador_id ? 'doador' : 'adotante',
          dataDelecao: new Date().toISOString(),
        },
      });
    } catch (error: any) {
      res.status(500).json({
        error: 'Erro interno do servidor',
        message: error.message,
      });
    }
  }

  /**
   * 🗑️ Deletar termo por pet ID (método auxiliar)
   * DELETE /api/termos-compromisso/pet/:petId
   */
  static async deletarPorPet(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { petId } = req.params;
      const usuarioId = req.user?.id;

      if (!usuarioId) {
        res.status(401).json({
          error: 'Usuário não autenticado',
        });
        return;
      }

      // Buscar termo pelo pet
      const termo = await TermoAdocao.findByPet(parseInt(petId));

      if (!termo) {
        res.status(404).json({
          error: 'Termo não encontrado para este pet',
          data: {
            temTermo: false,
            petId: petId,
          },
        });
        return;
      }

      // Verificar permissão
      const temPermissao = termo.doador_id === usuarioId || termo.adotante_id === usuarioId;

      if (!temPermissao) {
        res.status(403).json({
          error: 'Você não tem permissão para deletar este termo',
        });
        return;
      }

      // Deletar termo
      await TermoAdocao.destroy({
        where: { id: termo.id },
      });

      res.json({
        message: 'Termo deletado com sucesso',
        data: {
          termoId: termo.id,
          petId: petId,
          petNome: termo.pet_nome,
          deletadoPor: usuarioId === termo.doador_id ? 'doador' : 'adotante',
        },
      });
    } catch (error: any) {
      res.status(500).json({
        error: 'Erro interno do servidor',
        message: error.message,
      });
    }
  }
}
