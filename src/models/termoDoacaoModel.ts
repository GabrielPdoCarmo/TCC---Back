// models/termoDoacaoModel.ts - Modelo atualizado com método de atualização de dados completos

import { Table, Column, Model, DataType, ForeignKey, BelongsTo, BeforeSave } from 'sequelize-typescript';
import { Usuario } from './usuarioModel';
import { Cidade } from './cidadeModel';
import { Estado } from './estadoModel';

@Table({
  tableName: 'TermosDoacao',
  timestamps: true, // createdAt e updatedAt
})
export class TermoDoacao extends Model {
  @Column({ type: DataType.INTEGER, autoIncrement: true, primaryKey: true })
  id!: number;

  // === RELACIONAMENTO ===
  @ForeignKey(() => Usuario)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    comment: 'ID do usuário responsável (doador)',
  })
  doador_id!: number;

  // === DADOS DO DOADOR (snapshot no momento da assinatura) ===
  @Column({
    type: DataType.STRING(255),
    allowNull: false,
    comment: 'Nome do doador',
  })
  doador_nome!: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
    comment: 'Email do doador',
  })
  doador_email!: string;

  @Column({
    type: DataType.STRING(20),
    allowNull: true,
    comment: 'Telefone do doador',
  })
  doador_telefone?: string;

  @Column({
    type: DataType.STRING(14),
    allowNull: true,
    comment: 'CPF do doador',
  })
  doador_cpf?: string;

  @ForeignKey(() => Estado)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    comment: 'Estado do doador',
  })
  doador_estado_id?: number;

  @ForeignKey(() => Cidade)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    comment: 'Cidade do doador',
  })
  doador_cidade_id?: number;

  // === MOTIVAÇÃO E OBSERVAÇÕES ===
  @Column({
    type: DataType.TEXT,
    allowNull: false,
    comment: 'Motivo da doação / situação atual',
  })
  motivo_doacao!: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    comment: 'Condições específicas para adoção dos pets',
  })
  condicoes_adocao?: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    comment: 'Observações ou informações adicionais do doador',
  })
  observacoes?: string;

  // === COMPROMISSOS E CONDIÇÕES ===
  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Confirma que é responsável pelos pets que cadastrar',
  })
  confirma_responsavel_legal!: boolean;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Autoriza visitas de potenciais adotantes',
  })
  autoriza_visitas!: boolean;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Aceita acompanhamento pós-adoção',
  })
  aceita_acompanhamento!: boolean;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Confirma que fornecerá informações verdadeiras sobre saúde dos pets',
  })
  confirma_saude!: boolean;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Autoriza verificação de antecedentes dos adotantes',
  })
  autoriza_verificacao!: boolean;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Compromete-se a manter contato durante processo de adoção',
  })
  compromete_contato!: boolean;

  // === DADOS DA ASSINATURA ===
  @Column({
    type: DataType.STRING(255),
    allowNull: false,
    comment: 'Nome digitado como assinatura',
  })
  assinatura_digital!: string;

  @Column({
    type: DataType.DATE,
    allowNull: false,
    comment: 'Data e hora da assinatura',
  })
  data_assinatura!: Date;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
    comment: 'Hash MD5 do documento para verificação de integridade',
  })
  hash_documento?: string;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    comment: 'Data de envio do PDF por email',
  })
  data_envio_pdf?: Date;

  // === RELACIONAMENTOS ===
  @BelongsTo(() => Usuario, { foreignKey: 'doador_id' })
  doador!: Usuario;
                          
  @BelongsTo(() => Estado, { foreignKey: 'doador_estado_id' })
  estado!: Estado;

  @BelongsTo(() => Cidade, { foreignKey: 'doador_cidade_id' })
  cidade!: Cidade;

  // === HOOKS ===
  @BeforeSave
  static async atualizarHash(instance: TermoDoacao) {
    instance.hash_documento = instance.gerarHashDocumento();
  }

  // === MÉTODOS DE INSTÂNCIA ===

  /**
   * Gerar hash do documento para verificação de integridade
   */
  public gerarHashDocumento(): string {
    const crypto = require('crypto');
    const dados = `${this.doador_nome}${this.doador_email}${this.doador_telefone}${this.doador_cidade_id}${this.doador_estado_id}${this.assinatura_digital}${this.data_assinatura}${this.motivo_doacao}`;
    return crypto.createHash('md5').update(dados).digest('hex');
  }

  /**
   * Verificar integridade do documento
   */
  public verificarIntegridade(): boolean {
    const hashAtual = this.gerarHashDocumento();
    return hashAtual === this.hash_documento;
  }

  /**
   * Verificar se todos os compromissos foram aceitos
   */
  public validarCompromissos(): boolean {
    return (
      this.confirma_responsavel_legal &&
      this.autoriza_visitas &&
      this.aceita_acompanhamento &&
      this.confirma_saude &&
      this.autoriza_verificacao &&
      this.compromete_contato
    );
  }

  /**
   * Marcar PDF como enviado
   */
  public marcarPdfEnviado(): void {
    this.data_envio_pdf = new Date();
  }

  // === MÉTODOS ESTÁTICOS ===

  /**
   * Criar termo de doação
   */
  static async criarComDados(data: {
    doador_id: number;
    doador_nome: string;
    doador_email: string;
    doador_telefone: string;
    doador_cpf: string;
    doador_cidade_id: number;
    doador_estado_id: number;
    motivo_doacao: string;
    assinatura_digital: string;
    condicoes_adocao?: string;
    observacoes?: string;
    confirma_responsavel_legal: boolean;
    autoriza_visitas: boolean;
    aceita_acompanhamento: boolean;
    confirma_saude: boolean;
    autoriza_verificacao: boolean;
    compromete_contato: boolean;
  }): Promise<TermoDoacao> {
    const { Usuario } = require('./usuarioModel');

    // Buscar dados do doador
    const doador = await Usuario.findByPk(data.doador_id);
    if (!doador) {
      throw new Error('Usuário doador não encontrado');
    }

    // Verificar se já existe termo para este usuário
    const termoExistente = await this.findOne({
      where: {
        doador_id: data.doador_id,
      },
    });

    if (termoExistente) {
      throw new Error('Usuário já possui um termo de responsabilidade');
    }

    // Validar se todos os compromissos foram aceitos
    if (
      !data.confirma_responsavel_legal ||
      !data.autoriza_visitas ||
      !data.aceita_acompanhamento ||
      !data.confirma_saude ||
      !data.autoriza_verificacao ||
      !data.compromete_contato
    ) {
      throw new Error('Todos os compromissos devem ser aceitos para poder cadastrar pets para doação');
    }

    // Criar termo
    const termo = await this.create({
      doador_id: data.doador_id,

      // Snapshot do doador
      doador_nome: doador.nome,
      doador_email: doador.email,
      doador_telefone: doador.telefone || null,
      doador_cpf: doador.cpf || null,
      doador_cidade_id: doador.cidade_id || null,
      doador_estado_id: doador.estado_id || null,

      // Dados específicos do termo
      motivo_doacao: data.motivo_doacao,
      condicoes_adocao: data.condicoes_adocao || null,
      observacoes: data.observacoes || null,

      // Compromissos
      confirma_responsavel_legal: data.confirma_responsavel_legal,
      autoriza_visitas: data.autoriza_visitas,
      aceita_acompanhamento: data.aceita_acompanhamento,
      confirma_saude: data.confirma_saude,
      autoriza_verificacao: data.autoriza_verificacao,
      compromete_contato: data.compromete_contato,

      // Assinatura
      assinatura_digital: data.assinatura_digital,
      data_assinatura: new Date(),
    });

    return termo;
  }

  /**
   * 🆕 ATUALIZAR TERMO EXISTENTE COM DADOS ATUALIZADOS (NOME, EMAIL, TELEFONE)
   * @param termoId - ID do termo a ser atualizado
   * @param data - Novos dados para atualização
   */
  static async atualizarComDadosAtualizados(termoId: number, data: {
    doador_id: number;
    doador_nome: string;
    doador_email: string;
    doador_telefone?: string;
    doador_cpf?: string;
    doador_cidade_id?: number;
    doador_estado_id?: number;
    motivo_doacao: string;
    assinatura_digital: string;
    condicoes_adocao?: string;
    observacoes?: string;
    confirma_responsavel_legal: boolean;
    autoriza_visitas: boolean;
    aceita_acompanhamento: boolean;
    confirma_saude: boolean;
    autoriza_verificacao: boolean;
    compromete_contato: boolean;
  }): Promise<TermoDoacao> {
    console.log('🔄 Atualizando termo existente com dados atualizados:', { 
      termoId, 
      novoNome: data.doador_nome,
      novoEmail: data.doador_email,
      novoTelefone: data.doador_telefone,
      novaCidade: data.doador_cidade_id,
      novoEstado: data.doador_estado_id
    });

    // Buscar termo existente
    const termo = await this.findByPk(termoId);
    if (!termo) {
      throw new Error('Termo não encontrado para atualização');
    }

    // Verificar se pertence ao usuário correto
    if (termo.doador_id !== data.doador_id) {
      throw new Error('Termo não pertence ao usuário informado');
    }

    // Validar se todos os compromissos foram aceitos
    if (
      !data.confirma_responsavel_legal ||
      !data.autoriza_visitas ||
      !data.aceita_acompanhamento ||
      !data.confirma_saude ||
      !data.autoriza_verificacao ||
      !data.compromete_contato
    ) {
      throw new Error('Todos os compromissos devem ser aceitos para atualizar o termo');
    }

    // Log dos dados anteriores
    console.log('📋 Dados anteriores do termo:', {
      nome: termo.doador_nome,
      email: termo.doador_email,
      telefone: termo.doador_telefone,
      cidade_id: termo.doador_cidade_id,
      estado_id: termo.doador_estado_id,
      dataAssinatura: termo.data_assinatura
    });

    // Atualizar termo com novos dados
    const termoAtualizado = await termo.update({
      // Atualizar snapshot do doador com dados atuais
      doador_nome: data.doador_nome,
      doador_email: data.doador_email,
      doador_telefone: data.doador_telefone || null,
      doador_cpf: data.doador_cpf || null,
      doador_cidade_id: data.doador_cidade_id || null,
      doador_estado_id: data.doador_estado_id || null,

      // Atualizar dados específicos do termo
      motivo_doacao: data.motivo_doacao,
      condicoes_adocao: data.condicoes_adocao || null,
      observacoes: data.observacoes || null,

      // Atualizar compromissos
      confirma_responsavel_legal: data.confirma_responsavel_legal,
      autoriza_visitas: data.autoriza_visitas,
      aceita_acompanhamento: data.aceita_acompanhamento,
      confirma_saude: data.confirma_saude,
      autoriza_verificacao: data.autoriza_verificacao,
      compromete_contato: data.compromete_contato,

      // Atualizar assinatura
      assinatura_digital: data.assinatura_digital,
      data_assinatura: new Date(), // Nova data de assinatura
      
      // Resetar data de envio do PDF para enviar novo
      data_envio_pdf: null,

      // Hash será recalculado automaticamente pelo hook @BeforeSave
    });

    console.log('✅ Termo atualizado com sucesso:', { 
      termoId: termoAtualizado.id, 
      novoNome: termoAtualizado.doador_nome,
      novoEmail: termoAtualizado.doador_email,
      novoTelefone: termoAtualizado.doador_telefone,
      novaCidade: termoAtualizado.doador_cidade_id,
      novoEstado: termoAtualizado.doador_estado_id,
      novaDataAssinatura: termoAtualizado.data_assinatura
    });

    return termoAtualizado;
  }

  /**
   * Buscar termo por usuário
   */
  static async findByDoador(usuarioId: number): Promise<TermoDoacao | null> {
    return await this.findOne({
      where: {
        doador_id: usuarioId,
      },
      include: [
        { model: Usuario, as: 'doador' },
        { model: Estado, as: 'estado' },
        { model: Cidade, as: 'cidade' },
      ],
    });
  }

  /**
   * Verificar se usuário pode cadastrar pets (tem termo ativo)
   */
  static async usuarioPodeCadastrarPets(usuarioId: number): Promise<boolean> {
    const termo = await this.findByDoador(usuarioId);
    return termo !== null;
  }

  /**
   * 🆕 VERIFICAR SE DADOS DO USUÁRIO MUDARAM E PRECISA ATUALIZAR TERMO
   * @param usuarioId - ID do usuário
   * @param dadosAtuaisUsuario - Dados atuais do usuário (nome, email, telefone, cidade, estado)
   * @returns Promise com status sobre atualização de dados
   */
  static async precisaAtualizarPorDados(usuarioId: number, dadosAtuaisUsuario: {
    nome: string;
    email: string;
    telefone?: string;
    cidade_id?: number | null;
    estado_id?: number | null;
  }): Promise<{
    precisaAtualizar: boolean;
    termo?: TermoDoacao;
    dadosNoTermo?: {
      nome: string;
      email: string;
      telefone?: string;
      cidade_id?: number | null;
      estado_id?: number | null;
    };
    diferencias?: {
      nome: boolean;
      email: boolean;
      telefone: boolean;
      cidade: boolean;
      estado: boolean;
    };
  }> {
    try {
      const termo = await this.findByDoador(usuarioId);
      
      if (!termo) {
        // Não tem termo, não precisa atualizar
        return { precisaAtualizar: false };
      }

      const dadosNoTermo = {
        nome: termo.doador_nome || '',
        email: termo.doador_email || '',
        telefone: termo.doador_telefone || '',
        cidade_id: termo.doador_cidade_id || null,
        estado_id: termo.doador_estado_id || null,
      };

      const dadosAtuais = {
        nome: dadosAtuaisUsuario.nome || '',
        email: dadosAtuaisUsuario.email || '',
        telefone: dadosAtuaisUsuario.telefone || '',
        cidade_id: dadosAtuaisUsuario.cidade_id || null,
        estado_id: dadosAtuaisUsuario.estado_id || null,
      };

      // Verificar diferenças em cada campo (incluindo localização)
      const diferencias = {
        nome: dadosAtuais.nome.trim() !== dadosNoTermo.nome.trim(),
        email: dadosAtuais.email.trim() !== dadosNoTermo.email.trim(),
        telefone: dadosAtuais.telefone.trim() !== dadosNoTermo.telefone.trim(),
        cidade: dadosAtuais.cidade_id !== dadosNoTermo.cidade_id,
        estado: dadosAtuais.estado_id !== dadosNoTermo.estado_id,
      };

      const precisaAtualizar = diferencias.nome || diferencias.email || diferencias.telefone || diferencias.cidade || diferencias.estado;

      console.log('🔍 Verificando necessidade de atualização por dados alterados (incluindo localização):', {
        usuarioId,
        dadosAtuais,
        dadosNoTermo,
        diferencias,
        precisaAtualizar
      });

      return {
        precisaAtualizar,
        termo,
        dadosNoTermo,
        diferencias,
      };

    } catch (error) {
      console.error('❌ Erro ao verificar necessidade de atualização de dados:', error);
      return { precisaAtualizar: false };
    }
  }

  /**
   * Buscar todos os termos de um doador (histórico)
   */
  static async findAllByDoador(usuarioId: number): Promise<TermoDoacao[]> {
    return await this.findAll({
      where: { doador_id: usuarioId },
      include: [
        { model: Usuario, as: 'doador' },
        { model: Estado, as: 'estado' },
        { model: Cidade, as: 'cidade' },
      ],
      order: [['data_assinatura', 'DESC']],
    });
  }

  /**
   * Estatísticas simples
   */
  static async contarTermos(): Promise<{
    total: number;
    hoje: number;
    esteMes: number;
  }> {
    const hoje = new Date();
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const inicioHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());

    const { Op } = require('sequelize');

    const [total, hoje_count, mes_count] = await Promise.all([
      this.count(),
      this.count({
        where: {
          data_assinatura: {
            [Op.gte]: inicioHoje,
          },
        },
      }),
      this.count({
        where: {
          data_assinatura: {
            [Op.gte]: inicioMes,
          },
        },
      }),
    ]);

    return {
      total,
      hoje: hoje_count,
      esteMes: mes_count,
    };
  }
}