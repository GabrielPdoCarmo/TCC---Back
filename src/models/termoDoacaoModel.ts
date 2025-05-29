// models/termoDoacaoModel.ts - Modelo para Termo de Responsabilidade de Doação

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



  // === DADOS PARA PDF ===
  @Column({
    type: DataType.STRING(500),
    allowNull: true,
    comment: 'Caminho do arquivo PDF gerado',
  })
  caminho_pdf?: string;

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
    const dados = `${this.doador_nome}${this.doador_email}${this.assinatura_digital}${this.data_assinatura}${this.motivo_doacao}`;
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
    const { Usuario } = require('./index');

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