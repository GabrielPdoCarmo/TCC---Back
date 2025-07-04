// models/termosCompromissoModel.ts - Atualizado com localização completa e suporte a CPF/CNPJ

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
  tableName: 'TermosAdocao',
  timestamps: true, // createdAt e updatedAt
})
export class TermoAdocao extends Model {
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

  // === SNAPSHOT DOS DADOS DO DOADOR COM LOCALIZAÇÃO E DOCUMENTO ===
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

  // DOCUMENTO DO DOADOR (CPF/CNPJ)
  @Column({
    type: DataType.STRING(18),
    allowNull: true,
    comment: 'CPF ou CNPJ do doador',
  })
  doador_documento?: string;

  @Column({
    type: DataType.ENUM('CPF', 'CNPJ'),
    allowNull: true,
    comment: 'Tipo de documento do doador',
  })
  doador_tipo_documento?: 'CPF' | 'CNPJ';

  // LOCALIZAÇÃO DO DOADOR
  @ForeignKey(() => Estado)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    comment: 'Estado do doador',
  })
  doador_estado_id?: number;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
    comment: 'Nome do estado do doador',
  })
  doador_estado_nome?: string;

  @ForeignKey(() => Cidade)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    comment: 'Cidade do doador',
  })
  doador_cidade_id?: number;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
    comment: 'Nome da cidade do doador',
  })
  doador_cidade_nome?: string;

  // === SNAPSHOT DOS DADOS DO ADOTANTE COM LOCALIZAÇÃO E DOCUMENTO ===
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

  // DOCUMENTO DO ADOTANTE (CPF/CNPJ)
  @Column({
    type: DataType.STRING(18),
    allowNull: true,
    comment: 'CPF ou CNPJ do adotante',
  })
  adotante_documento?: string;

  @Column({
    type: DataType.ENUM('CPF', 'CNPJ'),
    allowNull: true,
    comment: 'Tipo de documento do adotante',
  })
  adotante_tipo_documento?: 'CPF' | 'CNPJ';

  // LOCALIZAÇÃO DO ADOTANTE
  @ForeignKey(() => Estado)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    comment: 'Estado do adotante',
  })
  adotante_estado_id?: number;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
    comment: 'Nome do estado do adotante',
  })
  adotante_estado_nome?: string;

  @ForeignKey(() => Cidade)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    comment: 'Cidade do adotante',
  })
  adotante_cidade_id?: number;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
    comment: 'Nome da cidade do adotante',
  })
  adotante_cidade_nome?: string;

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

  // Relacionamentos para localização do doador
  @BelongsTo(() => Estado, { foreignKey: 'doador_estado_id' })
  estadoDoador?: Estado;

  @BelongsTo(() => Cidade, { foreignKey: 'doador_cidade_id' })
  cidadeDoador?: Cidade;

  // Relacionamentos para localização do adotante
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
  static async atualizarHash(instance: TermoAdocao) {
    // Atualiza o hash sempre que o termo for salvo
    instance.hash_documento = instance.gerarHashDocumento();
  }

  // === MÉTODOS DE INSTÂNCIA ===

  public gerarHashDocumento(): string {
    const crypto = require('crypto');
    const dados = `${this.pet_nome}${this.doador_nome}${this.adotante_nome}${this.assinatura_digital}${this.data_assinatura}`;
    return crypto.createHash('md5').update(dados).digest('hex');
  }

  public verificarIntegridade(): boolean {
    const hashAtual = this.gerarHashDocumento();
    return hashAtual === this.hash_documento;
  }

  public getLocalizacaoDoador(): string {
    if (this.doador_cidade_nome && this.doador_estado_nome) {
      return `${this.doador_cidade_nome} - ${this.doador_estado_nome}`;
    }
    if (this.doador_estado_nome) {
      return this.doador_estado_nome;
    }
    return 'Não informado';
  }

  public getLocalizacaoAdotante(): string {
    if (this.adotante_cidade_nome && this.adotante_estado_nome) {
      return `${this.adotante_cidade_nome} - ${this.adotante_estado_nome}`;
    }
    if (this.adotante_estado_nome) {
      return this.adotante_estado_nome;
    }
    return 'Não informado';
  }

  // NOVOS MÉTODOS: Formatação de documentos
  public getDocumentoDoadorFormatado(): string {
    if (!this.doador_documento) return 'Não informado';
    
    if (this.doador_tipo_documento === 'CPF') {
      // Formato: 000.000.000-00
      return this.doador_documento;
    } else if (this.doador_tipo_documento === 'CNPJ') {
      // Formato: 00.000.000/0000-00
      return this.doador_documento;
    }
    
    return this.doador_documento;
  }

  public getDocumentoAdotanteFormatado(): string {
    if (!this.adotante_documento) return 'Não informado';
    
    if (this.adotante_tipo_documento === 'CPF') {
      // Formato: 000.000.000-00
      return this.adotante_documento;
    } else if (this.adotante_tipo_documento === 'CNPJ') {
      // Formato: 00.000.000/0000-00
      return this.adotante_documento;
    }
    
    return this.adotante_documento;
  }

  // === MÉTODOS ESTÁTICOS ===

  static async criarComDados(data: {
    pet_id: number;
    adotante_id: number;
    assinatura_digital: string;
    observacoes?: string;
    isNameUpdate?: boolean;
  }): Promise<TermoAdocao> {
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

    // Buscar dados completos do doador COM localização
    const doadorCompleto = await Usuario.findByPk(pet.usuario_id, {
      include: [
        { model: Cidade, as: 'cidade' },
        { model: Estado, as: 'estado' },
      ],
    });

    // Buscar dados completos do adotante COM localização
    const adotanteCompleto = await Usuario.findByPk(data.adotante_id, {
      include: [
        { model: Cidade, as: 'cidade' },
        { model: Estado, as: 'estado' },
      ],
    });

    if (!adotanteCompleto) {
      throw new Error('Usuário adotante não encontrado');
    }

    // Se não é atualização de nome, verificar se já existe termo
    if (!data.isNameUpdate) {
      const termoExistente = await this.findOne({
        where: { pet_id: data.pet_id },
      });

      if (termoExistente) {
        throw new Error('Já existe um termo para este pet');
      }
    }

    // Criar termo com snapshot completo dos dados incluindo localização e documentos
    const termo = await this.create({
      pet_id: data.pet_id,
      doador_id: pet.usuario_id,
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

      // Snapshot do doador COM localização e documento
      doador_nome: doadorCompleto?.nome || pet.responsavel.nome,
      doador_email: doadorCompleto?.email || pet.responsavel.email,
      doador_telefone: doadorCompleto?.telefone || pet.responsavel.telefone,
      doador_documento: doadorCompleto?.documento,
      doador_tipo_documento: doadorCompleto?.tipo_documento,
      doador_estado_id: doadorCompleto?.estado_id,
      doador_estado_nome: doadorCompleto?.estado?.nome,
      doador_cidade_id: doadorCompleto?.cidade_id,
      doador_cidade_nome: doadorCompleto?.cidade?.nome,

      // Snapshot do adotante COM localização e documento
      adotante_nome: adotanteCompleto.nome,
      adotante_email: adotanteCompleto.email,
      adotante_telefone: adotanteCompleto.telefone,
      adotante_documento: adotanteCompleto.documento,
      adotante_tipo_documento: adotanteCompleto.tipo_documento,
      adotante_cidade_id: adotanteCompleto.cidade_id,
      adotante_cidade_nome: adotanteCompleto.cidade?.nome,
      adotante_estado_id: adotanteCompleto.estado_id,
      adotante_estado_nome: adotanteCompleto.estado?.nome,

      // Dados da assinatura
      assinatura_digital: data.assinatura_digital,
      data_assinatura: new Date(),
      observacoes: data.observacoes,
    });

    return termo;
  }

  static async atualizarComNovoNome(
    termoId: number,
    data: {
      adotante_id: number;
      adotante_nome: string;
      adotante_email: string;
      adotante_telefone?: string;
      adotante_documento?: string;
      adotante_tipo_documento?: 'CPF' | 'CNPJ';
      adotante_cidade_id?: number;
      adotante_estado_id?: number;
      assinatura_digital: string;
      observacoes?: string;
    }
  ): Promise<TermoAdocao> {
    // Buscar termo existente
    const termo = await this.findByPk(termoId);
    if (!termo) {
      throw new Error('Termo não encontrado para atualização');
    }

    // Verificar se pertence ao usuário correto
    if (termo.adotante_id !== data.adotante_id) {
      throw new Error('Termo não pertence ao usuário informado');
    }

    // Buscar dados completos do adotante COM localização atualizada
    const adotanteCompleto = await Usuario.findByPk(data.adotante_id, {
      include: [
        { model: Cidade, as: 'cidade' },
        { model: Estado, as: 'estado' },
      ],
    });

    if (!adotanteCompleto) {
      throw new Error('Dados do adotante não encontrados');
    }

    // Atualizar termo com novos dados completos do adotante
    const termoAtualizado = await termo.update({
      // Atualizar snapshot do adotante com dados atuais, localização e documento
      adotante_nome: adotanteCompleto.nome || data.adotante_nome,
      adotante_email: adotanteCompleto.email || data.adotante_email,
      adotante_telefone: adotanteCompleto.telefone || data.adotante_telefone || null,
      adotante_documento: adotanteCompleto.documento || data.adotante_documento || null,
      adotante_tipo_documento: adotanteCompleto.tipo_documento || data.adotante_tipo_documento || null,
      adotante_cidade_id: adotanteCompleto.cidade_id || data.adotante_cidade_id || null,
      adotante_cidade_nome: adotanteCompleto.cidade?.nome || null,
      adotante_estado_id: adotanteCompleto.estado_id || data.adotante_estado_id || null,
      adotante_estado_nome: adotanteCompleto.estado?.nome || null,

      // Atualizar assinatura e observações
      assinatura_digital: data.assinatura_digital,
      observacoes: data.observacoes || null,
      data_assinatura: new Date(), // Nova data de assinatura

      // Hash será recalculado automaticamente pelo hook @BeforeSave
    });

    return termoAtualizado;
  }

  static async findByPet(petId: number): Promise<TermoAdocao | null> {
    return await this.findOne({
      where: { pet_id: petId },
      include: [
        { model: Pet, as: 'pet' },
        { model: Usuario, as: 'doador' },
        { model: Usuario, as: 'adotante' },
        // Relacionamentos de localização do doador
        { model: Estado, as: 'estadoDoador' },
        { model: Cidade, as: 'cidadeDoador' },
        // Relacionamentos de localização do adotante
        { model: Estado, as: 'estadoAdotante' },
        { model: Cidade, as: 'cidadeAdotante' },
        // Relacionamentos do pet
        { model: Especie, as: 'especiePet' },
        { model: Raca, as: 'racaPet' },
        { model: Sexo, as: 'sexoPet' },
      ],
    });
  }

  static async precisaAtualizarPorNome(
    petId: number,
    usuarioId: number,
    nomeAtualUsuario: string
  ): Promise<{
    precisaAtualizar: boolean;
    termo?: TermoAdocao;
    nomeNoTermo?: string;
  }> {
    try {
      const termo = await this.findByPet(petId);

      if (!termo || termo.adotante_id !== usuarioId) {
        return { precisaAtualizar: false };
      }

      const nomeNoTermo = termo.adotante_nome || '';
      const nomesIguais = nomeAtualUsuario.trim() === nomeNoTermo.trim();

      return {
        precisaAtualizar: !nomesIguais,
        termo,
        nomeNoTermo,
      };
    } catch (error) {
      return { precisaAtualizar: false };
    }
  }

  static async findByDoador(doadorId: number): Promise<TermoAdocao[]> {
    return await this.findAll({
      where: { doador_id: doadorId },
      include: [
        { model: Pet, as: 'pet' },
        { model: Usuario, as: 'adotante' },
        { model: Estado, as: 'estadoAdotante' },
        { model: Cidade, as: 'cidadeAdotante' },
      ],
      order: [['data_assinatura', 'DESC']],
    });
  }

  static async findByAdotante(adotanteId: number): Promise<TermoAdocao[]> {
    return await this.findAll({
      where: { adotante_id: adotanteId },
      include: [
        { model: Pet, as: 'pet' },
        { model: Usuario, as: 'doador' },
        { model: Estado, as: 'estadoDoador' },
        { model: Cidade, as: 'cidadeDoador' },
      ],
      order: [['data_assinatura', 'DESC']],
    });
  }

  static async findByPetAndAdotante(petId: number, usuarioId: number): Promise<TermoAdocao | null> {
    return await this.findOne({
      where: {
        pet_id: petId,
        adotante_id: usuarioId,
      },
      include: [
        { model: Pet, as: 'pet' },
        { model: Usuario, as: 'doador' },
        { model: Usuario, as: 'adotante' },
        { model: Estado, as: 'estadoDoador' },
        { model: Cidade, as: 'cidadeDoador' },
        { model: Estado, as: 'estadoAdotante' },
        { model: Cidade, as: 'cidadeAdotante' },
      ],
    });
  }

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