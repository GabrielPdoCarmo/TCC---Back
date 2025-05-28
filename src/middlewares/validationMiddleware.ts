// middlewares/validationMiddleware.ts - Middleware de validação

import { Request, Response, NextFunction } from 'express';
import { body, validationResult, ValidationChain } from 'express-validator';

/**
 * 📋 Validações para criação de Termo de Compromisso
 */
export const validateTermoCompromisso: ValidationChain[] = [
  // === DADOS DO PET ===
  body('petId')
    .isInt({ min: 1 })
    .withMessage('Pet ID deve ser um número inteiro positivo'),
    
  body('petNome')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Nome do pet é obrigatório e deve ter até 255 caracteres')
    .matches(/^[a-zA-ZÀ-ÿ\s\-'\.]+$/)
    .withMessage('Nome do pet contém caracteres inválidos'),
    
  body('petRaca')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Raça do pet é obrigatória e deve ter até 255 caracteres'),
    
  body('petIdade')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Idade do pet é obrigatória e deve ter até 50 caracteres'),

  // === DADOS DO DOADOR ===
  body('doadorNome')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Nome do doador é obrigatório e deve ter até 255 caracteres')
    .matches(/^[a-zA-ZÀ-ÿ\s\-'\.]+$/)
    .withMessage('Nome do doador contém caracteres inválidos'),
    
  body('doadorTelefone')
    .optional()
    .custom((value) => {
      if (value && !/^\(\d{2}\)\s\d{4,5}-\d{4}$|^\d{10,11}$/.test(value.replace(/\s/g, ''))) {
        throw new Error('Telefone do doador deve estar no formato (XX) XXXXX-XXXX ou apenas números');
      }
      return true;
    }),
    
  body('doadorEmail')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Email do doador deve ser válido'),

  // === DADOS DO ADOTANTE ===
  body('adotanteNome')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Nome do adotante é obrigatório e deve ter até 255 caracteres')
    .matches(/^[a-zA-ZÀ-ÿ\s\-'\.]+$/)
    .withMessage('Nome do adotante contém caracteres inválidos'),
    
  body('adotanteEmail')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email do adotante deve ser válido')
    .isLength({ max: 255 })
    .withMessage('Email do adotante deve ter até 255 caracteres'),
    
  body('adotanteTelefone')
    .optional()
    .custom((value) => {
      if (value && !/^\(\d{2}\)\s\d{4,5}-\d{4}$|^\d{10,11}$/.test(value.replace(/\s/g, ''))) {
        throw new Error('Telefone do adotante deve estar no formato (XX) XXXXX-XXXX ou apenas números');
      }
      return true;
    }),
    
  body('adotanteCpf')
    .optional()
    .custom((value) => {
      if (value) {
        // Remove formatação do CPF
        const cpf = value.replace(/\D/g, '');
        
        // Verifica se tem 11 dígitos
        if (cpf.length !== 11) {
          throw new Error('CPF deve conter exatamente 11 dígitos');
        }
        
        // Verifica se não são todos iguais
        if (/^(\d)\1{10}$/.test(cpf)) {
          throw new Error('CPF inválido');
        }
        
        // Validação do CPF usando algoritmo
        let sum = 0;
        for (let i = 0; i < 9; i++) {
          sum += parseInt(cpf.charAt(i)) * (10 - i);
        }
        let remainder = (sum * 10) % 11;
        if (remainder === 10 || remainder === 11) remainder = 0;
        if (remainder !== parseInt(cpf.charAt(9))) {
          throw new Error('CPF inválido');
        }

        sum = 0;
        for (let i = 0; i < 10; i++) {
          sum += parseInt(cpf.charAt(i)) * (11 - i);
        }
        remainder = (sum * 10) % 11;
        if (remainder === 10 || remainder === 11) remainder = 0;
        if (remainder !== parseInt(cpf.charAt(10))) {
          throw new Error('CPF inválido');
        }
      }
      return true;
    }),
    
  body('adotanteEndereco')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Endereço do adotante deve ter até 500 caracteres'),

  // === DADOS DO TERMO ===
  body('assinaturaDigital')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Assinatura digital é obrigatória e deve ter até 255 caracteres'),
    
  body('dataAssinatura')
    .isISO8601()
    .withMessage('Data de assinatura deve estar no formato ISO 8601 (YYYY-MM-DDTHH:mm:ss.sssZ)')
    .custom((value) => {
      const dataAssinatura = new Date(value);
      const hoje = new Date();
      const umAnoAtras = new Date();
      umAnoAtras.setFullYear(hoje.getFullYear() - 1);
      
      if (dataAssinatura > hoje) {
        throw new Error('Data de assinatura não pode ser no futuro');
      }
      
      if (dataAssinatura < umAnoAtras) {
        throw new Error('Data de assinatura muito antiga (máximo 1 ano)');
      }
      
      return true;
    }),
    
  body('termoVersao')
    .optional()
    .isLength({ max: 10 })
    .withMessage('Versão do termo deve ter até 10 caracteres')
    .matches(/^\d+\.\d+$/)
    .withMessage('Versão do termo deve estar no formato X.Y (ex: 1.0)'),

  body('observacoes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Observações devem ter até 1000 caracteres')
];

/**
 * 🔍 Validações para atualização de status
 */
export const validateStatusUpdate: ValidationChain[] = [
  body('status')
    .isIn(['ATIVO', 'CANCELADO', 'CONCLUIDO', 'SUSPENSO'])
    .withMessage('Status deve ser: ATIVO, CANCELADO, CONCLUIDO ou SUSPENSO'),
    
  body('motivo')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Motivo deve ter até 500 caracteres')
];

/**
 * 🔍 Validações para parâmetros de busca
 */
export const validateSearchParams: ValidationChain[] = [
  body('status')
    .optional()
    .isIn(['ATIVO', 'CANCELADO', 'CONCLUIDO', 'SUSPENSO'])
    .withMessage('Status deve ser: ATIVO, CANCELADO, CONCLUIDO ou SUSPENSO'),
    
  body('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit deve ser um número entre 1 e 100'),
    
  body('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Offset deve ser um número maior ou igual a 0')
];

/**
 * ⚠️ Middleware para verificar erros de validação
 * Deve ser usado após as validações
 */
export const handleValidationErrors = (
  req: Request, 
  res: Response, 
  next: NextFunction
): void => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(error => ({
      field: error.type === 'field' ? error.path : 'unknown',
      message: error.msg,
      value: error.type === 'field' ? error.value : undefined
    }));

    res.status(400).json({
      error: 'Dados de entrada inválidos',
      message: 'Verifique os campos e tente novamente',
      details: formattedErrors,
      timestamp: new Date().toISOString()
    });
    return;
  }
  
  next();
};

/**
 * 🛡️ Middleware combinado para validação de termo de compromisso
 */
export const validateTermoCompromissoMiddleware = [
  ...validateTermoCompromisso,
  handleValidationErrors
];

/**
 * 🛡️ Middleware combinado para validação de atualização de status
 */
export const validateStatusUpdateMiddleware = [
  ...validateStatusUpdate,
  handleValidationErrors
];

/**
 * 🔧 Sanitização de dados de entrada
 */
export const sanitizeTermoData = (req: Request, res: Response, next: NextFunction): void => {
  if (req.body) {
    // Remover espaços extras dos campos de texto
    const textFields = [
      'petNome', 'petRaca', 'petIdade', 'doadorNome', 'doadorEmail',
      'adotanteNome', 'adotanteEmail', 'adotanteEndereco', 'assinaturaDigital',
      'termoVersao', 'observacoes'
    ];

    textFields.forEach(field => {
      if (req.body[field] && typeof req.body[field] === 'string') {
        req.body[field] = req.body[field].trim().replace(/\s+/g, ' ');
      }
    });

    // Normalizar telefones (remover formatação)
    if (req.body.doadorTelefone) {
      req.body.doadorTelefone = req.body.doadorTelefone.replace(/\D/g, '');
    }
    
    if (req.body.adotanteTelefone) {
      req.body.adotanteTelefone = req.body.adotanteTelefone.replace(/\D/g, '');
    }

    // Normalizar CPF (remover formatação)
    if (req.body.adotanteCpf) {
      req.body.adotanteCpf = req.body.adotanteCpf.replace(/\D/g, '');
    }

    // Converter petId para número
    if (req.body.petId) {
      req.body.petId = parseInt(req.body.petId);
    }
  }

  next();
};