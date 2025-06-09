// services/emailService.ts - Serviço de Email Atualizado com Envio Personalizado para Ambos

import nodemailer from 'nodemailer';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { TermoAdocao } from '../models/termoAdocaoModel';

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
   * 📱 Função para formatar telefone no padrão brasileiro
   */
  private formatTelefone(telefone: string | undefined): string {
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
   * 🆕 📧 Enviar termo de compromisso personalizado para AMBOS (doador e adotante)
   */
  async enviarTermoPDF(termo: TermoAdocao): Promise<void> {
    try {
      // Verificar se ambos os emails estão disponíveis
      if (!termo.doador_email || !termo.adotante_email) {
        throw new Error(
          `Emails não disponíveis - Doador: ${termo.doador_email ? 'OK' : 'FALTANDO'}, Adotante: ${
            termo.adotante_email ? 'OK' : 'FALTANDO'
          }`
        );
      }

      // Gerar PDF único (mesmo conteúdo para ambos)
      const pdfBuffer = await this.gerarPDFBuffer(termo);

      // Ler a imagem do cachorro
      const logoPath = path.join(__dirname, '../images/estampa-de-cachorro.png');
      const logoBuffer = fs.readFileSync(logoPath);

      // 🆕 Enviar email personalizado para o DOADOR
      await this.enviarEmailParaDoador(termo, pdfBuffer, logoBuffer);

      // 🆕 Enviar email personalizado para o ADOTANTE
      await this.enviarEmailParaAdotante(termo, pdfBuffer, logoBuffer);
    } catch (error) {
      throw new Error('Falha ao enviar emails com o termo');
    }
  }

  /**
   * 🆕 📧 Enviar email personalizado para o DOADOR
   */
  private async enviarEmailParaDoador(termo: TermoAdocao, pdfBuffer: Buffer, logoBuffer: Buffer): Promise<void> {
    const mailOptions = {
      from: {
        name: 'Pets_Up - Adoção de Pets',
        address: process.env.EMAIL_USER || 'petsup2005@gmail.com',
      },
      to: termo.doador_email,
      subject: `🎉 ${termo.pet_nome} Foi Adotado! - Termo de Compromisso`,
      html: this.gerarHTMLEmailDoador(termo),
      attachments: [
        {
          filename: `termo_adocao_${termo.pet_nome}_${termo.id}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
        {
          filename: 'logo.png',
          content: logoBuffer,
          contentType: 'image/png',
          cid: 'logo_cachorro',
        },
      ],
    };

    const info = await this.transporter.sendMail(mailOptions);
  }

  /**
   * 🆕 📧 Enviar email personalizado para o ADOTANTE
   */
  private async enviarEmailParaAdotante(termo: TermoAdocao, pdfBuffer: Buffer, logoBuffer: Buffer): Promise<void> {
    const mailOptions = {
      from: {
        name: 'Pets_Up - Adoção de Pets',
        address: process.env.EMAIL_USER || 'petsup2005@gmail.com',
      },
      to: termo.adotante_email,
      subject: `🐾 Termo de Compromisso - Adoção de ${termo.pet_nome}`,
      html: this.gerarHTMLEmailAdotante(termo),
      attachments: [
        {
          filename: `termo_adocao_${termo.pet_nome}_${termo.id}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
        {
          filename: 'logo.png',
          content: logoBuffer,
          contentType: 'image/png',
          cid: 'logo_cachorro',
        },
      ],
    };

    const info = await this.transporter.sendMail(mailOptions);
  }

  /**
   * 🆕 📧 Gerar HTML do email para o DOADOR (mostra dados completos do adotante)
   */
  private gerarHTMLEmailDoador(termo: TermoAdocao): string {
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
          .header img { width: 32px; height: 32px; vertical-align: middle; margin-right: 10px; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .pet-info { background: white; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4682B4; }
          .adopter-info { background: #e8f5e8; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745; }
          .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
          .highlight { color: #4682B4; font-weight: bold; }
          .attachment-note { background: #e8f4fd; padding: 15px; border-radius: 8px; border: 1px solid #4682B4; margin: 20px 0; }
          .congratulations { background: #d1ecf1; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #bee5eb; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1><img src="cid:logo_cachorro" alt="Pet Icon"> Parabéns, ${termo.doador_nome}!</h1>
            <p><strong>${termo.pet_nome}</strong> foi adotado com sucesso!</p>
          </div>
          
          <div class="content">
            <div class="congratulations">
              <h2>🎊 Que notícia maravilhosa!</h2>
              <p>Seu pet <strong>${termo.pet_nome}</strong> encontrou uma nova família amorosa!</p>
            </div>

            <p>Olá <strong>${termo.doador_nome}</strong>,</p>
            
            <p>É com grande alegria que informamos que <strong>${termo.pet_nome}</strong> foi oficialmente adotado! 
            O termo de compromisso foi assinado e está anexado a este email.</p>
            
            <div class="pet-info">
              <h3>🐾 Informações do Pet Adotado:</h3>
              <p><strong>Nome:</strong> ${termo.pet_nome}</p>
              <p><strong>Espécie:</strong> ${termo.pet_especie_nome}</p>
              <p><strong>Raça:</strong> ${termo.pet_raca_nome}</p>
              <p><strong>Sexo:</strong> ${termo.pet_sexo_nome}</p>
              <p><strong>Idade:</strong> ${termo.pet_idade} anos</p>
              <p><strong>Data da Adoção:</strong> ${dataFormatada}</p>
              <p><strong>ID do Documento:</strong> #${termo.id}</p>
            </div>

            <div class="adopter-info">
              <h3>👤 Informações Completas do Adotante:</h3>
              <p><strong>Nome:</strong> ${termo.adotante_nome}</p>
              <p><strong>Email:</strong> ${termo.adotante_email}</p>
              <p><strong>Telefone:</strong> ${this.formatTelefone(termo.adotante_telefone)}</p>
              <p><strong>Localização:</strong> ${termo.getLocalizacaoAdotante()}</p>
              <p><strong>Assinatura Digital:</strong> ${termo.assinatura_digital}</p>
              ${termo.adotante_cpf ? `<p><strong>CPF:</strong> ${termo.adotante_cpf}</p>` : ''}
            </div>

            <div class="attachment-note">
              <h3>📎 Documento Oficial</h3>
              <p>O termo de compromisso oficial está anexado a este email em formato PDF. 
              Este documento contém todos os detalhes da adoção e as responsabilidades do adotante.</p>
            </div>

            <h3>🤝 Como Doador, você pode:</h3>
            <ul>
              <li>Entrar em contato com o adotante conforme acordado no termo</li>
              <li>Solicitar atualizações sobre o bem-estar do ${termo.pet_nome}</li>
              <li>Organizar visitas mediante agendamento prévio</li>
              <li>Guardar este documento como comprovante da doação responsável</li>
            </ul>

            ${
              termo.observacoes
                ? `
              <div style="background: #fff3cd; padding: 15px; border-radius: 8px; border: 1px solid #ffc107; margin: 20px 0;">
                <h3>📝 Observações da Adoção:</h3>
                <p>${termo.observacoes}</p>
              </div>
            `
                : ''
            }

            <p>Agradecemos por ter escolhido nossa plataforma para encontrar um lar amoroso para <strong>${
              termo.pet_nome
            }</strong>. 
            Sua atitude de doação responsável faz toda a diferença na vida dos animais! 🙏</p>
            
            <p>Se precisar de qualquer esclarecimento, estamos à disposição.</p>
            
            <p>Com gratidão,<br>
            <strong>Equipe Pets_Up</strong> 💙</p>
          </div>
          
          <div class="footer">
            <p>Este email foi enviado automaticamente pelo sistema Pets_Up</p>
            <p>Hash do documento: ${termo.hash_documento}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * 🆕 📧 Gerar HTML do email para o ADOTANTE (mostra dados completos do doador)
   */
  private gerarHTMLEmailAdotante(termo: TermoAdocao): string {
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
          .header img { width: 32px; height: 32px; vertical-align: middle; margin-right: 10px; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .pet-info { background: white; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4682B4; }
          .donor-info { background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2196f3; }
          .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
          .highlight { color: #4682B4; font-weight: bold; }
          .attachment-note { background: #e8f4fd; padding: 15px; border-radius: 8px; border: 1px solid #4682B4; margin: 20px 0; }
          .welcome { background: #d4edda; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #c3e6cb; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1><img src="cid:logo_cachorro" alt="Pet Icon"> Bem-vindo à família, ${termo.adotante_nome}!</h1>
            <p>Parabéns pela adoção de <strong>${termo.pet_nome}</strong>! </p>
          </div>
          
          <div class="content">
            <div class="welcome">
              <h2>🎉 Parabéns pela sua nova família!</h2>
              <p>Você oficialmente adotou <strong>${termo.pet_nome}</strong>!</p>
            </div>

            <p>Olá <strong>${termo.adotante_nome}</strong>,</p>
            
            <p>Seu termo de compromisso de adoção foi gerado com sucesso! Agora <strong>${termo.pet_nome}</strong> 
            oficialmente faz parte da sua família. 💙</p>
            
            <div class="pet-info">
              <h3>🐾 Seu Novo Pet:</h3>
              <p><strong>Nome:</strong> ${termo.pet_nome}</p>
              <p><strong>Espécie:</strong> ${termo.pet_especie_nome}</p>
              <p><strong>Raça:</strong> ${termo.pet_raca_nome}</p>
              <p><strong>Sexo:</strong> ${termo.pet_sexo_nome}</p>
              <p><strong>Idade:</strong> ${termo.pet_idade} anos</p>
              <p><strong>Data da Adoção:</strong> ${dataFormatada}</p>
              <p><strong>ID do Documento:</strong> #${termo.id}</p>
            </div>

            <div class="donor-info">
              <h3>👤 Informações Completas do Doador:</h3>
              <p><strong>Nome:</strong> ${termo.doador_nome}</p>
              <p><strong>Email:</strong> ${termo.doador_email}</p>
              <p><strong>Telefone:</strong> ${this.formatTelefone(termo.doador_telefone)}</p>
              <p><strong>Localização:</strong> ${termo.getLocalizacaoDoador()}</p>
              <p><em>Mantenha contato conforme acordado no termo de compromisso</em></p>
            </div>

            <div class="attachment-note">
              <h3>📎 Documento Oficial</h3>
              <p>O termo de compromisso completo está anexado a este email em formato PDF. 
              Este documento contém todos os detalhes da adoção e serve como comprovante oficial.</p>
            </div>

            <h3>🎯 Seus Compromissos Como Adotante:</h3>
            <ul>
              <li>Proporcionar cuidados veterinários adequados ao ${termo.pet_nome}</li>
              <li>Oferecer alimentação adequada e de qualidade</li>
              <li>Providenciar abrigo seguro e confortável</li>
              <li>Não abandonar, maltratar ou submeter o animal a maus-tratos</li>
              <li>Entrar em contato com o doador antes de repassar a terceiros</li>
              <li>Permitir visitas do doador mediante agendamento prévio</li>
              <li>Informar mudanças de endereço ou contato</li>
            </ul>

            ${
              termo.observacoes
                ? `
              <div style="background: #fff3cd; padding: 15px; border-radius: 8px; border: 1px solid #ffc107; margin: 20px 0;">
                <h3>📝 Observações Especiais:</h3>
                <p>${termo.observacoes}</p>
              </div>
            `
                : ''
            }

            <p><strong>Guarde este documento em local seguro</strong> e lembre-se: você assumiu a responsabilidade de 
            proporcionar muito amor e cuidado ao <span class="highlight">${termo.pet_nome}</span>.</p>
            
            <p>Se você tiver alguma dúvida ou precisar de suporte, não hesite em entrar em contato conosco.</p>
            
            <p>Desejamos uma vida longa e feliz para vocês dois! 🌟</p>
            
            <p>Com carinho,<br>
            <strong>Equipe Pets_Up</strong></p>
          </div>
          
          <div class="footer">
            <p>Este email foi enviado automaticamente pelo sistema Pets_Up</p>
            <p>Hash do documento: ${termo.hash_documento}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * 📄 Gerar PDF em buffer COM informações de localização
   */
  private async gerarPDFBuffer(termo: TermoAdocao): Promise<Buffer> {
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
   * 🆕 📝 Gerar conteúdo do PDF COM informações de localização completas
   */
  private gerarConteudoPDF(doc: PDFKit.PDFDocument, termo: TermoAdocao): void {
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
      .text('Este documento foi gerado digitalmente pelo Pets_Up - Plataforma de Adoção de Pets', 50, yPosition, {
        width: 500,
        align: 'center',
      });
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
          name: 'Pets_Up - Adoção de Pets',
          address: process.env.EMAIL_USER || 'petsup2005@gmail.com',
        },
        to: destinatario,
        subject: assunto,
        html: conteudoHTML,
        attachments: anexos,
      };

      const info = await this.transporter.sendMail(mailOptions);
    } catch (error) {
      throw error;
    }
  }
}

// Exportar instância singleton
export const emailService = new EmailService();
