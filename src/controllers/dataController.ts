import axios from 'axios';
import Estado from '../models/estadoModel';
import Cidade from '../models/cidadeModel';
import { Raca } from '../models/racaModel';
import { Especie } from '../models/especiesModel';
import { FaixaEtaria } from '../models/faixaEtariaModel';
import { racas } from '../jsons/racas';
import { especies } from '../jsons/especies';
import { faixaEtarias } from '../jsons/faixaEtaria';

export const populateDatabase = async () => {
  try {
    console.log('✅ Iniciando a população do banco de dados...');

    // 🟢 Populando Estados e Cidades
    console.log('🔄 Buscando estados e cidades do IBGE...');
    const { data } = await axios.get('https://servicodados.ibge.gov.br/api/v1/localidades/distritos');

    for (const item of data) {
      const [estado] = await Estado.findOrCreate({
        where: { id: item.municipio.microrregiao.mesorregiao.UF.id },
        defaults: {
          nome: item.municipio.microrregiao.mesorregiao.UF.nome,
          sigla: item.municipio.microrregiao.mesorregiao.UF.sigla,
        },
      });

      await Cidade.findOrCreate({
        where: { id: item.municipio.id },
        defaults: {
          nome: item.municipio.nome,
          estadoId: estado.id,
        },
      });
    }
    console.log('✅ Estados e cidades populados com sucesso!');

    // 🟢 Populando Espécies
    console.log('🔄 Inserindo espécies...');
    await Promise.all(
      especies.map(async (especie) => {
        const existe = await Especie.findOne({
          where: { nome: especie.nome },
        });
        if (!existe) {
          await Especie.create(especie);
          console.log(`✅ Espécie ${especie.nome} inserida!`);
        }
      })
    );
    console.log('✅ Todas as espécies populadas com sucesso!');

    // 🟢 Populando Todas as Raças
    console.log('🔄 Inserindo todas as raças...');
    await Promise.all(
      racas.map(async (raca) => {
        const existe = await Raca.findOne({ where: { nome: raca.nome, especie_id: raca.especie_id } });
        if (!existe) {
          await Raca.create(raca);
          console.log(`✅ Raça ${raca.nome} inserida!`);
        }
      })
    );
    console.log('✅ Todas as raças populadas com sucesso!');
    console.log('🔄 Inserindo faixas etárias...');
    await Promise.all(
      faixaEtarias.map(async (faixa) => {
        const existe = await FaixaEtaria.findOne({
          where: {
            nome: faixa.nome,
            idade_max: faixa.idade_max,
            idade_min: faixa.idade_min,
            unidade: faixa.unidade,
            especie_id: faixa.especie_id,
          },
        });
        if (!existe) {
          await FaixaEtaria.create(faixa);
          console.log(`✅ Faixa Etária ${faixa.nome} inserida!`);
        }
      })
    );
    console.log('✅ Faixas etárias populadas com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao popular o banco de dados:', error);
  }
};
