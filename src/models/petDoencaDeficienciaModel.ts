import {
  Table,
  Column,
  Model,
  ForeignKey,
  DataType,
  BelongsTo,
} from 'sequelize-typescript';
import { Pet } from './petModel';
import { DoencasDeficiencias } from './doencasDeficienciasModel';

@Table({
  tableName: 'PetDoencaDeficiencia',
  timestamps: false,
})
export class PetDoencaDeficiencia extends Model {
  @ForeignKey(() => Pet)
  @Column({ primaryKey: true, type: DataType.INTEGER, allowNull: false })
  pet_id!: number;

  @ForeignKey(() => DoencasDeficiencias)
  @Column({ primaryKey: true, type: DataType.INTEGER, allowNull: false })
  doencaDeficiencia_id!: number;

  @Column({ type: DataType.BOOLEAN, allowNull: false })
  possui!: boolean;

  // 🔧 Associações
  @BelongsTo(() => Pet)
  pet!: Pet;

  @BelongsTo(() => DoencasDeficiencias)
  doencaDeficiencia!: DoencasDeficiencias;
}
