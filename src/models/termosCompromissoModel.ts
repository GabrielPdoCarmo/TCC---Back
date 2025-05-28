import { Table, Column, Model, DataType, ForeignKey, BelongsTo, BeforeCreate, AfterCreate } from 'sequelize-typescript';
import { Pet } from './petModel';
import { Usuario } from './usuarioModel';

@Table({
  tableName: 'TermosCompromisso',
  timestamps: true, // Para createdAt e updatedAt automáticos
})
export class TermoCompromisso extends Model {
  @Column({ type: DataType.INTEGER, autoIncrement: true, primaryKey: true })
  id!: number;

  @Column({ 
    type: DataType.STRING(255), 
    allowNull: false,
    unique: true,
    comment: 'ID único do termo no formato TERMO-{petId}-{timestamp}'
  })
  termo_id!: string;

  @ForeignKey(() => Pet)
  @Column({ type: DataType.INTEGER, allowNull: false })
  pet_id!: number;

  @ForeignKey(() => Usuario)
  @Column({ 
    type: DataType.INTEGER, 
    allowNull: false,
    comment: 'ID do usuário adotante'
  })
  usuario_id!: number;

  // === DADOS DO PET ===
  @Column({ 
    type: DataType.STRING(255), 
    allowNull: false,
    comment: 'Nome do pet no momento da assinatura'
  })
  pet_nome!: string;

  @Column({ 
    type: DataType.STRING(255), 
    allowNull: false,
    comment: 'Raça do pet no momento da assinatura'
  })
  pet_raca!: string;

  @Column({ 
    type: DataType.STRING(50), 
    allowNull: false,
    comment: 'Idade do pet no momento da assinatura'
  })
  pet_idade!: string;

  // === DADOS DO DOADOR ===
  @Column({ 
    type: DataType.STRING(255), 
    allowNull: false,
    comment: 'Nome do responsável pelo pet (doador)'
  })
  doador_nome!: string;

  @Column({ 
    type: DataType.STRING(20), 
    allowNull: true,
    comment: 'Telefone do doador'
  })
  doador_telefone?: string;

  @Column({ 
    type: DataType.STRING(255), 
    allowNull: true,
    comment: 'Email do doador'
  })
  doador_email?: string;

  // === DADOS DO ADOTANTE ===
  @Column({ 
    type: DataType.STRING(255), 
    allowNull: false,
    comment: 'Nome completo do adotante'
  })
  adotante_nome!: string;

  @Column({ 
    type: DataType.STRING(255), 
    allowNull: false,
    comment: 'Email do adotante'
  })
  adotante_email!: string;

  @Column({ 
    type: DataType.STRING(20), 
    allowNull: true,
    comment: 'Telefone do adotante'
  })
  adotante_telefone?: string;

  @Column({ 
    type: DataType.STRING(14), 
    allowNull: true,
    comment: 'CPF do adotante (sem formatação)'
  })
  adotante_cpf?: string;

  @Column({ 
    type: DataType.TEXT, 
    allowNull: true,
    comment: 'Endereço completo do adotante'
  })
  adotante_endereco?: string;

  // === DADOS DA ASSINATURA ===
  @Column({ 
    type: DataType.STRING(255), 
    allowNull: false,
    comment: 'Nome digitado como assinatura digital'
  })
  assinatura_digital!: string;

  @Column({ 
    type: DataType.DATE, 
    allowNull: false,
    comment: 'Data e hora da assinatura'
  })
  data_assinatura!: Date;

  @Column({ 
    type: DataType.STRING(10), 
    allowNull: false,
    defaultValue: '1.0',
    comment: 'Versão do termo utilizado'
  })
  termo_versao!: string;

  @Column({ 
    type: DataType.STRING(45), 
    allowNull: false,
    comment: 'IP do usuário no momento da assinatura'
  })
  ip_usuario!: string;

  @Column({ 
    type: DataType.TEXT, 
    allowNull: true,
    comment: 'User-Agent do navegador/app'
  })
  user_agent?: string;

  // === CONTROLE DE STATUS ===
  @Column({ 
    type: DataType.ENUM('ATIVO', 'CANCELADO', 'CONCLUIDO', 'SUSPENSO'), 
    allowNull: false,
    defaultValue: 'ATIVO',
    comment: 'Status atual do termo'
  })
  status!: 'ATIVO' | 'CANCELADO' | 'CONCLUIDO' | 'SUSPENSO';

  @Column({ 
    type: DataType.TEXT, 
    allowNull: true,
    comment: 'Motivo da alteração de status'
  })
  motivo_alteracao?: string;

  @Column({ 
    type: DataType.DATE, 
    allowNull: true,
    comment: 'Data da última alteração de status'
  })
  data_alteracao?: Date;

  @Column({ 
    type: DataType.INTEGER, 
    allowNull: true,
    comment: 'ID do usuário que alterou o status'
  })
  alterado_por?: number;

  // === DADOS ADICIONAIS ===
  @Column({ 
    type: DataType.TEXT, 
    allowNull: true,
    comment: 'Observações adicionais sobre o termo'
  })
  observacoes?: string;

  @Column({ 
    type: DataType.BOOLEAN, 
    allowNull: false,
    defaultValue: false,
    comment: 'Se o termo foi enviado por email'
  })
  email_enviado!: boolean;

  @Column({ 
    type: DataType.DATE, 
    allowNull: true,
    comment: 'Data do envio por email'
  })
  data_envio_email?: Date;

  @Column({ 
    type: DataType.STRING(255), 
    allowNull: true,
    comment: 'Hash MD5 do documento para verificação de integridade'
  })
  hash_documento?: string;

  @Column({ 
    type: DataType.DATE, 
    allowNull: true,
    comment: 'Data de vencimento do termo (se aplicável)'
  })
  data_vencimento?: Date;

  // === RELACIONAMENTOS ===
  @BelongsTo(() => Pet)
  pet!: Pet;

  @BelongsTo(() => Usuario)
  adotante!: Usuario;

  // === HOOKS ===
  @BeforeCreate
  static async gerarTermoId(instance: TermoCompromisso) {
    if (!instance.termo_id) {
      const timestamp = Date.now();
      instance.termo_id = `TERMO-${instance.pet_id}-${timestamp}`;
    }
  }

  @AfterCreate
  static async logCriacao(instance: TermoCompromisso) {
    console.log(`✅ Termo criado: ${instance.termo_id} - Pet: ${instance.pet_nome} - Adotante: ${instance.adotante_nome}`);
  }

  // === MÉTODOS DE INSTÂNCIA ===
  
  /**
   * Verificar se o termo ainda está válido
   */
  public isValido(): boolean {
    if (this.status !== 'ATIVO') {
      return false;
    }

    if (this.data_vencimento && new Date() > this.data_vencimento) {
      return false;
    }

    return true;
  }

  /**
   * Cancelar o termo
   */
  public async cancelar(motivo: string, usuarioId?: number): Promise<void> {
    this.status = 'CANCELADO';
    this.motivo_alteracao = motivo;
    this.data_alteracao = new Date();
    this.alterado_por = usuarioId;
    
    await this.save();
    
    console.log(`❌ Termo cancelado: ${this.termo_id} - Motivo: ${motivo}`);
  }

  /**
   * Concluir o termo (adoção finalizada)
   */
  public async concluir(observacoes?: string, usuarioId?: number): Promise<void> {
    this.status = 'CONCLUIDO';
    this.motivo_alteracao = observacoes || 'Adoção concluída com sucesso';
    this.data_alteracao = new Date();
    this.alterado_por = usuarioId;
    
    await this.save();
    
    console.log(`✅ Termo concluído: ${this.termo_id}`);
  }

  /**
   * Suspender o termo temporariamente
   */
  public async suspender(motivo: string, usuarioId?: number): Promise<void> {
    this.status = 'SUSPENSO';
    this.motivo_alteracao = motivo;
    this.data_alteracao = new Date();
    this.alterado_por = usuarioId;
    
    await this.save();
    
    console.log(`⏸️ Termo suspenso: ${this.termo_id} - Motivo: ${motivo}`);
  }

  /**
   * Reativar termo suspenso
   */
  public async reativar(motivo: string, usuarioId?: number): Promise<void> {
    if (this.status !== 'SUSPENSO') {
      throw new Error('Apenas termos suspensos podem ser reativados');
    }

    this.status = 'ATIVO';
    this.motivo_alteracao = motivo;
    this.data_alteracao = new Date();
    this.alterado_por = usuarioId;
    
    await this.save();
    
    console.log(`▶️ Termo reativado: ${this.termo_id}`);
  }

  /**
   * Marcar email como enviado
   */
  public async marcarEmailEnviado(): Promise<void> {
    this.email_enviado = true;
    this.data_envio_email = new Date();
    
    await this.save();
    
    console.log(`📧 Email enviado para termo: ${this.termo_id}`);
  }

  /**
   * Gerar hash do documento para verificação
   */
  public gerarHashDocumento(): string {
    const crypto = require('crypto');
    const dados = `${this.termo_id}${this.pet_nome}${this.adotante_nome}${this.assinatura_digital}${this.data_assinatura}`;
    return crypto.createHash('md5').update(dados).digest('hex');
  }

  // === MÉTODOS ESTÁTICOS ===
  
  /**
   * Buscar termo por Pet e Usuário
   */
  static async findByPetAndUsuario(petId: number, usuarioId: number): Promise<TermoCompromisso | null> {
    return await this.findOne({
      where: {
        pet_id: petId,
        usuario_id: usuarioId,
        status: ['ATIVO', 'CONCLUIDO'] // Excluir cancelados e suspensos
      },
      include: [
        { model: Pet, as: 'pet' },
        { model: Usuario, as: 'adotante' }
      ]
    });
  }

  /**
   * Buscar termos ativos de um usuário
   */
  static async findAtivosByUsuario(usuarioId: number): Promise<TermoCompromisso[]> {
    return await this.findAll({
      where: {
        usuario_id: usuarioId,
        status: 'ATIVO'
      },
      include: [
        { model: Pet, as: 'pet' },
        { model: Usuario, as: 'adotante' }
      ],
      order: [['data_assinatura', 'DESC']]
    });
  }

  /**
   * Contar termos por status
   */
  static async contarPorStatus(usuarioId?: number): Promise<{
    total: number;
    ativos: number;
    concluidos: number;
    cancelados: number;
    suspensos: number;
  }> {
    const whereClause = usuarioId ? { usuario_id: usuarioId } : {};
    
    const [total, ativos, concluidos, cancelados, suspensos] = await Promise.all([
      this.count({ where: whereClause }),
      this.count({ where: { ...whereClause, status: 'ATIVO' } }),
      this.count({ where: { ...whereClause, status: 'CONCLUIDO' } }),
      this.count({ where: { ...whereClause, status: 'CANCELADO' } }),
      this.count({ where: { ...whereClause, status: 'SUSPENSO' } })
    ]);

    return {
      total,
      ativos,
      concluidos,
      cancelados,
      suspensos
    };
  }

  /**
   * Buscar termos próximos ao vencimento
   */
  static async findProximosVencimento(dias: number = 7): Promise<TermoCompromisso[]> {
    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() + dias);

    return await this.findAll({
      where: {
        status: 'ATIVO',
        data_vencimento: {
          [require('sequelize').Op.lte]: dataLimite,
          [require('sequelize').Op.gte]: new Date()
        }
      },
      include: [
        { model: Pet, as: 'pet' },
        { model: Usuario, as: 'adotante' }
      ],
      order: [['data_vencimento', 'ASC']]
    });
  }
}