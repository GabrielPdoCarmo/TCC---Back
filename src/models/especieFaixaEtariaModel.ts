import { Table, Column, Model, ForeignKey, DataType } from 'sequelize-typescript';
import { Especie } from './especiesModel';
import { FaixaEtaria } from './faixaEtariaModel';

@Table({
   tableName: 'especie_faixa_etaria',
   timestamps: false,
})
export class EspecieFaixaEtaria extends Model<EspecieFaixaEtaria> {
   @ForeignKey(() => Especie)
   @Column({ type: DataType.INTEGER })
   especie_id!: number;

   @ForeignKey(() => FaixaEtaria)
   @Column({ type: DataType.INTEGER })
   faixa_etaria_id!: number;
}
