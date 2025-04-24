import { Table, Column, Model, DataType, HasMany } from 'sequelize-typescript';
import { Cidade } from './cidadeModel'; // ajuste o caminho se necessário

@Table({ tableName: 'Estados', timestamps: false })
export class Estado extends Model {
  @Column({ type: DataType.INTEGER, autoIncrement: true, primaryKey: true })
  id!: number;

  @Column({ type: DataType.STRING, allowNull: false })
  nome!: string;

  @Column({ type: DataType.STRING, allowNull: false })
  sigla!: string;

  // 👇 Aqui está o que estava faltando:
  @HasMany(() => Cidade, { foreignKey: 'estado_id', as: 'cidades' })
  cidades?: Cidade[];
}

export default Estado;
