import { Request, Response, NextFunction } from 'express';
import { Usuario } from '../models/usuarioModel';
import { ValidationError, UniqueConstraintError, DatabaseError } from 'sequelize';
import axios from 'axios';
import { Estado } from '../models/estadoModel';
import { Cidade } from '../models/cidadeModel';
import bcrypt from 'bcrypt';
import { parsePhoneNumberFromString, isValidPhoneNumber } from 'libphonenumber-js';
import { supabase } from '../api/supabaseClient'; // certifique-se que esse client esteja criado corretamente
const saltRounds = 10; // número de rounds de salt
import { cpf } from 'cpf-cnpj-validator';
import { Pet } from '../models/petModel';
import { RecuperacaoSenha } from '../models/RecuperacaoSenhaModel';
import nodemailer from 'nodemailer';
import { Op } from 'sequelize';

export class UsuarioController {
  static async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const usuarios = await Usuario.findAll();
      res.json(usuarios);
    } catch (error) {
      console.error('Erro ao listar usuários:', error);
      res.status(500).json({ error: 'Erro ao listar usuários.' });
    }
  }
  static async checkDuplicateFields(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, cpf, telefone } = req.body;
      const duplicateFields: string[] = [];

      // Verificar email duplicado
      if (email) {
        const existingEmail = await Usuario.findOne({ where: { email } });
        if (existingEmail) {
          duplicateFields.push('email');
        }
      }

      // Verificar CPF duplicado
      if (cpf) {
        const cpfNumerico = cpf.replace(/\D/g, '');
        const existingCpf = await Usuario.findOne({ where: { cpf: cpfNumerico } });
        if (existingCpf) {
          duplicateFields.push('cpf');
        }
      }

      // Verificar telefone duplicado
      if (telefone) {
        const telefoneNumerico = telefone.replace(/\D/g, '');
        const existingTelefone = await Usuario.findOne({ where: { telefone: telefoneNumerico } });
        if (existingTelefone) {
          duplicateFields.push('telefone');
        }
      }

      if (duplicateFields.length > 0) {
        res.status(400).json({
          exists: true,
          duplicateFields,
          message: `Os seguintes campos já estão cadastrados: ${duplicateFields.join(', ')}`,
        });
        return;
      }

      res.status(200).json({
        exists: false,
        message: 'Dados disponíveis para cadastro',
      });
    } catch (error) {
      console.error('Erro ao verificar duplicação:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
  private static validarEFormatarTelefone(telefone: string): { isValid: boolean; formatted?: string; error?: string } {
    try {
      // Remove caracteres não numéricos
      const telefoneNumerico = telefone.replace(/\D/g, '');

      // Verifica se tem pelo menos 10 dígitos (telefone fixo) ou 11 (celular)
      if (telefoneNumerico.length < 10 || telefoneNumerico.length > 11) {
        return {
          isValid: false,
          error: 'Telefone deve ter 10 ou 11 dígitos',
        };
      }

      // Adiciona o código do país se não tiver
      const telefoneComCodigo = telefoneNumerico.startsWith('55') ? `+${telefoneNumerico}` : `+55${telefoneNumerico}`;

      // Valida usando libphonenumber-js
      if (!isValidPhoneNumber(telefoneComCodigo, 'BR')) {
        return {
          isValid: false,
          error: 'Número de telefone inválido',
        };
      }

      // Formata o telefone - USANDO parsePhoneNumberFromString
      const phoneNumber = parsePhoneNumberFromString(telefoneComCodigo, 'BR');

      if (!phoneNumber) {
        return {
          isValid: false,
          error: 'Não foi possível processar o telefone',
        };
      }

      const formatted = phoneNumber.format('NATIONAL'); // Formato nacional: (11) 99999-9999

      return {
        isValid: true,
        formatted: formatted,
      };
    } catch (error) {
      console.error('Erro na validação do telefone:', error);
      return {
        isValid: false,
        error: 'Erro ao validar telefone',
      };
    }
  }
  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const usuario = await Usuario.findByPk(Number(req.params.id));
      if (!usuario) {
        res.status(404).json({ error: 'Usuário não encontrado' });
        return;
      }
      res.json(usuario);
    } catch (error) {
      console.error('Erro ao buscar usuário:', error);
      res.status(500).json({ error: 'Erro ao buscar usuário.' });
    }
  }

  static async getByEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Mudança aqui - usar req.params.email em vez de req.query.email
      const email = req.params.email;

      // Verificar se o email foi fornecido
      if (!email) {
        res.status(400).json({ error: 'E-mail não fornecido' });
        return;
      }

      console.log('Buscando usuário pelo email:', email);

      const usuario = await Usuario.findOne({
        where: {
          email: email,
        },
      });

      if (!usuario) {
        res.status(404).json({ error: 'Usuário não encontrado' });
        return;
      }

      res.json(usuario);
    } catch (error) {
      console.error('Erro ao buscar usuário:', error);
      res.status(500).json({
        error: 'Erro ao buscar usuário.',
        details: process.env.NODE_ENV !== 'production' ? String(error) : undefined,
      });
    }
  }

  static async create(req: Request, res: Response, next: NextFunction): Promise<Response> {
    let { nome, sexo_id, telefone, email, senha, cpf: cpfInput, cep, estado_id, cidade_id } = req.body;

    try {
      // Validação de CPF - adicionar aqui
      if (cpfInput) {
        // Remove caracteres não numéricos
        const cpfNumerico = cpfInput.replace(/\D/g, '');

        // Verifica se o CPF é válido
        if (!cpf.isValid(cpfNumerico)) {
          return res.status(400).json({
            error: 'CPF inválido',
            message: 'O CPF informado não é válido.',
          });
        }

        // Formata o CPF antes de salvar (opcional)
        cpfInput = cpf.format(cpfNumerico);
      } else {
        return res.status(400).json({
          error: 'CPF obrigatório',
          message: 'O CPF é obrigatório para cadastro.',
        });
      }

      if (telefone) {
        const validacaoTelefone = UsuarioController.validarEFormatarTelefone(telefone);

        if (!validacaoTelefone.isValid) {
          return res.status(400).json({
            error: 'Telefone inválido',
            message: validacaoTelefone.error || 'O telefone informado não é válido.',
          });
        }

        // Usa o telefone formatado
        telefone = validacaoTelefone.formatted;
      } else {
        return res.status(400).json({
          error: 'Telefone obrigatório',
          message: 'O telefone é obrigatório para cadastro.',
        });
      }

      // Verificar se a senha foi fornecida
      if (!senha) {
        return res.status(400).json({ error: 'Senha é obrigatória.' });
      }

      // Verificar se a senha tem pelo menos 12 caracteres
      if (senha.length < 12) {
        return res
          .status(400)
          .json({ error: 'Senha muito curta', message: 'A senha deve ter pelo menos 12 caracteres.' });
      }

      // Hash da senha antes de salvar
      const senhaHash = await bcrypt.hash(senha, saltRounds);

      // Se cidade_id não for informado, buscar via CEP
      if (!cidade_id && cep) {
        const response = await axios.get(`https://viacep.com.br/ws/${cep}/json/`);
        const endereco = response.data;

        if (endereco?.erro) {
          return res.status(400).json({ error: 'CEP inválido ou não encontrado' });
        }

        const estado = await Estado.findOne({ where: { sigla: endereco.uf } });
        if (!estado) {
          return res.status(400).json({ error: 'Estado não encontrado no banco de dados' });
        }

        const cidade = await Cidade.findOne({
          where: {
            nome: endereco.localidade,
            estado_id: estado.id,
          },
        });

        if (!cidade) {
          return res.status(400).json({ error: 'Cidade não encontrada no banco de dados' });
        }

        cidade_id = cidade.id;
      }

      cep = cep || null; // Se o CEP não for informado, atribui null

      // Processamento de imagem (similar ao criar do pet)
      let fotoUrl = null;

      if (req.file) {
        try {
          console.log('Arquivo presente, tamanho:', req.file.size);
          console.log('Tipo de arquivo:', req.file.mimetype);

          const fileBuffer = req.file.buffer;

          // Criar um nome de arquivo único baseado no nome do usuário e timestamp
          const filePath = `usuarios/${nome.replace(/\s+/g, '_')}_${Date.now()}.jpg`;
          const { data, error } = await supabase.storage.from('user-images').upload(filePath, fileBuffer, {
            contentType: req.file.mimetype,
          });

          if (error) {
            console.error('Erro ao fazer upload da imagem no Supabase:', error);
          } else if (data?.path) {
            const { data: publicData } = supabase.storage.from('user-images').getPublicUrl(data.path);
            fotoUrl = publicData?.publicUrl ?? null;
            console.log('URL da imagem gerada:', fotoUrl);
          }
        } catch (fileError) {
          console.error('Erro ao processar o arquivo:', fileError);
        }
      } else {
        console.log('Nenhum arquivo foi enviado');
      }

      // Criar o usuário com a foto (se houver)
      const usuario = await Usuario.create({
        nome,
        sexo_id,
        telefone,
        email,
        senha: senhaHash,
        cpf: cpfInput,
        cep,
        foto: fotoUrl, // Adiciona o caminho da foto
        estado_id,
        cidade_id,
      });

      // Retorna o usuário criado junto com a URL pública da foto (se houver)
      return res.status(201).json({
        ...usuario.toJSON(),
        fotoUrl,
      });
    } catch (error) {
      console.error('Erro ao criar usuário:', error);

      if (error instanceof UniqueConstraintError) {
        // Identificar qual campo específico está duplicado
        const duplicatedField = error.errors?.[0]?.path;
        const duplicateFields: string[] = [];
        let specificMessage = 'Email, CPF ou telefone já cadastrado no sistema.';
        let fieldName = '';

        // Verificar qual campo está duplicado baseado no erro do Sequelize
        switch (duplicatedField) {
          case 'email':
            specificMessage = 'Este e-mail já está cadastrado no sistema.';
            fieldName = 'email';
            duplicateFields.push('email');
            break;
          case 'cpf':
            specificMessage = 'Este CPF já está cadastrado no sistema.';
            fieldName = 'cpf';
            duplicateFields.push('cpf');
            break;
          case 'telefone':
            specificMessage = 'Este telefone já está cadastrado no sistema.';
            fieldName = 'telefone';
            duplicateFields.push('telefone');
            break;
          default:
            // Caso não consiga identificar, tenta verificar manualmente
            try {
              const cpfNumerico = cpfInput?.replace(/\D/g, '');
              const telefoneNumerico = telefone?.replace(/\D/g, '');

              // Verificar email
              if (email) {
                const existingEmail = await Usuario.findOne({ where: { email } });
                if (existingEmail) {
                  duplicateFields.push('email');
                }
              }

              // Verificar CPF
              if (cpfNumerico) {
                const existingCpf = await Usuario.findOne({ where: { cpf: cpfNumerico } });
                if (existingCpf) {
                  duplicateFields.push('cpf');
                }
              }

              // Verificar telefone
              if (telefoneNumerico) {
                const existingTelefone = await Usuario.findOne({ where: { telefone: telefoneNumerico } });
                if (existingTelefone) {
                  duplicateFields.push('telefone');
                }
              }

              if (duplicateFields.length > 0) {
                specificMessage = `Os seguintes campos já estão cadastrados: ${duplicateFields.join(', ')}`;
                fieldName = duplicateFields[0]; // Para compatibilidade
              }
            } catch (checkError) {
              console.error('Erro ao verificar duplicação manual:', checkError);
            }
            break;
        }

        return res.status(400).json({
          error: 'Dados duplicados',
          message: specificMessage,
          duplicateField: fieldName, // Campo específico para o frontend
          duplicateFields: duplicateFields.length > 0 ? duplicateFields : ['unknown'], // Array para compatibilidade
          exists: true, // Para compatibilidade com validarUsuario
        });
      } else if (error instanceof ValidationError) {
        return res.status(400).json({
          error: 'Dados inválidos',
          message: error.message,
          details: error.errors.map((e) => ({ field: e.path, message: e.message })),
        });
      } else {
        return res.status(500).json({ error: 'Erro ao criar usuário.' });
      }
    }
  }
  // Adicione este método ao UsuarioController

  static async checkDuplicateFieldsForEdit(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId, email, cpf, telefone } = req.body;
      const duplicateFields: string[] = [];

      if (!userId) {
        res.status(400).json({ error: 'ID do usuário é obrigatório' });
        return;
      }

      // Verificar email duplicado (excluindo o próprio usuário)
      if (email) {
        const existingEmail = await Usuario.findOne({
          where: {
            email,
            id: { [Op.ne]: userId }, // Não igual ao ID do usuário atual
          },
        });
        if (existingEmail) {
          duplicateFields.push('email');
        }
      }

      // Verificar CPF duplicado (excluindo o próprio usuário)
      if (cpf) {
        const cpfNumerico = cpf.replace(/\D/g, '');
        const existingCpf = await Usuario.findOne({
          where: {
            cpf: cpfNumerico,
            id: { [Op.ne]: userId },
          },
        });
        if (existingCpf) {
          duplicateFields.push('cpf');
        }
      }

      // Verificar telefone duplicado (excluindo o próprio usuário)
      if (telefone) {
        const telefoneNumerico = telefone.replace(/\D/g, '');
        const existingTelefone = await Usuario.findOne({
          where: {
            telefone: telefoneNumerico,
            id: { [Op.ne]: userId },
          },
        });
        if (existingTelefone) {
          duplicateFields.push('telefone');
        }
      }

      if (duplicateFields.length > 0) {
        res.status(400).json({
          exists: true,
          duplicateFields,
          message: `Os seguintes campos já estão sendo usados por outro usuário: ${duplicateFields.join(', ')}`,
        });
        return;
      }

      res.status(200).json({
        exists: false,
        message: 'Dados disponíveis para atualização',
      });
    } catch (error) {
      console.error('Erro ao verificar duplicação para edição:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({ error: 'ID de usuário inválido' });
        return;
      }

      const usuario = await Usuario.findByPk(id);
      if (!usuario) {
        res.status(404).json({ error: 'Usuário não encontrado' });
        return;
      }

      // Desestruturar e extrair os campos permitidos
      let {
        foto: bodyFoto,
        nome,
        sexo_id,
        telefone,
        email,
        senha,
        cpf: cpfInput,
        cep,
        estado_id,
        cidade_id,
      } = req.body;

      if (cpfInput !== undefined && cpfInput !== null) {
        // Remove caracteres não numéricos
        const cpfNumerico = cpfInput.replace(/\D/g, '');

        // Verifica se o CPF é válido
        if (!cpf.isValid(cpfNumerico)) {
          res.status(400).json({
            error: 'CPF inválido',
            message: 'O CPF informado não é válido.',
          });
          return;
        }

        // Formata o CPF antes de salvar (opcional)
        cpfInput = cpf.format(cpfNumerico);
      }

      if (telefone !== undefined && telefone !== null && telefone.trim() !== '') {
        const validacaoTelefone = UsuarioController.validarEFormatarTelefone(telefone);

        if (!validacaoTelefone.isValid) {
          res.status(400).json({
            error: 'Telefone inválido',
            message: validacaoTelefone.error || 'O telefone informado não é válido.',
          });
          return;
        }

        // Usa o telefone formatado
        telefone = validacaoTelefone.formatted;
      }

      // Debug: Mostrar valores recebidos
      console.log('Valores recebidos do cliente:', {
        nome,
        sexo_id,
        telefone,
        email,
        senha: senha ? '[SENHA RECEBIDA]' : '[SEM SENHA]',
        cpf: cpfInput,
        cep,
        estado_id: estado_id || 'não informado',
        cidade_id: cidade_id || 'não informado',
      });

      // Inicializar dados atualizados
      const dadosAtualizados: any = {
        nome,
        sexo_id: sexo_id ? Number(sexo_id) : usuario.sexo_id,
        telefone,
        email,
        cpf: cpfInput,
        cep: cep !== undefined && cep !== null ? cep : usuario.cep,
        estado_id: estado_id ? Number(estado_id) : usuario.estado_id,
        cidade_id: cidade_id ? Number(cidade_id) : usuario.cidade_id,
        foto: bodyFoto,
      };

      // Criptografar a senha se foi fornecida
      if (senha && senha.trim() !== '') {
        const saltRounds = 10;
        dadosAtualizados.senha = await bcrypt.hash(senha, saltRounds);
        console.log('Nova senha recebida e criptografada manualmente');
      } else {
        console.log('Senha não informada, mantendo a atual');
        delete dadosAtualizados.senha;
      }

      // Inicializar a URL da foto com a existente ou a do body
      let fotoUrl = bodyFoto || usuario.foto;
      dadosAtualizados.foto = fotoUrl;

      // ATUALIZAÇÃO COM HOOKS ATIVADOS
      await usuario.update(
        {
          ...dadosAtualizados,
          estado_id: Number(estado_id) || usuario.estado_id,
          cidade_id: Number(cidade_id) || usuario.cidade_id,
          cep: cep !== undefined && cep !== null ? cep : usuario.cep,
        },
        {
          hooks: true,
        }
      );

      // Recarregar o usuário para garantir que temos os dados corretos
      const usuarioAtualizado = await Usuario.findByPk(id);

      if (!usuarioAtualizado) {
        res.status(404).json({ error: 'Usuário não encontrado após atualização' });
        return;
      }

      // Retorna o usuário com a URL pública para a foto
      res.json({
        ...usuarioAtualizado.toJSON(),
        fotoUrl,
      });
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);

      if (error instanceof UniqueConstraintError) {
        // Identificar qual campo específico está duplicado
        const duplicatedField = error.errors?.[0]?.path;
        const duplicateFields: string[] = [];
        let specificMessage = 'Email, CPF ou telefone já em uso por outro usuário.';
        let fieldName = '';

        switch (duplicatedField) {
          case 'email':
            specificMessage = 'Este e-mail já está sendo usado por outro usuário.';
            fieldName = 'email';
            duplicateFields.push('email');
            break;
          case 'cpf':
            specificMessage = 'Este CPF já está sendo usado por outro usuário.';
            fieldName = 'cpf';
            duplicateFields.push('cpf');
            break;
          case 'telefone':
            specificMessage = 'Este telefone já está sendo usado por outro usuário.';
            fieldName = 'telefone';
            duplicateFields.push('telefone');
            break;
        }

        res.status(400).json({
          error: 'Dados duplicados',
          message: specificMessage,
          duplicateField: fieldName,
          duplicateFields: duplicateFields.length > 0 ? duplicateFields : ['unknown'],
          exists: true,
        });
      } else if (error instanceof ValidationError) {
        res.status(400).json({
          error: 'Dados inválidos',
          message: error.message,
          details: error.errors.map((e) => ({ field: e.path, message: e.message })),
        });
      } else {
        res.status(500).json({ error: 'Erro ao atualizar usuário.' });
      }
    }
  }
  static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      const usuario = await Usuario.findByPk(id);

      if (!usuario) {
        res.status(404).json({ error: 'Usuário não encontrado' });
        return;
      }

      // Verificar se o usuário tem pets vinculados
      const petCount = await Pet.count({
        where: {
          usuario_id: id,
        },
      });

      if (petCount > 0) {
        res.status(400).json({
          title: 'Erro ao Excluir Conta',
          error: 'Não é possível excluir a conta',
          message: `Você possui ${petCount} pet${petCount > 1 ? 's' : ''} cadastrado${
            petCount > 1 ? 's' : ''
          }. Remova antes de excluir sua conta.`,
          success: false,
        });
        return;
      }
    } catch (error) {
      console.error('Erro ao deletar usuário:', error);

      if (error instanceof DatabaseError) {
        // Caso exista algum constraint que impede a exclusão (ex: registros relacionados)
        res.status(400).json({
          error: 'Não foi possível excluir',
          message: 'Este usuário possui registros relacionados e não pode ser excluído.',
          success: false,
        });
      } else {
        // Outros erros
        res.status(500).json({
          error: 'Erro ao deletar usuário.',
          success: false,
        });
      }
    }
  }

  private static gerarCodigoAleatorio(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  static async sendRecoveryCode(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email } = req.body;

      // Verificar se o email foi fornecido
      if (!email) {
        res.status(400).json({ error: 'Email é obrigatório' });
        return;
      }

      // Verificar se o email existe no banco de dados
      const usuario = await Usuario.findOne({
        where: { email },
      });

      if (!usuario) {
        res.status(404).json({ error: 'Email não encontrado em nossa base de dados' });
        return;
      }

      // Gerar um código aleatório de 6 dígitos
      const codigo = UsuarioController.gerarCodigoAleatorio();

      // Definir prazo de expiração (4 minutos a partir de agora)
      const expiracao = new Date();
      expiracao.setMinutes(expiracao.getMinutes() + 4);

      // Primeiro, invalidar qualquer código existente para este usuário
      await RecuperacaoSenha.update({ expirado: true }, { where: { usuario_id: usuario.id, expirado: false } });

      // Criar um novo registro de código de recuperação
      await RecuperacaoSenha.create({
        usuario_id: usuario.id,
        email: usuario.email,
        codigo,
        expiracao,
        expirado: false,
      });

      // Configurar o transportador de email
      const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: Number(process.env.EMAIL_PORT) || 587,
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      // Configurar o email
      const mailOptions = {
        from: `"Pets_Up" <${process.env.EMAIL_USER}>`,
        to: usuario.email,
        subject: 'Código de Recuperação de Senha - Pets_Up',
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2>Recuperação de Senha</h2>
          <p>Olá ${usuario.nome},</p>
          <p>Você solicitou a recuperação de senha para sua conta Pets_Up.</p>
          <p>Seu código de verificação é:</p>
          <h1 style="font-size: 36px; text-align: center; letter-spacing: 5px; margin: 20px 0; padding: 10px; background-color: #f5f5f5; border-radius: 4px;">${codigo}</h1>
          <p>Este código é válido por 4 minutos.</p>
          <p>Se você não solicitou esta recuperação de senha, por favor ignore este e-mail.</p>
          <p>Atenciosamente,<br>Equipe Pets_Up</p>
        </div>
      `,
      };

      // Enviar o email
      await transporter.sendMail(mailOptions);

      // Retornar sucesso
      res.status(200).json({
        success: true,
        message: 'Código enviado com sucesso para o email cadastrado!',
        usuarioId: usuario.id,
      });
    } catch (error) {
      console.error('Erro ao enviar código de recuperação:', error);
      res.status(500).json({
        error: 'Erro ao enviar código de recuperação.',
        details: process.env.NODE_ENV !== 'production' ? String(error) : undefined,
      });
    }
  }

  static async checkCode(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, codigo } = req.body;

      // Verificar se email e código foram fornecidos
      if (!email || !codigo) {
        res.status(400).json({ error: 'Email e código são obrigatórios' });
        return;
      }

      // Buscar a entrada de recuperação mais recente não expirada
      const recuperacao = await RecuperacaoSenha.findOne({
        where: {
          email,
          codigo,
          expirado: false,
          expiracao: { [Op.gt]: new Date() }, // Verifica se o código ainda não expirou
        },
        order: [['createdAt', 'DESC']],
      });

      if (!recuperacao) {
        res.status(400).json({ error: 'Código inválido ou expirado' });
        return;
      }

      // Código válido, marcar como usado
      await recuperacao.update({ expirado: true });

      // Retornar sucesso
      res.status(200).json({
        success: true,
        message: 'Código verificado com sucesso!',
        usuarioId: recuperacao.usuario_id,
      });
    } catch (error) {
      console.error('Erro ao verificar código:', error);
      res.status(500).json({
        error: 'Erro ao verificar código.',
        details: process.env.NODE_ENV !== 'production' ? String(error) : undefined,
      });
    }
  }
}
