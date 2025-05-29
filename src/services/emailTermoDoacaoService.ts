// services/emailTermoDoacaoService.ts - Serviço de Email para Termo de Doação

import nodemailer from 'nodemailer';
import PDFDocument from 'pdfkit';
import { TermoDoacao } from '../models/termoDoacaoModel';

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

export class EmailTermoDoacaoService {
  private transporter: nodemailer.Transporter;

  constructor() {
    // Configurar transporter com as credenciais
    const config: EmailConfig = {
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_SECURE === 'true', // false para 587, true para 465
      auth: {
        user: process.env.EMAIL_USER || 'petsup2005@gmail.com',
        pass: process.env.EMAIL_PASS || 'viwwohabadqfthjb',
      },
    };

    this.transporter = nodemailer.createTransport(config);

    // Verificar conexão
    this.transporter.verify((error, success) => {
      if (error) {
        console.error('❌ Erro na configuração do email:', error);
      } else {
        console.log('✅ Servidor de email configurado com sucesso');
      }
    });
  }

  /**
   * 📧 Enviar termo de doação por email
   */
  async enviarTermoDoacaoPDF(termo: TermoDoacao): Promise<void> {
    try {
      console.log('📧 Iniciando envio do termo de doação por email...');

      // Gerar PDF em buffer
      const pdfBuffer = await this.gerarPDFBuffer(termo);

      // Configurar email
      const mailOptions = {
        from: {
          name: 'PetSup - Adoção de Pets',
          address: process.env.EMAIL_USER || 'petsup2005@gmail.com',
        },
        to: termo.doador_email, // 📧 Para o doador
        subject: `Termo de Responsabilidade de Doação - ${termo.doador_nome}`,
        html: this.gerarHTMLEmail(termo),
        attachments: [
          {
            filename: `termo_doacao_${termo.doador_nome.replace(/\s+/g, '_')}_${termo.id}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf',
          },
        ],
      };

      // Enviar email
      const info = await this.transporter.sendMail(mailOptions);
      
      console.log('✅ Email enviado com sucesso:', info.messageId);
      console.log('📨 Destinatário:', termo.doador_email);

      // Marcar como enviado no banco
      termo.marcarPdfEnviado();
      await termo.save();

    } catch (error) {
      console.error('❌ Erro ao enviar email:', error);
      throw new Error('Falha ao enviar email com o termo de doação');
    }
  }

  /**
   * 📄 Gerar PDF em buffer
   */
  private async gerarPDFBuffer(termo: TermoDoacao): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument();
        const buffers: Buffer[] = [];

        doc.on('data', (chunk) => buffers.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', reject);

        // Gerar conteúdo do PDF
        this.gerarConteudoPDF(doc, termo);

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * 📝 Gerar conteúdo do PDF
   */
  private gerarConteudoPDF(doc: PDFKit.PDFDocument, termo: TermoDoacao): void {
    const dataFormatada = new Date(termo.data_assinatura).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    let yPosition = 50;

    // Cabeçalho
    doc
      .fontSize(20)
      .font('Helvetica-Bold')
      .text('TERMO DE RESPONSABILIDADE DE DOAÇÃO', 0, yPosition, { align: 'center' });

    yPosition += 30;
    doc
      .fontSize(12)
      .font('Helvetica')
      .text(`Documento ID: ${termo.id} | Data: ${dataFormatada}`, 0, yPosition, { align: 'center' });

    yPosition += 40;

    // Dados do Doador
    doc.fontSize(14).font('Helvetica-Bold').text('DADOS DO DOADOR:', 50, yPosition);
    yPosition += 20;

    doc
      .fontSize(11)
      .font('Helvetica')
      .text(`Nome Completo: ${termo.doador_nome}`, 50, yPosition);
    yPosition += 15;
    doc.text(`Email: ${termo.doador_email}`, 50, yPosition);
    
    if (termo.doador_telefone) {
      yPosition += 15;
      doc.text(`Telefone: ${termo.doador_telefone}`, 50, yPosition);
    }

    if (termo.doador_cpf) {
      yPosition += 15;
      doc.text(`CPF: ${termo.doador_cpf}`, 50, yPosition);
    }

    // Incluir dados de localização se disponíveis
    if (termo.estado?.nome || termo.cidade?.nome) {
      yPosition += 15;
      const localizacao = [termo.cidade?.nome, termo.estado?.nome].filter(Boolean).join(' - ');
      doc.text(`Localização: ${localizacao}`, 50, yPosition);
    }

    yPosition += 30;

    // Motivo da Doação
    doc.fontSize(14).font('Helvetica-Bold').text('MOTIVO DA DOAÇÃO:', 50, yPosition);
    yPosition += 20;

    doc
      .fontSize(11)
      .font('Helvetica')
      .text(termo.motivo_doacao, 50, yPosition, { width: 500, align: 'justify' });
    
    yPosition += Math.max(30, Math.ceil(termo.motivo_doacao.length / 80) * 15);

    // Condições de Adoção (se houver)
    if (termo.condicoes_adocao) {
      yPosition += 15;
      doc.fontSize(14).font('Helvetica-Bold').text('CONDIÇÕES PARA ADOÇÃO:', 50, yPosition);
      yPosition += 20;

      doc
        .fontSize(11)
        .font('Helvetica')
        .text(termo.condicoes_adocao, 50, yPosition, { width: 500, align: 'justify' });
      
      yPosition += Math.max(30, Math.ceil(termo.condicoes_adocao.length / 80) * 15);
    }

    // Verificar se precisa de nova página
    if (yPosition > 650) {
      doc.addPage();
      yPosition = 50;
    }

    // Compromissos e Responsabilidades
    doc.fontSize(14).font('Helvetica-Bold').text('COMPROMISSOS E RESPONSABILIDADES:', 50, yPosition);
    yPosition += 20;

    const compromissos = [
      'Confirmo que sou responsável legal pelos pets que cadastrar na plataforma.',
      'Autorizo visitas de potenciais adotantes mediante agendamento prévio.',
      'Aceito acompanhamento pós-adoção para garantir o bem-estar dos animais.',
      'Comprometo-me a fornecer informações verdadeiras sobre a saúde dos pets.',
      'Autorizo verificação de antecedentes dos potenciais adotantes.',
      'Comprometo-me a manter contato durante todo o processo de adoção.',
    ];

    doc.fontSize(10).font('Helvetica');
    compromissos.forEach((compromisso, index) => {
      const prefixo = termo.validarCompromissos() ? '✓' : '☐';
      doc.text(`${prefixo} ${compromisso}`, 50, yPosition, { width: 500 });
      yPosition += 18;
    });

    yPosition += 20;

    // Observações (se houver)
    if (termo.observacoes) {
      if (yPosition > 680) {
        doc.addPage();
        yPosition = 50;
      }

      doc.fontSize(14).font('Helvetica-Bold').text('OBSERVAÇÕES ADICIONAIS:', 50, yPosition);
      yPosition += 20;

      doc
        .fontSize(11)
        .font('Helvetica')
        .text(termo.observacoes, 50, yPosition, { width: 500, align: 'justify' });
      
      yPosition += Math.max(30, Math.ceil(termo.observacoes.length / 80) * 15);
    }

    // Verificar se precisa de nova página para assinatura
    if (yPosition > 650) {
      doc.addPage();
      yPosition = 50;
    }

    // Assinatura Digital
    yPosition += 20;
    doc.fontSize(14).font('Helvetica-Bold').text('ASSINATURA DIGITAL:', 50, yPosition);
    yPosition += 25;

    doc
      .fontSize(11)
      .font('Helvetica')
      .text(`Assinado digitalmente por: ${termo.assinatura_digital}`, 50, yPosition);
    yPosition += 15;
    doc.text(`Data e hora: ${dataFormatada}`, 50, yPosition);
    yPosition += 15;
    doc.text(`Hash do documento: ${termo.hash_documento}`, 50, yPosition);

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

    // Rodapé
    doc
      .fontSize(8)
      .font('Helvetica')
      .text(
        'Documento gerado automaticamente pelo PetSup - Sistema de Adoção Responsável',
        0,
        doc.page.height - 30,
        { align: 'center' }
      );
  }

  /**
   * 📧 Gerar HTML do email
   */
  private gerarHTMLEmail(termo: TermoDoacao): string {
    const dataFormatada = new Date(termo.data_assinatura).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const localizacao = [termo.cidade?.nome, termo.estado?.nome].filter(Boolean).join(' - ');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2E8B57; color: white; padding: 25px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .doador-info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2E8B57; }
          .compromissos { background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
          .highlight { color: #2E8B57; font-weight: bold; }
          .attachment-note { background: #e8f4fd; padding: 15px; border-radius: 8px; border: 1px solid #2E8B57; margin: 20px 0; }
          .check { color: #2E8B57; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🐾 Termo de Responsabilidade de Doação</h1>
            <p>Seu termo foi assinado com sucesso!</p>
          </div>
          
          <div class="content">
            <p>Olá <strong>${termo.doador_nome}</strong>,</p>
            
            <p>Seu termo de responsabilidade de doação foi processado e assinado digitalmente com sucesso! 🎉</p>
            
            <div class="doador-info">
              <h3>📋 Informações do Termo:</h3>
              <p><strong>Doador:</strong> ${termo.doador_nome}</p>
              <p><strong>Email:</strong> ${termo.doador_email}</p>
              ${termo.doador_telefone ? `<p><strong>Telefone:</strong> ${termo.doador_telefone}</p>` : ''}
              ${localizacao ? `<p><strong>Localização:</strong> ${localizacao}</p>` : ''}
              <p><strong>Data da Assinatura:</strong> ${dataFormatada}</p>
              <p><strong>ID do Documento:</strong> #${termo.id}</p>
            </div>

            <div class="compromissos">
              <h3>✅ Compromissos Assumidos:</h3>
              <p><span class="check">✓</span> Responsabilidade legal pelos pets cadastrados</p>
              <p><span class="check">✓</span> Autorização para visitas de adotantes</p>
              <p><span class="check">✓</span> Aceite de acompanhamento pós-adoção</p>
              <p><span class="check">✓</span> Fornecimento de informações verdadeiras sobre saúde</p>
              <p><span class="check">✓</span> Autorização para verificação de adotantes</p>
              <p><span class="check">✓</span> Manutenção de contato durante o processo</p>
            </div>

            <div class="attachment-note">
              <h3>📎 Documento Anexo</h3>
              <p>O termo de responsabilidade completo está anexado a este email em formato PDF. 
              Este documento serve como comprovante oficial e deve ser guardado com segurança.</p>
            </div>

            <h3>🎯 Agora você pode:</h3>
            <ul>
              <li><strong>Cadastrar seus pets</strong> na plataforma para doação</li>
              <li><strong>Gerenciar solicitações</strong> de adoção dos interessados</li>
              <li><strong>Acompanhar o processo</strong> até a adoção ser concluída</li>
              <li><strong>Manter contato</strong> com os adotantes conforme acordado</li>
            </ul>

            ${termo.motivo_doacao ? `
              <div style="background: #fff3cd; padding: 15px; border-radius: 8px; border: 1px solid #ffc107; margin: 20px 0;">
                <h3>📝 Motivo da Doação:</h3>
                <p>${termo.motivo_doacao}</p>
              </div>
            ` : ''}

            ${termo.condicoes_adocao ? `
              <div style="background: #d1ecf1; padding: 15px; border-radius: 8px; border: 1px solid #bee5eb; margin: 20px 0;">
                <h3>📋 Condições para Adoção:</h3>
                <p>${termo.condicoes_adocao}</p>
              </div>
            ` : ''}

            ${termo.observacoes ? `
              <div style="background: #f8d7da; padding: 15px; border-radius: 8px; border: 1px solid #f5c6cb; margin: 20px 0;">
                <h3>📝 Observações Adicionais:</h3>
                <p>${termo.observacoes}</p>
              </div>
            ` : ''}

            <p>Se você tiver alguma dúvida sobre o processo de doação ou precisar de suporte, não hesite em entrar em contato conosco.</p>
            
            <p>Obrigado por contribuir para a <span class="highlight">adoção responsável</span> de pets! 💚</p>
            
            <p>Com carinho,<br>
            <strong>Equipe PetSup</strong></p>
          </div>
          
          <div class="footer">
            <p>Este email foi enviado automaticamente pelo sistema PetSup</p>
            <p>Hash de verificação: ${termo.hash_documento}</p>
            <p>Para validar este documento, acesse: [URL_DO_SISTEMA]/termos-doacao/${termo.id}/validate</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * 📧 Enviar email de confirmação (sem PDF)
   */
  async enviarConfirmacaoTermo(termo: TermoDoacao): Promise<void> {
    try {
      const mailOptions = {
        from: {
          name: 'PetSup - Adoção de Pets',
          address: process.env.EMAIL_USER || 'petsup2005@gmail.com',
        },
        to: termo.doador_email,
        subject: `Confirmação - Termo de Doação Assinado`,
        html: this.gerarHTMLConfirmacao(termo),
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ Email de confirmação enviado:', info.messageId);
    } catch (error) {
      console.error('❌ Erro ao enviar email de confirmação:', error);
      throw error;
    }
  }

  /**
   * 📧 Gerar HTML para email de confirmação
   */
  private gerarHTMLConfirmacao(termo: TermoDoacao): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2E8B57; color: white; padding: 20px; text-align: center; border-radius: 8px; }
          .content { padding: 30px 0; }
          .success { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; padding: 15px; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Termo Assinado com Sucesso!</h1>
          </div>
          
          <div class="content">
            <p>Olá <strong>${termo.doador_nome}</strong>,</p>
            
            <div class="success">
              <strong>✅ Seu termo de responsabilidade foi assinado com sucesso!</strong><br>
              Agora você pode cadastrar seus pets para doação.
            </div>
            
            <p>Em breve você receberá outro email com o documento PDF completo.</p>
            
            <p>Obrigado por fazer parte da nossa comunidade! 🐾</p>
            
            <p><strong>Equipe PetSup</strong></p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * 📧 Enviar email simples (para outros casos)
   */
  async enviarEmail(
    destinatario: string,
    assunto: string,
    conteudoHTML: string,
    anexos?: Array<{ filename: string; content: Buffer; contentType: string }>
  ): Promise<void> {
    try {
      const mailOptions = {
        from: {
          name: 'PetSup - Adoção de Pets',
          address: process.env.EMAIL_USER || 'petsup2005@gmail.com',
        },
        to: destinatario,
        subject: assunto,
        html: conteudoHTML,
        attachments: anexos,
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ Email enviado:', info.messageId);
    } catch (error) {
      console.error('❌ Erro ao enviar email:', error);
      throw error;
    }
  }
}

// Exportar instância singleton
export const emailTermoDoacaoService = new EmailTermoDoacaoService();