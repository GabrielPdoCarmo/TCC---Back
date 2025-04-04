import { Table, Column, Model, DataType, ForeignKey, BelongsTo, BelongsToMany } from 'sequelize-typescript';
import { Especie } from './especiesModel';
import { Raca } from './racaModel';
import { FaixaEtaria } from './faixaEtariaModel';
import { Usuario } from './usuarioModel';
import { DoencasDeficiencias } from './doencasDeficienciasModel';
import { Status } from './statusModel';
import { Cidade } from './cidadeModel';
import { PetDoencaDeficiencia } from './petDoencaDeficienciaModel';

@Table({
  tableName: 'Pets',
  timestamps: false,
})
export class Pet extends Model {
  @Column({ type: DataType.INTEGER, autoIncrement: true, primaryKey: true })
  id!: number;

  @ForeignKey(() => Especie)
  @Column({ type: DataType.INTEGER, allowNull: false })
  especie_id!: number;

  @Column({ type: DataType.STRING(255), allowNull: false })
  nome!: string;

  @Column({ type: DataType.INTEGER, allowNull: false })
  quantidade!: number;

  @ForeignKey(() => Raca)
  @Column({ type: DataType.INTEGER, allowNull: false })
  raca_id!: number;

  @Column({ type: DataType.INTEGER, allowNull: false })
  idade!: number;

  @ForeignKey(() => FaixaEtaria)
  @Column({ type: DataType.INTEGER, allowNull: false })
  faixa_etaria_id!: number;

  @ForeignKey(() => Usuario)
  @Column({ type: DataType.INTEGER, allowNull: false })
  usuario_id!: number;

  @Column({ type: DataType.STRING(15), allowNull: false })
  sexo!: string;

  @Column({ type: DataType.STRING(255), allowNull: false })
  motivoDoacao!: string;

  @ForeignKey(() => Status)
  @Column({ type: DataType.INTEGER, allowNull: false })
  status_id!: number;

  @Column({ type: DataType.BLOB })
  foto!: Buffer;

  @ForeignKey(() => Cidade)
  @Column({ type: DataType.INTEGER, allowNull: false })
  cidade_id!: number;

  @BelongsTo(() => Cidade)
  cidade!: Cidade;

  @BelongsTo(() => Especie)
  especie!: Especie;

  @BelongsTo(() => Raca)
  raca!: Raca;

  @BelongsTo(() => FaixaEtaria)
  faixaEtaria!: FaixaEtaria;

  @BelongsTo(() => Usuario)
  responsavel!: Usuario;

  @BelongsTo(() => Status)
  status!: Status;
}
