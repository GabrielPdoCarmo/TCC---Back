// controllers/termosCompromissoController.ts - Atualizado com verificação de nome

import { Request, Response } from 'express';
import { TermoCompromisso } from '../models/termosCompromissoModel';
import { Pet } from '../models/petModel';
import { Usuario } from '../models/usuarioModel';
import PDFDocument from 'pdfkit';
import { emailService } from '../services/emailService';

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
  // 🆕 Flag para indicar se é atualização de nome
  isNameUpdate?: boolean;
}

export class TermosCompromissoController {
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

      const { count, rows: termos } = await TermoCompromisso.findAndCountAll({
        where: whereClause,
        include: [
          { model: Pet, as: 'pet' },
          { model: Usuario, as: 'doador' },
          { model: Usuario, as: 'adotante' },
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
      console.error('Erro ao listar termos:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        message: error.message,
      });
    }
  }

  /**
   * 📝 Criar novo termo de compromisso OU atualizar termo existente com novo nome
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

      const { 
        petId, 
        assinaturaDigital, 
        observacoes,
        isNameUpdate = false // 🆕 Flag para indicar atualização de nome
      }: CreateTermoBody = req.body;

      // Validações básicas
      if (!petId || !assinaturaDigital) {
        res.status(400).json({
          error: 'Dados obrigatórios não fornecidos',
          required: ['petId', 'assinaturaDigital'],
        });
        return;
      }

      // Verificar se o pet existe e se não é do próprio usuário
      const pet = await Pet.findByPk(petId);
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

      // 🆕 BUSCAR DADOS COMPLETOS DO USUÁRIO
      let dadosUsuario;
      try {
        dadosUsuario = await Usuario.findByPk(adotanteId);
        if (!dadosUsuario) {
          res.status(404).json({
            error: 'Usuário não encontrado',
          });
          return;
        }
      } catch (error) {
        console.error('❌ Erro ao buscar dados do usuário:', error);
        res.status(500).json({
          error: 'Erro ao buscar dados do usuário',
        });
        return;
      }

      // 🆕 VERIFICAR SE JÁ EXISTE TERMO PARA ATUALIZAÇÃO DE NOME
      const termoExistente = await TermoCompromisso.findByPet(petId);

      if (termoExistente && isNameUpdate) {
        console.log('🔄 Atualizando termo existente com novo nome do usuário...');
        
        // Verificar se o termo pertence ao usuário atual
        if (termoExistente.adotante_id !== adotanteId) {
          res.status(403).json({
            error: 'Este termo não pertence a você',
          });
          return;
        }

        // Atualizar termo existente com novos dados
        const termoAtualizado = await TermoCompromisso.atualizarComNovoNome(termoExistente.id, {
          adotante_id: adotanteId,
          adotante_nome: dadosUsuario.nome || assinaturaDigital,
          adotante_email: dadosUsuario.email,
          adotante_telefone: dadosUsuario.telefone,
          adotante_cpf: dadosUsuario.cpf,
          adotante_cidade_id: dadosUsuario.cidade_id,
          adotante_estado_id: dadosUsuario.estado_id,
          assinatura_digital: assinaturaDigital,
          observacoes: observacoes,
        });

        // Buscar termo completo para resposta
        const termoCompleto = await TermoCompromisso.findByPet(petId);

        // Enviar email com novo PDF (não bloqueia a resposta)
        emailService
          .enviarTermoPDF(termoCompleto!)
          .catch((error) => console.error('Erro ao enviar email com termo atualizado:', error));

        res.status(200).json({
          message: 'Termo de compromisso atualizado com sucesso (novo nome)',
          data: termoCompleto,
          updated: true,
        });
        return;
      }

      // 🔄 LÓGICA ORIGINAL - CRIAR NOVO TERMO
      if (termoExistente && !isNameUpdate) {
        res.status(409).json({
          error: 'Já existe um termo de compromisso para este pet',
          data: termoExistente,
        });
        return;
      }

      // Criar termo usando o método simplificado
      const novoTermo = await TermoCompromisso.criarComDados({
        pet_id: petId,
        adotante_id: adotanteId,
        assinatura_digital: assinaturaDigital,
        observacoes: observacoes,
        isNameUpdate, // 🆕 Passar flag para o modelo
      });

      // 🆕 Buscar termo completo para resposta
      const termoCompleto = await TermoCompromisso.findByPet(petId);

      res.status(201).json({
        message: 'Termo de compromisso criado com sucesso',
        data: termoCompleto,
        updated: false,
      });
    } catch (error: any) {
      console.error('Erro ao criar/atualizar termo:', error);

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

      const termo = await TermoCompromisso.findOne({
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

      res.json({
        message: 'Termo encontrado',
        data: termo,
      });
    } catch (error: any) {
      console.error('Erro ao buscar termo:', error);
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

      const termo = await TermoCompromisso.findByPet(parseInt(petId));

      if (!termo) {
        res.status(404).json({
          error: 'Termo não encontrado para este pet',
          data: null,
        });
        return;
      }

      // 🆕 SE USUÁRIO ESTÁ LOGADO, VERIFICAR SE NOME MUDOU
      let nomeDesatualizado = false;

      if (usuarioId && termo.adotante_id === usuarioId) {
        try {
          // Buscar dados atuais do usuário
          const dadosUsuarioAtual = await Usuario.findByPk(usuarioId);
          
          if (dadosUsuarioAtual) {
            const nomeAtualUsuario = dadosUsuarioAtual.nome || '';
            const nomeNoTermo = termo.adotante_nome || '';
            
            if (nomeAtualUsuario !== nomeNoTermo) {
              nomeDesatualizado = true;
              console.log(`⚠️ Nome desatualizado no termo! Usuário ${usuarioId} - Atual: "${nomeAtualUsuario}" vs Termo: "${nomeNoTermo}"`);
            }
          }
        } catch (error) {
          console.error('❌ Erro ao verificar nome do usuário:', error);
        }
      }

      res.json({
        message: 'Termo encontrado',
        data: {
          ...termo.toJSON(),
          nomeDesatualizado, // 🆕 Flag indicando se nome mudou
        },
      });
    } catch (error: any) {
      console.error('Erro ao buscar termo por pet:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        message: error.message,
      });
    }
  }

  /**
   * ✅ 🆕 VERIFICAR SE USUÁRIO PODE ADOTAR PET (COM VERIFICAÇÃO DE NOME)
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

      console.log(`🔍 Verificando se usuário ${usuarioId} pode adotar pet ${petId}...`);

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

      // 🆕 BUSCAR DADOS ATUAIS DO USUÁRIO
      let dadosUsuarioAtual;
      try {
        dadosUsuarioAtual = await Usuario.findByPk(usuarioId);
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
        console.error('❌ Erro ao buscar dados atuais do usuário:', error);
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
        const termo = await TermoCompromisso.findByPet(parseInt(petId));
        
        if (termo && termo.adotante_id === usuarioId) {
          temTermo = true;
          
          // 🆕 VERIFICAR SE NOME NO TERMO É DIFERENTE DO NOME ATUAL
          const nomeAtualUsuario = dadosUsuarioAtual.nome || '';
          const nomeNoTermo = termo.adotante_nome || '';
          
          console.log(`📋 Comparando nomes:`, {
            nomeAtual: nomeAtualUsuario,
            nomeNoTermo: nomeNoTermo,
            iguais: nomeAtualUsuario === nomeNoTermo
          });

          if (nomeAtualUsuario !== nomeNoTermo) {
            // Nome foi alterado - precisa atualizar termo
            nomeDesatualizado = true;
            podeAdotar = false;
            console.log(`⚠️ Nome desatualizado! Usuário ${usuarioId} precisa atualizar termo`);
          } else {
            // Nome está igual - pode adotar normalmente
            podeAdotar = true;
            console.log(`✅ Nome atualizado! Usuário ${usuarioId} pode adotar`);
          }
        } else if (termo && termo.adotante_id !== usuarioId) {
          // Termo existe mas é de outro usuário
          temTermo = true;
          podeAdotar = false;
          console.log(`ℹ️ Pet já tem termo de outro usuário`);
        } else {
          // Não tem termo
          podeAdotar = true;
          temTermo = false;
          console.log(`ℹ️ Pet não possui termo, usuário pode adotar`);
        }

      } catch (error: any) {
        console.error(`❌ Erro ao verificar termo do pet ${petId}:`, error);
        podeAdotar = false;
        temTermo = false;
        nomeDesatualizado = false;
      }

      res.status(200).json({
        message: 'Verificação concluída',
        data: {
          podeAdotar,
          temTermo,
          nomeDesatualizado, // 🆕 Indica se precisa atualizar por nome diferente
        },
      });
    } catch (error: any) {
      console.error('❌ Erro ao verificar se usuário pode adotar:', error);

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

      const termos = await TermoCompromisso.findByDoador(usuarioId);

      res.json({
        message: 'Pets doados encontrados',
        data: termos,
        total: termos.length,
      });
    } catch (error: any) {
      console.error('Erro ao buscar doações:', error);
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

      const termos = await TermoCompromisso.findByAdotante(usuarioId);

      res.json({
        message: 'Pets adotados encontrados',
        data: termos,
        total: termos.length,
      });
    } catch (error: any) {
      console.error('Erro ao buscar adoções:', error);
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
      const stats = await TermoCompromisso.contarTermos();

      res.json({
        message: 'Estatísticas obtidas',
        data: stats,
      });
    } catch (error: any) {
      console.error('Erro ao buscar estatísticas:', error);
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

      const termo = await TermoCompromisso.findOne({
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

      // Configurar headers
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="termo_${id}.pdf"`);

      // Criar PDF
      const doc = new PDFDocument();
      doc.pipe(res);

      // Gerar conteúdo
      TermosCompromissoController.gerarConteudoPDF(doc, termo);

      doc.end();
    } catch (error: any) {
      console.error('Erro ao gerar PDF:', error);
      res.status(500).json({
        error: 'Erro ao gerar PDF',
        message: error.message,
      });
    }
  }

  /**
   * 📧 🆕 Enviar termo por email
   * POST /api/termos-compromisso/:id/enviar-email
   */
  static async enviarPorEmail(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      console.log(`📧 Iniciando envio do termo ${id} por email...`);

      // Buscar termo completo
      const termo = await TermoCompromisso.findOne({
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

      // Verificar se tem email do adotante
      if (!termo.adotante_email) {
        res.status(400).json({
          error: 'Email do adotante não encontrado',
        });
        return;
      }

      // Enviar email com o termo
      await emailService.enviarTermoPDF(termo);

      console.log(`✅ Termo ${id} enviado por email para ${termo.adotante_email}`);

      res.json({
        message: 'Termo enviado por email com sucesso',
        data: {
          termoId: id,
          destinatario: termo.adotante_email,
          petNome: termo.pet_nome,
          dataEnvio: new Date().toISOString(),
        },
      });
    } catch (error: any) {
      console.error('❌ Erro ao enviar termo por email:', error);

      let errorMessage = 'Erro ao enviar email';

      if (error.message.includes('Falha ao enviar email')) {
        errorMessage = 'Falha no envio do email. Verifique o endereço de email e tente novamente.';
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

      const termo = await TermoCompromisso.findOne({
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
      console.error('Erro ao validar termo:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        message: error.message,
      });
    }
  }

  // === MÉTODO AUXILIAR PARA PDF ===

  private static gerarConteudoPDF(doc: PDFKit.PDFDocument, termo: TermoCompromisso): void {
    const dataFormatada = new Date(termo.data_assinatura).toLocaleDateString('pt-BR');

    // Cabeçalho
    doc.fontSize(20).font('Helvetica-Bold').text('TERMO DE COMPROMISSO DE ADOÇÃO', 0, 50, { align: 'center' });

    doc.fontSize(12).font('Helvetica').text(`Data: ${dataFormatada}`, 0, 90, { align: 'center' });

    // Dados do Pet
    doc.fontSize(14).font('Helvetica-Bold').text('DADOS DO PET:', 50, 150);

    doc
      .fontSize(12)
      .font('Helvetica')
      .text(`Nome: ${termo.pet_nome}`, 50, 170)
      .text(`Espécie: ${termo.pet_especie_nome}`, 50, 190)
      .text(`Raça: ${termo.pet_raca_nome}`, 50, 210)
      .text(`Sexo: ${termo.pet_sexo_nome}`, 50, 230)
      .text(`Idade: ${termo.pet_idade} anos`, 50, 250);

    if (termo.pet_motivo_doacao) {
      doc.text(`Motivo da Doação: ${termo.pet_motivo_doacao}`, 50, 270);
    }

    // Dados do Doador
    doc.fontSize(14).font('Helvetica-Bold').text('DADOS DO DOADOR:', 50, 310);

    doc
      .fontSize(12)
      .font('Helvetica')
      .text(`Nome: ${termo.doador_nome}`, 50, 330)
      .text(`Email: ${termo.doador_email}`, 50, 350);

    if (termo.doador_telefone) {
      doc.text(`Telefone: ${termo.doador_telefone}`, 50, 370);
    }

    // Dados do Adotante
    doc.fontSize(14).font('Helvetica-Bold').text('DADOS DO ADOTANTE:', 50, 410);

    doc
      .fontSize(12)
      .font('Helvetica')
      .text(`Nome: ${termo.adotante_nome}`, 50, 430)
      .text(`Email: ${termo.adotante_email}`, 50, 450);

    if (termo.adotante_telefone) {
      doc.text(`Telefone: ${termo.adotante_telefone}`, 50, 470);
    }

    if (termo.adotante_cpf) {
      doc.text(`CPF: ${termo.adotante_cpf}`, 50, 490);
    }

    // Nova página se necessário
    if (doc.y > 600) {
      doc.addPage();
    }

    // Compromissos do Adotante
    doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .text('COMPROMISSOS DO ADOTANTE:', 50, doc.y + 30);

    const compromissos = [
      'Proporcionar cuidados veterinários adequados ao pet.',
      'Oferecer alimentação adequada e de qualidade.',
      'Providenciar abrigo seguro e confortável.',
      'Não abandonar, maltratar ou submeter o animal a maus-tratos.',
      'Entrar em contato com o doador antes de repassar a terceiros.',
      'Permitir visitas do doador mediante agendamento prévio.',
      'Informar mudanças de endereço ou contato.',
    ];

    doc.fontSize(12).font('Helvetica');
    compromissos.forEach((compromisso, index) => {
      doc.text(`${index + 1}. ${compromisso}`, 50, doc.y + 15);
    });

    // Observações
    if (termo.observacoes) {
      doc
        .fontSize(14)
        .font('Helvetica-Bold')
        .text('OBSERVAÇÕES:', 50, doc.y + 30);

      doc
        .fontSize(12)
        .font('Helvetica')
        .text(termo.observacoes, 50, doc.y + 15, { width: 500 });
    }

    // Assinatura
    doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .text('ASSINATURA DIGITAL:', 50, doc.y + 30);

    doc
      .fontSize(12)
      .font('Helvetica')
      .text(`Assinatura: ${termo.assinatura_digital}`, 50, doc.y + 15)
      .text(`Data: ${dataFormatada}`, 50, doc.y + 10)
      .text(`Hash: ${termo.hash_documento}`, 50, doc.y + 10);

    // Rodapé
    doc
      .fontSize(10)
      .font('Helvetica')
      .text('Documento gerado digitalmente pelo App de Adoção de Pets', 0, doc.page.height - 50, {
        align: 'center',
      });
  }
}