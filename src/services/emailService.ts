// services/emailService.ts - Serviço de Email

import nodemailer from 'nodemailer';
import PDFDocument from 'pdfkit';
import { TermoCompromisso } from '../models/termosCompromissoModel';

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

export class EmailService {
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
   * 📧 Enviar termo de compromisso por email
   */
  async enviarTermoPDF(termo: TermoCompromisso): Promise<void> {
    try {
      console.log('📧 Iniciando envio do termo por email...');

      // Gerar PDF em buffer
      const pdfBuffer = await this.gerarPDFBuffer(termo);

      // Configurar email
      const mailOptions = {
        from: {
          name: 'PetSup - Adoção de Pets',
          address: process.env.EMAIL_USER || 'petsup2005@gmail.com',
        },
        to: termo.adotante_email, // 🔧 Apenas para o adotante
        subject: `Termo de Compromisso - Adoção de ${termo.pet_nome}`,
        html: this.gerarHTMLEmail(termo),
        attachments: [
          {
            filename: `termo_adocao_${termo.pet_nome}_${termo.id}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf',
          },
        ],
      };

      // Enviar email
      const info = await this.transporter.sendMail(mailOptions);
      
      console.log('✅ Email enviado com sucesso:', info.messageId);
      console.log('📨 Destinatário:', termo.adotante_email);

    } catch (error) {
      console.error('❌ Erro ao enviar email:', error);
      throw new Error('Falha ao enviar email com o termo');
    }
  }

  /**
   * 📄 Gerar PDF em buffer
   */
  private async gerarPDFBuffer(termo: TermoCompromisso): Promise<Buffer> {
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
   * 📝 Gerar conteúdo do PDF (versão compacta)
   */
  private gerarConteudoPDF(doc: PDFKit.PDFDocument, termo: TermoCompromisso): void {
    const dataFormatada = new Date(termo.data_assinatura).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    let yPosition = 50;

    // Cabeçalho compacto
    doc
      .fontSize(18)
      .font('Helvetica-Bold')
      .text('TERMO DE COMPROMISSO DE ADOÇÃO', 0, yPosition, { align: 'center' });

    yPosition += 25;
    doc
      .fontSize(10)
      .font('Helvetica')
      .text(`Documento ID: ${termo.id} | Data: ${dataFormatada}`, 0, yPosition, { align: 'center' });

    yPosition += 30;

    // Dados do Pet (compacto)
    doc.fontSize(12).font('Helvetica-Bold').text('DADOS DO PET:', 50, yPosition);
    yPosition += 15;

    doc
      .fontSize(10)
      .font('Helvetica')
      .text(`Nome: ${termo.pet_nome} | Espécie: ${termo.pet_especie_nome}`, 50, yPosition);
    yPosition += 12;
    doc.text(`Raça: ${termo.pet_raca_nome} | Sexo: ${termo.pet_sexo_nome} | Idade: ${termo.pet_idade} anos`, 50, yPosition);
    
    if (termo.pet_motivo_doacao) {
      yPosition += 12;
      doc.text(`Motivo da Doação: ${termo.pet_motivo_doacao}`, 50, yPosition);
    }

    yPosition += 20;

    // Dados do Doador (compacto)
    doc.fontSize(12).font('Helvetica-Bold').text('DADOS DO DOADOR:', 50, yPosition);
    yPosition += 15;

    doc
      .fontSize(10)
      .font('Helvetica')
      .text(`Nome: ${termo.doador_nome}`, 50, yPosition);
    yPosition += 12;
    doc.text(`Email: ${termo.doador_email}`, 50, yPosition);

    if (termo.doador_telefone) {
      yPosition += 12;
      doc.text(`Telefone: ${termo.doador_telefone}`, 50, yPosition);
    }

    yPosition += 20;

    // Dados do Adotante (compacto)
    doc.fontSize(12).font('Helvetica-Bold').text('DADOS DO ADOTANTE:', 50, yPosition);
    yPosition += 15;

    doc
      .fontSize(10)
      .font('Helvetica')
      .text(`Nome: ${termo.adotante_nome}`, 50, yPosition);
    yPosition += 12;
    doc.text(`Email: ${termo.adotante_email}`, 50, yPosition);

    if (termo.adotante_telefone) {
      yPosition += 12;
      doc.text(`Telefone: ${termo.adotante_telefone}`, 50, yPosition);
    }

    if (termo.adotante_cpf) {
      yPosition += 12;
      doc.text(`CPF: ${termo.adotante_cpf}`, 50, yPosition);
    }

    yPosition += 20;

    // Compromissos do Adotante (mais compacto)
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('COMPROMISSOS DO ADOTANTE:', 50, yPosition);

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
      doc.text(`${index + 1}. ${compromisso}`, 50, yPosition, { width: 500 });
      yPosition += 11;
    });

    yPosition += 10;

    // Observações (se existir)
    if (termo.observacoes) {
      // Verificar se precisa de nova página
      if (yPosition > 680) {
        doc.addPage();
        yPosition = 50;
      }

      doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .text('OBSERVAÇÕES:', 50, yPosition);

      yPosition += 15;
      doc
        .fontSize(10)
        .font('Helvetica')
        .text(termo.observacoes, 50, yPosition, { width: 500 });
      
      yPosition += Math.min(60, termo.observacoes.length / 8); // Estimativa de altura
    }

    // Verificar se precisa de nova página para assinatura
    if (yPosition > 650) {
      doc.addPage();
      yPosition = 50;
    }

    yPosition += 15;

    // Assinatura (compacta)
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('ASSINATURA DIGITAL:', 50, yPosition);

    yPosition += 15;
    doc
      .fontSize(10)
      .font('Helvetica')
      .text(`Assinatura: ${termo.assinatura_digital}`, 50, yPosition);
    yPosition += 12;
    doc.text(`Data: ${dataFormatada}`, 50, yPosition);
    yPosition += 12;
    doc.text(`Hash: ${termo.hash_documento}`, 50, yPosition);

    // Rodapé
    doc
      .fontSize(8)
      .font('Helvetica')
      .text(
        'Este documento foi gerado digitalmente pelo PetSup - Plataforma de Adoção de Pets',
        0,
        doc.page.height - 30,
        { align: 'center' }
      );
  }

  /**
   * 📧 Gerar HTML do email
   */
  private gerarHTMLEmail(termo: TermoCompromisso): string {
    const dataFormatada = new Date(termo.data_assinatura).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4682B4; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .pet-info { background: white; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4682B4; }
          .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
          .highlight { color: #4682B4; font-weight: bold; }
          .attachment-note { background: #e8f4fd; padding: 15px; border-radius: 8px; border: 1px solid #4682B4; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🐾 Termo de Compromisso de Adoção</h1>
            <p>Parabéns pela adoção de <strong>${termo.pet_nome}</strong>!</p>
          </div>
          
          <div class="content">
            <p>Olá <strong>${termo.adotante_nome}</strong>,</p>
            
            <p>Seu termo de compromisso de adoção foi gerado com sucesso! 🎉</p>
            
            <div class="pet-info">
              <h3>📋 Informações da Adoção:</h3>
              <p><strong>Pet:</strong> ${termo.pet_nome}</p>
              <p><strong>Espécie:</strong> ${termo.pet_especie_nome}</p>
              <p><strong>Raça:</strong> ${termo.pet_raca_nome}</p>
              <p><strong>Doador:</strong> ${termo.doador_nome}</p>
              <p><strong>Data da Assinatura:</strong> ${dataFormatada}</p>
              <p><strong>ID do Documento:</strong> #${termo.id}</p>
            </div>

            <div class="attachment-note">
              <h3>📎 Documento Anexo</h3>
              <p>O termo de compromisso completo está anexado a este email em formato PDF. 
              Este documento contém todos os detalhes da adoção e serve como comprovante oficial.</p>
            </div>

            <h3>🎯 Próximos Passos:</h3>
            <ul>
              <li>Guarde este documento em local seguro</li>
              <li>Mantenha contato com o doador conforme acordado</li>
              <li>Proporcione muito amor e cuidado ao ${termo.pet_nome}</li>
              <li>Lembre-se dos compromissos assumidos no termo</li>
            </ul>

            ${termo.observacoes ? `
              <div style="background: #fff3cd; padding: 15px; border-radius: 8px; border: 1px solid #ffc107; margin: 20px 0;">
                <h3>📝 Observações Especiais:</h3>
                <p>${termo.observacoes}</p>
              </div>
            ` : ''}

            <p>Se você tiver alguma dúvida ou precisar de suporte, não hesite em entrar em contato conosco.</p>
            
            <p>Desejamos uma vida longa e feliz para você e <span class="highlight">${termo.pet_nome}</span>! 💙</p>
            
            <p>Com carinho,<br>
            <strong>Equipe PetSup</strong></p>
          </div>
          
          <div class="footer">
            <p>Este email foi enviado automaticamente pelo sistema PetSup</p>
            <p>Hash do documento: ${termo.hash_documento}</p>
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
export const emailService = new EmailService();