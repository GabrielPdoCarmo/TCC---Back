import { Table, Column, Model, DataType, HasMany, BelongsToMany } from 'sequelize-typescript';
import { PetDoencaDeficiencia } from './petDoencaDeficienciaModel';
import { Pet } from './petModel';

@Table({
  tableName: 'Doencas_deficiencias',
  timestamps: false,
})
export class DoencasDeficiencias extends Model {
  @Column({ type: DataType.INTEGER, autoIncrement: true, primaryKey: true })
  id!: number;

  @Column({ type: DataType.STRING(100), allowNull: false })
  nome!: string;

  // Você pode escolher uma das duas abordagens abaixo, mas normalmente não se usa ambas:
  
  // Opção 1: Relacionamento direto com a tabela intermediária
  @HasMany(() => PetDoencaDeficiencia, 'doencaDeficiencia_id')
  petDoencasDeficiencias!: PetDoencaDeficiencia[];
  
  // Opção 2: Relacionamento muitos-para-muitos com Pet
  @BelongsToMany(() => Pet, () => PetDoencaDeficiencia)
  pets!: Pet[];
}