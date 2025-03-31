import axios from 'axios';
import Estado from '../models/estadoModel';
import Cidade from '../models/cidadeModel';

export const populateDatabase = async () => {
  try {
    const { data } = await axios.get('https://servicodados.ibge.gov.br/api/v1/localidades/distritos');
    
    for (const item of data) {
      const [estado] = await Estado.findOrCreate({
        where: { id: item.municipio.microrregiao.mesorregiao.UF.id },
        defaults: {
          nome: item.municipio.microrregiao.mesorregiao.UF.nome,
          sigla: item.municipio.microrregiao.mesorregiao.UF.sigla
        }
      });
      
      await Cidade.findOrCreate({
        where: { id: item.municipio.id },
        defaults: {
          nome: item.municipio.nome,
          estadoId: estado.id
        }
      });
    }
  } catch (error) {
    console.error('Erro ao popular o banco de dados:', error);
  }
};

