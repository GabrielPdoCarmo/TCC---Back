// models/termosCompromissoModel.ts - Atualizado com método de atualização de nome

import { Table, Column, Model, DataType, ForeignKey, BelongsTo, BeforeSave } from 'sequelize-typescript';
import { Pet } from './petModel';
import { Usuario } from './usuarioModel';
import { Raca } from './racaModel';
import { Especie } from './especiesModel';
import { FaixaEtaria } from './faixaEtariaModel';
import { Sexo } from './sexoPetModel';
import { Cidade } from './cidadeModel';
import { Estado } from './estadoModel';

@Table({
  tableName: 'TermosCompromisso',
  timestamps: true, // createdAt e updatedAt
})
export class TermoCompromisso extends Model {
  @Column({ type: DataType.INTEGER, autoIncrement: true, primaryKey: true })
  id!: number;

  // === RELACIONAMENTOS ===
  @ForeignKey(() => Pet)
  @Column({ type: DataType.INTEGER, allowNull: false })
  pet_id!: number;

  @ForeignKey(() => Usuario)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    comment: 'ID do usuário dono do pet (doador)',
  })
  doador_id!: number;

  @ForeignKey(() => Usuario)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    comment: 'ID do usuário que vai adotar (adotante)',
  })
  adotante_id!: number;

  // === SNAPSHOT DOS DADOS DO PET ===
  @Column({
    type: DataType.STRING(255),
    allowNull: false,
    comment: 'Nome do pet no momento da adoção',
  })
  pet_nome!: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    comment: 'ID da espécie do pet',
  })
  pet_especie_id!: number;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
    comment: 'Nome da espécie do pet',
  })
  pet_especie_nome!: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    comment: 'ID da raça do pet',
  })
  pet_raca_id!: number;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
    comment: 'Nome da raça do pet',
  })
  pet_raca_nome!: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    comment: 'Idade do pet',
  })
  pet_idade!: number;

  @ForeignKey(() => Sexo)
  @Column({ type: DataType.INTEGER, allowNull: false })
  pet_sexo_id!: number;

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
    comment: 'Nome do sexo do pet',
  })
  pet_sexo_nome!: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
    comment: 'Motivo da doação',
  })
  pet_motivo_doacao?: string;

  // === SNAPSHOT DOS DADOS DO DOADOR ===
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

  // === SNAPSHOT DOS DADOS DO ADOTANTE ===
  @Column({
    type: DataType.STRING(255),
    allowNull: false,
    comment: 'Nome do adotante',
  })
  adotante_nome!: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
    comment: 'Email do adotante',
  })
  adotante_email!: string;

  @Column({
    type: DataType.STRING(20),
    allowNull: true,
    comment: 'Telefone do adotante',
  })
  adotante_telefone?: string;

  @Column({
    type: DataType.STRING(14),
    allowNull: true,
    comment: 'CPF do adotante',
  })
  adotante_cpf?: string;

  @ForeignKey(() => Estado)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    comment: 'Estado do adotante',
  })
  adotante_estado_id?: number;

  @ForeignKey(() => Cidade)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    comment: 'Cidade do adotante',
  })
  adotante_cidade_id?: number;

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
    type: DataType.TEXT,
    allowNull: true,
    comment: 'Observações sobre a adoção',
  })
  observacoes?: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
    comment: 'Hash MD5 do documento',
  })
  hash_documento?: string;

  // === RELACIONAMENTOS ===
  @BelongsTo(() => Pet)
  pet!: Pet;

  @BelongsTo(() => Usuario, { foreignKey: 'doador_id' })
  doador!: Usuario;

  @BelongsTo(() => Usuario, { foreignKey: 'adotante_id' })
  adotante!: Usuario;

  @BelongsTo(() => Estado, { foreignKey: 'adotante_estado_id' })
  estadoAdotante?: Estado;

  @BelongsTo(() => Cidade, { foreignKey: 'adotante_cidade_id' })
  cidadeAdotante?: Cidade;
  
  @BelongsTo(() => Especie, { foreignKey: 'pet_especie_id' })
  especiePet?: Especie;

  @BelongsTo(() => Raca, { foreignKey: 'pet_raca_id' })
  racaPet?: Raca;

  @BelongsTo(() => Sexo, { foreignKey: 'pet_sexo_id' })
  sexoPet?: Sexo;

  // === HOOKS ===
  @BeforeSave
  static async atualizarHash(instance: TermoCompromisso) {
    // Atualiza o hash sempre que o termo for salvo
    instance.hash_documento = instance.gerarHashDocumento();
  }

  // === MÉTODOS DE INSTÂNCIA ===

  /**
   * Gerar hash do documento para verificação
   */
  public gerarHashDocumento(): string {
    const crypto = require('crypto');
    const dados = `${this.pet_nome}${this.doador_nome}${this.adotante_nome}${this.assinatura_digital}${this.data_assinatura}`;
    return crypto.createHash('md5').update(dados).digest('hex');
  }

  /**
   * Verificar integridade do documento
   */
  public verificarIntegridade(): boolean {
    const hashAtual = this.gerarHashDocumento();
    return hashAtual === this.hash_documento;
  }

  // === MÉTODOS ESTÁTICOS ===

  /**
   * Criar termo copiando dados automaticamente
   */
  static async criarComDados(data: {
    pet_id: number;
    adotante_id: number;
    assinatura_digital: string;
    observacoes?: string;
    isNameUpdate?: boolean; // 🆕 Flag para indicar se é atualização de nome
  }): Promise<TermoCompromisso> {
    // Buscar dados completos do pet com relacionamentos
    const pet = await Pet.findByPk(data.pet_id, {
      include: [
        { model: Raca, as: 'raca' },
        { model: Especie, as: 'especie' },
        { model: Sexo, as: 'sexo' },
        { model: Usuario, as: 'responsavel' }, // Doador é o responsável do pet
      ],
    });

    if (!pet) {
      throw new Error('Pet não encontrado');
    }

    if (!pet.responsavel) {
      throw new Error('Pet não tem responsável definido');
    }

    // Buscar dados do adotante
    const adotante = await Usuario.findByPk(data.adotante_id);
    if (!adotante) {
      throw new Error('Usuário adotante não encontrado');
    }

    // 🆕 Se não é atualização de nome, verificar se já existe termo
    if (!data.isNameUpdate) {
      const termoExistente = await this.findOne({
        where: { pet_id: data.pet_id },
      });

      if (termoExistente) {
        throw new Error('Já existe um termo para este pet');
      }
    }

    // Criar termo com snapshot dos dados
    const termo = await this.create({
      pet_id: data.pet_id,
      doador_id: pet.usuario_id, // ID do dono do pet
      adotante_id: data.adotante_id,

      // Snapshot do pet
      pet_nome: pet.nome,
      pet_especie_id: pet.especie_id,
      pet_especie_nome: pet.especie.nome,
      pet_raca_id: pet.raca_id,
      pet_raca_nome: pet.raca.nome,
      pet_idade: pet.idade,
      pet_sexo_id: pet.sexo_id,
      pet_sexo_nome: pet.sexo.descricao,
      pet_motivo_doacao: pet.motivoDoacao,

      // Snapshot do doador
      doador_nome: pet.responsavel.nome,
      doador_email: pet.responsavel.email,
      doador_telefone: pet.responsavel.telefone,

      // Snapshot do adotante
      adotante_nome: adotante.nome,
      adotante_email: adotante.email,
      adotante_telefone: adotante.telefone,
      adotante_cpf: adotante.cpf,
      adotante_cidade_id: adotante.cidade_id,
      adotante_estado_id: adotante.estado_id,

      // Dados da assinatura
      assinatura_digital: data.assinatura_digital,
      data_assinatura: new Date(),
      observacoes: data.observacoes,
    });

    return termo;
  }

  /**
   * 🆕 ATUALIZAR TERMO EXISTENTE COM NOVO NOME E DADOS DO ADOTANTE
   * @param termoId - ID do termo a ser atualizado
   * @param data - Novos dados para atualização
   */
  static async atualizarComNovoNome(termoId: number, data: {
    adotante_id: number;
    adotante_nome: string;
    adotante_email: string;
    adotante_telefone?: string;
    adotante_cpf?: string;
    adotante_cidade_id?: number;
    adotante_estado_id?: number;
    assinatura_digital: string;
    observacoes?: string;
  }): Promise<TermoCompromisso> {
    console.log('🔄 Atualizando termo de compromisso existente:', { termoId, novoNome: data.adotante_nome });

    // Buscar termo existente
    const termo = await this.findByPk(termoId);
    if (!termo) {
      throw new Error('Termo não encontrado para atualização');
    }

    // Verificar se pertence ao usuário correto
    if (termo.adotante_id !== data.adotante_id) {
      throw new Error('Termo não pertence ao usuário informado');
    }

    // Atualizar termo com novos dados do adotante
    const termoAtualizado = await termo.update({
      // Atualizar snapshot do adotante com dados atuais
      adotante_nome: data.adotante_nome,
      adotante_email: data.adotante_email,
      adotante_telefone: data.adotante_telefone || null,
      adotante_cpf: data.adotante_cpf || null,
      adotante_cidade_id: data.adotante_cidade_id || null,
      adotante_estado_id: data.adotante_estado_id || null,

      // Atualizar assinatura e observações
      assinatura_digital: data.assinatura_digital,
      observacoes: data.observacoes || null,
      data_assinatura: new Date(), // Nova data de assinatura

      // Hash será recalculado automaticamente pelo hook @BeforeSave
    });

    console.log('✅ Termo de compromisso atualizado com sucesso:', { 
      termoId: termoAtualizado.id, 
      novoNome: termoAtualizado.adotante_nome,
      novaDataAssinatura: termoAtualizado.data_assinatura
    });

    return termoAtualizado;
  }

  /**
   * Buscar termo por pet
   */
  static async findByPet(petId: number): Promise<TermoCompromisso | null> {
    return await this.findOne({
      where: { pet_id: petId },
      include: [
        { model: Pet, as: 'pet' },
        { model: Usuario, as: 'doador' },
        { model: Usuario, as: 'adotante' },
        { model: Estado, as: 'estadoAdotante' },
        { model: Cidade, as: 'cidadeAdotante' },
        { model: Especie, as: 'especiePet' },
        { model: Raca, as: 'racaPet' },
        { model: Sexo, as: 'sexoPet' },
      ],
    });
  }

  /**
   * 🆕 VERIFICAR SE NOME DO ADOTANTE MUDOU E PRECISA ATUALIZAR TERMO
   * @param petId - ID do pet
   * @param usuarioId - ID do usuário (adotante)
   * @param nomeAtualUsuario - Nome atual do usuário
   * @returns boolean - Se precisa atualizar termo por mudança de nome
   */
  static async precisaAtualizarPorNome(petId: number, usuarioId: number, nomeAtualUsuario: string): Promise<{
    precisaAtualizar: boolean;
    termo?: TermoCompromisso;
    nomeNoTermo?: string;
  }> {
    try {
      const termo = await this.findByPet(petId);
      
      if (!termo || termo.adotante_id !== usuarioId) {
        // Não tem termo ou não é do usuário, não precisa atualizar
        return { precisaAtualizar: false };
      }

      const nomeNoTermo = termo.adotante_nome || '';
      const nomesIguais = nomeAtualUsuario.trim() === nomeNoTermo.trim();

      console.log('🔍 Verificando necessidade de atualização por nome (termo compromisso):', {
        petId,
        usuarioId,
        nomeAtual: nomeAtualUsuario,
        nomeNoTermo,
        nomesIguais,
        precisaAtualizar: !nomesIguais
      });

      return {
        precisaAtualizar: !nomesIguais,
        termo,
        nomeNoTermo,
      };

    } catch (error) {
      console.error('❌ Erro ao verificar necessidade de atualização:', error);
      return { precisaAtualizar: false };
    }
  }

  /**
   * Buscar todos os termos de um usuário (como doador)
   */
  static async findByDoador(doadorId: number): Promise<TermoCompromisso[]> {
    return await this.findAll({
      where: { doador_id: doadorId },
      include: [
        { model: Pet, as: 'pet' },
        { model: Usuario, as: 'adotante' },
      ],
      order: [['data_assinatura', 'DESC']],
    });
  }

  /**
   * Buscar todos os termos de um usuário (como adotante)
   */
  static async findByAdotante(adotanteId: number): Promise<TermoCompromisso[]> {
    return await this.findAll({
      where: { adotante_id: adotanteId },
      include: [
        { model: Pet, as: 'pet' },
        { model: Usuario, as: 'doador' },
      ],
      order: [['data_assinatura', 'DESC']],
    });
  }

  /**
   * 🆕 VERIFICAR SE USUÁRIO TEM TERMO PARA UM PET ESPECÍFICO
   * @param petId - ID do pet
   * @param usuarioId - ID do usuário
   * @returns TermoCompromisso | null
   */
  static async findByPetAndAdotante(petId: number, usuarioId: number): Promise<TermoCompromisso | null> {
    return await this.findOne({
      where: { 
        pet_id: petId,
        adotante_id: usuarioId 
      },
      include: [
        { model: Pet, as: 'pet' },
        { model: Usuario, as: 'doador' },
        { model: Usuario, as: 'adotante' },
      ],
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