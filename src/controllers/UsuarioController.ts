import { Request, Response, NextFunction } from 'express';
import { Usuario } from '../models/usuarioModel';
import { ValidationError, UniqueConstraintError, DatabaseError } from 'sequelize';
import axios from 'axios';
import { Estado } from '../models/estadoModel';
import { Cidade } from '../models/cidadeModel';
import { TermoDoacao } from '../models/termoDoacaoModel';
import bcrypt from 'bcrypt';
import { parsePhoneNumberFromString, isValidPhoneNumber } from 'libphonenumber-js';
import { supabase } from '../api/supabaseClient';
const saltRounds = 10;
import { cpf, cnpj } from 'cpf-cnpj-validator';
import { Pet } from '../models/petModel';
import { RecuperacaoSenha } from '../models/RecuperacaoSenhaModel';
import nodemailer from 'nodemailer';
import { Op } from 'sequelize';
import validator from 'validator';

export class UsuarioController {
  // NOVA FUNÇÃO: Validação e formatação de CPF/CNPJ
  private static validarEFormatarDocumento(documento: string): { 
    isValid: boolean; 
    formatted?: string; 
    tipo?: 'CPF' | 'CNPJ'; 
    error?: string 
  } {
    if (!documento) {
      return {
        isValid: false,
        error: 'Documento é obrigatório'
      };
    }

    const documentoNumerico = documento.replace(/\D/g, '');

    // Verificar se é CPF (11 dígitos)
    if (documentoNumerico.length === 11) {
      if (cpf.isValid(documentoNumerico)) {
        return {
          isValid: true,
          formatted: cpf.format(documentoNumerico),
          tipo: 'CPF'
        };
      } else {
        return {
          isValid: false,
          error: 'CPF inválido'
        };
      }
    }
    // Verificar se é CNPJ (14 dígitos)
    else if (documentoNumerico.length === 14) {
      if (cnpj.isValid(documentoNumerico)) {
        return {
          isValid: true,
          formatted: cnpj.format(documentoNumerico),
          tipo: 'CNPJ'
        };
      } else {
        return {
          isValid: false,
          error: 'CNPJ inválido'
        };
      }
    }
    // Comprimento inválido
    else {
      return {
        isValid: false,
        error: 'Documento deve ter 11 dígitos (CPF) ou 14 dígitos (CNPJ)'
      };
    }
  }

  // NOVA FUNÇÃO: Validação granular de email usando validator.js
  private static validarEmail(email: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!email) {
      errors.push('O e-mail é obrigatório');
      return { isValid: false, errors };
    }

    // Usar validator.js para validação principal
    if (!validator.isEmail(email)) {
      errors.push('Formato de e-mail inválido');
    }

    // Validar tamanho usando validator
    if (!validator.isLength(email, { min: 3, max: 254 })) {
      if (email.length < 3) {
        errors.push('O e-mail é muito curto (mínimo 3 caracteres)');
      } else {
        errors.push('O e-mail é muito longo (máximo 254 caracteres)');
      }
    }

    // Verificar se não tem espaços
    if (email.includes(' ')) {
      errors.push('E-mail não pode conter espaços');
    }

    // Verificações específicas de domínio
    if (email.includes('@')) {
      const [localPart, domain] = email.split('@');

      // Verificar parte local
      if (localPart.length > 64) {
        errors.push('Parte local do e-mail é muito longa (máximo 64 caracteres)');
      }

      // Verificar domínio usando validator
      if (domain.length > 253) {
        errors.push('Domínio do e-mail é muito longo (máximo 253 caracteres)');
      }

      // Verificar se é um FQDN válido
      if (!validator.isFQDN(domain)) {
        errors.push('Domínio inválido');
      }

      // Verificar se não tem partes vazias no domínio
      const domainParts = domain.split('.');
      if (domainParts.some((part) => part.length === 0)) {
        errors.push('Domínio não pode ter partes vazias');
      }

      // Verificar TLD
      const tld = domainParts[domainParts.length - 1];
      if (tld && tld.length < 2) {
        errors.push('Extensão do domínio deve ter pelo menos 2 caracteres');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // FUNÇÃO EXISTENTE: Validação granular de senha
  private static validarSenha(senha: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!senha) {
      errors.push('A senha é obrigatória');
      return { isValid: false, errors };
    }

    if (senha.length < 8) {
      errors.push('A senha deve ter pelo menos 8 caracteres');
    }

    if (!/[a-z]/.test(senha)) {
      errors.push('A senha deve possuir letras minúsculas');
    }

    if (!/[A-Z]/.test(senha)) {
      errors.push('A senha deve possuir letras maiúsculas');
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(senha)) {
      errors.push('A senha deve possuir caracteres especiais');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // NOVA FUNÇÃO: Extrair caminho do arquivo da URL do Supabase
  private static extrairCaminhoSupabase(url: string): string | null {
    try {
      if (!url) return null;

      // Padrão: https://[PROJECT_ID].supabase.co/storage/v1/object/public/user-images/[CAMINHO]
      const match = url.match(/\/user-images\/(.+)$/);
      return match ? match[1] : null;
    } catch (error) {
      return null;
    }
  }

  // NOVA FUNÇÃO: Deletar imagem do Supabase
  private static async deletarImagemSupabase(imagemUrl: string): Promise<boolean> {
    try {
      if (!imagemUrl) return true;

      const caminho = UsuarioController.extrairCaminhoSupabase(imagemUrl);
      if (!caminho) return true;

      const { error } = await supabase.storage.from('user-images').remove([caminho]);

      if (error) {
        return false;
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  // NOVA FUNÇÃO: Upload de imagem para Supabase
  private static async uploadImagemSupabase(
    fileBuffer: Buffer,
    fileName: string,
    contentType: string,
    imagemAnterior?: string | null
  ): Promise<string | null> {
    try {
      // Deletar imagem anterior se existir
      if (imagemAnterior) {
        await UsuarioController.deletarImagemSupabase(imagemAnterior);
      }

      const filePath = `usuarios/${fileName}`;

      const { data, error } = await supabase.storage.from('user-images').upload(filePath, fileBuffer, {
        contentType,
        upsert: true,
      });

      if (error) {
        return null;
      }

      if (!data?.path) {
        return null;
      }

      const { data: publicData } = supabase.storage.from('user-images').getPublicUrl(data.path);

      return publicData?.publicUrl ?? null;
    } catch (error) {
      return null;
    }
  }

  static async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const usuarios = await Usuario.findAll();
      res.json(usuarios);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao listar usuários.' });
    }
  }

  // MÉTODO ATUALIZADO: Verificação de campos duplicados com documento
  static async checkDuplicateFields(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, documento, telefone } = req.body;
      const duplicateFields: string[] = [];

      if (email) {
        const existingEmail = await Usuario.findOne({ where: { email } });
        if (existingEmail) {
          duplicateFields.push('email');
        }
      }

      if (documento) {
        const documentoNumerico = documento.replace(/\D/g, '');
        const existingDocumento = await Usuario.findOne({ where: { documento: documentoNumerico } });
        if (existingDocumento) {
          duplicateFields.push('documento');
        }
      }

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
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  private static validarEFormatarTelefone(telefone: string): { isValid: boolean; formatted?: string; error?: string } {
    try {
      const telefoneNumerico = telefone.replace(/\D/g, '');

      if (telefoneNumerico.length < 10 || telefoneNumerico.length > 11) {
        return {
          isValid: false,
          error: 'Telefone deve ter 10 ou 11 dígitos',
        };
      }

      const telefoneComCodigo = telefoneNumerico.startsWith('55') ? `+${telefoneNumerico}` : `+55${telefoneNumerico}`;

      if (!isValidPhoneNumber(telefoneComCodigo, 'BR')) {
        return {
          isValid: false,
          error: 'Número de telefone inválido',
        };
      }

      const phoneNumber = parsePhoneNumberFromString(telefoneComCodigo, 'BR');

      if (!phoneNumber) {
        return {
          isValid: false,
          error: 'Não foi possível processar o telefone',
        };
      }

      const formatted = phoneNumber.format('NATIONAL');

      return {
        isValid: true,
        formatted: formatted,
      };
    } catch (error) {
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
      res.status(500).json({ error: 'Erro ao buscar usuário.' });
    }
  }

  static async getByEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const email = req.params.email;

      if (!email) {
        res.status(400).json({ error: 'E-mail não fornecido' });
        return;
      }

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
      res.status(500).json({
        error: 'Erro ao buscar usuário.',
        details: process.env.NODE_ENV !== 'production' ? String(error) : undefined,
      });
    }
  }

  // MÉTODO ATUALIZADO: Create com suporte a CPF/CNPJ
  static async create(req: Request, res: Response, next: NextFunction): Promise<Response> {
    let { nome, sexo_id, telefone, email, senha, documento: documentoInput, cep, estado_id, cidade_id } = req.body;

    try {
      // Validação de email
      if (email) {
        const validacaoEmail = UsuarioController.validarEmail(email);
        if (!validacaoEmail.isValid) {
          return res.status(400).json({
            error: 'E-mail inválido',
            message: validacaoEmail.errors.join(', '),
            emailErrors: validacaoEmail.errors,
          });
        }
      } else {
        return res.status(400).json({
          error: 'E-mail obrigatório',
          message: 'O e-mail é obrigatório para cadastro.',
        });
      }

      // Validação de CPF/CNPJ
      let tipoDocumento: 'CPF' | 'CNPJ';
      if (documentoInput) {
        const validacaoDocumento = UsuarioController.validarEFormatarDocumento(documentoInput);

        if (!validacaoDocumento.isValid) {
          return res.status(400).json({
            error: 'Documento inválido',
            message: validacaoDocumento.error || 'O documento informado não é válido.',
          });
        }

        documentoInput = validacaoDocumento.formatted;
        tipoDocumento = validacaoDocumento.tipo!;
      } else {
        return res.status(400).json({
          error: 'Documento obrigatório',
          message: 'O CPF ou CNPJ é obrigatório para cadastro.',
        });
      }

      // Validação de telefone
      if (telefone) {
        const validacaoTelefone = UsuarioController.validarEFormatarTelefone(telefone);

        if (!validacaoTelefone.isValid) {
          return res.status(400).json({
            error: 'Telefone inválido',
            message: validacaoTelefone.error || 'O telefone informado não é válido.',
          });
        }

        telefone = validacaoTelefone.formatted;
      } else {
        return res.status(400).json({
          error: 'Telefone obrigatório',
          message: 'O telefone é obrigatório para cadastro.',
        });
      }

      // Validação de senha
      const validacaoSenha = UsuarioController.validarSenha(senha);
      if (!validacaoSenha.isValid) {
        return res.status(400).json({
          error: 'Senha inválida',
          message: validacaoSenha.errors.join(', '),
          passwordErrors: validacaoSenha.errors,
        });
      }

      const senhaHash = await bcrypt.hash(senha, saltRounds);

      // Buscar cidade via CEP se necessário
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

      cep = cep || null;

      // PROCESSAMENTO DE IMAGEM
      let fotoUrl = null;

      if (req.file) {
        const fileName = `${nome.replace(/\s+/g, '_')}_${Date.now()}.jpg`;
        fotoUrl = await UsuarioController.uploadImagemSupabase(req.file.buffer, fileName, req.file.mimetype);
      }

      const usuario = await Usuario.create({
        nome,
        sexo_id,
        telefone,
        email,
        senha: senhaHash,
        documento: documentoInput,
        tipo_documento: tipoDocumento,
        cep,
        foto: fotoUrl,
        estado_id,
        cidade_id,
      });

      return res.status(201).json({
        ...usuario.toJSON(),
        fotoUrl,
      });
    } catch (error) {
      if (error instanceof UniqueConstraintError) {
        const duplicatedField = error.errors?.[0]?.path;
        const duplicateFields: string[] = [];
        let specificMessage = 'Email, documento ou telefone já cadastrado no sistema.';
        let fieldName = '';

        switch (duplicatedField) {
          case 'email':
            specificMessage = 'Este e-mail já está cadastrado no sistema.';
            fieldName = 'email';
            duplicateFields.push('email');
            break;
          case 'documento':
            specificMessage = 'Este documento já está cadastrado no sistema.';
            fieldName = 'documento';
            duplicateFields.push('documento');
            break;
          case 'telefone':
            specificMessage = 'Este telefone já está cadastrado no sistema.';
            fieldName = 'telefone';
            duplicateFields.push('telefone');
            break;
          default:
            try {
              const documentoNumerico = documentoInput?.replace(/\D/g, '');
              const telefoneNumerico = telefone?.replace(/\D/g, '');

              if (email) {
                const existingEmail = await Usuario.findOne({ where: { email } });
                if (existingEmail) {
                  duplicateFields.push('email');
                }
              }

              if (documentoNumerico) {
                const existingDocumento = await Usuario.findOne({ where: { documento: documentoNumerico } });
                if (existingDocumento) {
                  duplicateFields.push('documento');
                }
              }

              if (telefoneNumerico) {
                const existingTelefone = await Usuario.findOne({ where: { telefone: telefoneNumerico } });
                if (existingTelefone) {
                  duplicateFields.push('telefone');
                }
              }

              if (duplicateFields.length > 0) {
                specificMessage = `Os seguintes campos já estão cadastrados: ${duplicateFields.join(', ')}`;
                fieldName = duplicateFields[0];
              }
            } catch (checkError) {}
            break;
        }

        return res.status(400).json({
          error: 'Dados duplicados',
          message: specificMessage,
          duplicateField: fieldName,
          duplicateFields: duplicateFields.length > 0 ? duplicateFields : ['unknown'],
          exists: true,
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

  // MÉTODO ATUALIZADO: Verificação de duplicação para edição
  static async checkDuplicateFieldsForEdit(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId, email, documento, telefone } = req.body;
      const duplicateFields: string[] = [];

      if (!userId) {
        res.status(400).json({ error: 'ID do usuário é obrigatório' });
        return;
      }

      if (email) {
        const existingEmail = await Usuario.findOne({
          where: {
            email,
            id: { [Op.ne]: userId },
          },
        });
        if (existingEmail) {
          duplicateFields.push('email');
        }
      }

      if (documento) {
        const documentoNumerico = documento.replace(/\D/g, '');
        const existingDocumento = await Usuario.findOne({
          where: {
            documento: documentoNumerico,
            id: { [Op.ne]: userId },
          },
        });
        if (existingDocumento) {
          duplicateFields.push('documento');
        }
      }

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
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // MÉTODO ATUALIZADO: Update com suporte a CPF/CNPJ
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

      let {
        foto: bodyFoto,
        nome,
        sexo_id,
        telefone,
        email,
        senha,
        documento: documentoInput,
        cep,
        estado_id,
        cidade_id,
      } = req.body;

      // Validações
      if (email !== undefined && email !== null && email.trim() !== '') {
        const validacaoEmail = UsuarioController.validarEmail(email);
        if (!validacaoEmail.isValid) {
          res.status(400).json({
            error: 'E-mail inválido',
            message: validacaoEmail.errors.join(', '),
            emailErrors: validacaoEmail.errors,
          });
          return;
        }
      }

      let tipoDocumento: 'CPF' | 'CNPJ' | undefined;
      if (documentoInput !== undefined && documentoInput !== null) {
        const validacaoDocumento = UsuarioController.validarEFormatarDocumento(documentoInput);

        if (!validacaoDocumento.isValid) {
          res.status(400).json({
            error: 'Documento inválido',
            message: validacaoDocumento.error || 'O documento informado não é válido.',
          });
          return;
        }

        documentoInput = validacaoDocumento.formatted;
        tipoDocumento = validacaoDocumento.tipo;
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

        telefone = validacaoTelefone.formatted;
      }

      const dadosAtualizados: any = {
        nome,
        sexo_id: sexo_id ? Number(sexo_id) : usuario.sexo_id,
        telefone,
        email,
        documento: documentoInput,
        tipo_documento: tipoDocumento || usuario.tipo_documento,
        cep: cep !== undefined && cep !== null ? cep : usuario.cep,
        estado_id: estado_id ? Number(estado_id) : usuario.estado_id,
        cidade_id: cidade_id ? Number(cidade_id) : usuario.cidade_id,
      };

      if (senha && senha.trim() !== '') {
        const validacaoSenha = UsuarioController.validarSenha(senha);
        if (!validacaoSenha.isValid) {
          res.status(400).json({
            error: 'Senha inválida',
            message: validacaoSenha.errors.join(', '),
            passwordErrors: validacaoSenha.errors,
          });
          return;
        }

        const saltRounds = 10;
        dadosAtualizados.senha = await bcrypt.hash(senha, saltRounds);
      } else {
        delete dadosAtualizados.senha;
      }

      // PROCESSAMENTO DE IMAGEM
      let fotoUrl: string | null = usuario.foto;

      if (req.file) {
        const fileName = `${nome?.replace(/\s+/g, '_') || 'usuario'}_${Date.now()}.jpg`;
        const novaFotoUrl = await UsuarioController.uploadImagemSupabase(
          req.file.buffer,
          fileName,
          req.file.mimetype,
          usuario.foto
        );

        if (novaFotoUrl) {
          fotoUrl = novaFotoUrl;
        }
      } else if (bodyFoto !== undefined) {
        if (!bodyFoto || bodyFoto.trim() === '') {
          if (usuario.foto) {
            await UsuarioController.deletarImagemSupabase(usuario.foto);
          }
          fotoUrl = null;
        } else {
          fotoUrl = bodyFoto;
        }
      } else if (nome && nome !== usuario.nome && usuario.foto) {
        try {
          const response = await fetch(usuario.foto);
          if (response.ok) {
            const buffer = Buffer.from(await response.arrayBuffer());
            const novoFileName = `${nome.replace(/\s+/g, '_')}_${Date.now()}.jpg`;

            const novaFotoUrl = await UsuarioController.uploadImagemSupabase(
              buffer,
              novoFileName,
              'image/jpeg',
              usuario.foto
            );

            if (novaFotoUrl) {
              fotoUrl = novaFotoUrl;
            }
          }
        } catch (error) {
          fotoUrl = usuario.foto;
        }
      }

      dadosAtualizados.foto = fotoUrl;

      await usuario.update(dadosAtualizados, {
        hooks: true,
      });

      const usuarioAtualizado = await Usuario.findByPk(id);

      if (!usuarioAtualizado) {
        res.status(404).json({ error: 'Usuário não encontrado após atualização' });
        return;
      }

      res.json({
        ...usuarioAtualizado.toJSON(),
        fotoUrl,
      });
    } catch (error) {
      if (error instanceof UniqueConstraintError) {
        const duplicatedField = error.errors?.[0]?.path;
        const duplicateFields: string[] = [];
        let specificMessage = 'Email, documento ou telefone já em uso por outro usuário.';
        let fieldName = '';

        switch (duplicatedField) {
          case 'email':
            specificMessage = 'Este e-mail já está sendo usado por outro usuário.';
            fieldName = 'email';
            duplicateFields.push('email');
            break;
          case 'documento':
            specificMessage = 'Este documento já está sendo usado por outro usuário.';
            fieldName = 'documento';
            duplicateFields.push('documento');
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

  // MÉTODO DELETE (mantido igual)
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
          }. Remova ${petCount > 1 ? 'todos os pets' : 'o pet'} antes de excluir sua conta.`,
          success: false,
          petCount: petCount,
        });
        return;
      }

      // Verificar se usuário tem termo de doação
      let termoInfo = null;
      try {
        const termo = await TermoDoacao.findByDoador(id);

        if (termo) {
          termoInfo = {
            id: termo.id,
            motivoDoacao: termo.motivo_doacao,
            dataAssinatura: termo.data_assinatura,
          };

          await TermoDoacao.destroy({
            where: { id: termo.id },
          });
        }
      } catch (termoError) {}

      // DELETAR IMAGEM DO SUPABASE ANTES DE EXCLUIR USUÁRIO
      if (usuario.foto) {
        await UsuarioController.deletarImagemSupabase(usuario.foto);
      }

      // Excluir o usuário
      await usuario.destroy();

      res.status(200).json({
        success: true,
        message: 'Conta excluída com sucesso',
        title: 'Conta Excluída',
        data: {
          usuarioId: id,
          usuarioNome: usuario.nome,
          usuarioEmail: usuario.email,
          fotoExcluida: !!usuario.foto,
          termoExcluido: !!termoInfo,
          termoInfo: termoInfo,
          dataExclusao: new Date().toISOString(),
        },
      });
    } catch (error) {
      if (error instanceof DatabaseError) {
        res.status(400).json({
          title: 'Erro ao Excluir Conta',
          error: 'Não foi possível excluir',
          message:
            'Este usuário possui registros relacionados e não pode ser excluído. Entre em contato com o suporte.',
          success: false,
        });
      } else {
        res.status(500).json({
          title: 'Erro Interno',
          error: 'Erro ao deletar usuário.',
          message: 'Ocorreu um erro interno. Tente novamente mais tarde.',
          success: false,
        });
      }
    }
  }

  static async podeExcluirConta(req: Request, res: Response, next: NextFunction): Promise<void> {
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

      const petCount = await Pet.count({
        where: { usuario_id: id },
      });

      let temTermo = false;
      let termoInfo = null;
      try {
        const termo = await TermoDoacao.findByDoador(id);
        if (termo) {
          temTermo = true;
          termoInfo = {
            id: termo.id,
            dataAssinatura: termo.data_assinatura,
            motivoDoacao: termo.motivo_doacao,
          };
        }
      } catch (error) {}

      const podeExcluir = petCount === 0;

      res.json({
        message: 'Verificação concluída',
        data: {
          podeExcluir,
          motivoImpedimento: podeExcluir ? null : 'pets_cadastrados',
          petCount,
          temTermo,
          termoInfo,
          usuario: {
            id: usuario.id,
            nome: usuario.nome,
            email: usuario.email,
          },
        },
      });
    } catch (error: any) {
      res.status(500).json({
        error: 'Erro interno do servidor',
        message: error.message,
      });
    }
  }

  private static gerarCodigoAleatorio(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  static async sendRecoveryCode(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email } = req.body;

      if (!email) {
        res.status(400).json({ error: 'Email é obrigatório' });
        return;
      }

      const validacaoEmail = UsuarioController.validarEmail(email);
      if (!validacaoEmail.isValid) {
        res.status(400).json({
          error: 'E-mail inválido',
          message: validacaoEmail.errors.join(', '),
          emailErrors: validacaoEmail.errors,
        });
        return;
      }

      const usuario = await Usuario.findOne({
        where: { email },
      });

      if (!usuario) {
        res.status(404).json({ error: 'Email não encontrado em nossa base de dados' });
        return;
      }

      const codigo = UsuarioController.gerarCodigoAleatorio();

      const expiracao = new Date();
      expiracao.setMinutes(expiracao.getMinutes() + 4);

      await RecuperacaoSenha.update({ expirado: true }, { where: { usuario_id: usuario.id, expirado: false } });

      await RecuperacaoSenha.create({
        usuario_id: usuario.id,
        email: usuario.email,
        codigo,
        expiracao,
        expirado: false,
      });

      const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: Number(process.env.EMAIL_PORT) || 587,
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

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

      await transporter.sendMail(mailOptions);

      res.status(200).json({
        success: true,
        message: 'Código enviado com sucesso para o email cadastrado!',
        usuarioId: usuario.id,
      });
    } catch (error) {
      res.status(500).json({
        error: 'Erro ao enviar código de recuperação.',
        details: process.env.NODE_ENV !== 'production' ? String(error) : undefined,
      });
    }
  }

  static async checkCode(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, codigo } = req.body;

      if (!email || !codigo) {
        res.status(400).json({ error: 'Email e código são obrigatórios' });
        return;
      }

      const recuperacao = await RecuperacaoSenha.findOne({
        where: {
          email,
          codigo,
          expirado: false,
          expiracao: { [Op.gt]: new Date() },
        },
        order: [['createdAt', 'DESC']],
      });

      if (!recuperacao) {
        res.status(400).json({ error: 'Código inválido ou expirado' });
        return;
      }

      await recuperacao.update({ expirado: true });

      res.status(200).json({
        success: true,
        message: 'Código verificado com sucesso!',
        usuarioId: recuperacao.usuario_id,
      });
    } catch (error) {
      res.status(500).json({
        error: 'Erro ao verificar código.',
        details: process.env.NODE_ENV !== 'production' ? String(error) : undefined,
      });
    }
  }
}