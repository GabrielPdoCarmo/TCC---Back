import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from "sequelize-typescript";
import { Especie } from "./especiesModel";
import { Raca } from "./racaModel";
import { FaixaEtaria } from "./faixaEtariaModel";
import { Usuario } from "./usuarioModel";
import { DoencasDeficiencias } from "./doencasDeficienciasModel";
import { Status } from "./statusModel";
import { Cidade } from "./cidadeModel";

@Table({
  tableName: "Pets",
  timestamps: false,
})
export class Pet extends Model {
  @Column({ type: DataType.INTEGER, autoIncrement: true, primaryKey: true })
  id!: number;

  @ForeignKey(() => Especie)
  @Column({ type: DataType.INTEGER, allowNull: false })
  especieId!: number;

  @Column({ type: DataType.STRING(255), allowNull: false })
  nome!: string;

  @Column({ type: DataType.INTEGER, allowNull: false })
  quantidade!: number;

  @ForeignKey(() => Raca)
  @Column({ type: DataType.INTEGER, allowNull: false })
  racaId!: number;

  @Column({ type: DataType.INTEGER, allowNull: false })
  idade!: number;

  @ForeignKey(() => FaixaEtaria)
  @Column({ type: DataType.INTEGER, allowNull: false })
  faixaEtariaId!: number;

  @ForeignKey(() => Usuario)
  @Column({ type: DataType.INTEGER, allowNull: false })
  responsavelId!: number;

  @Column({ type: DataType.STRING(15), allowNull: false })
  sexo!: string;

  @ForeignKey(() => DoencasDeficiencias)
  @Column({ type: DataType.INTEGER, allowNull: false })
  doencaDeficienciaId!: number;

  @Column({ type: DataType.STRING(255), allowNull: false })
  motivoDoacao!: string;

  @ForeignKey(() => Status)
  @Column({ type: DataType.INTEGER, allowNull: false })
  statusId!: number;

  @Column({ type: DataType.BLOB })
  foto!: Buffer;

  @ForeignKey(() => Cidade)
  @Column({ type: DataType.INTEGER, allowNull: false })
  cidadeId!: number;

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

  @BelongsTo(() => DoencasDeficiencias)
  doencaDeficiencia!: DoencasDeficiencias;

  @BelongsTo(() => Status)
  status!: Status;
}