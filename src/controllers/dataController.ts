import axios from 'axios';
import Estado from '../models/estadoModel';
import Cidade from '../models/cidadeModel';
import { Raca } from '../models/racaModel';
import { Especie } from '../models/especiesModel';
import { FaixaEtaria } from '../models/faixaEtariaModel';
import { Status } from '../models/statusModel';
import { Sexo } from '../models/sexoPetModel';
import { racas } from '../jsons/racas';
import { especies } from '../jsons/especies';
import { faixaEtarias } from '../jsons/faixaEtaria';
import { status } from '../jsons/status';
import { sexoPet } from '../jsons/sexoPet';
import { Sexo_Usuario } from '../models/sexoUsuarioModel';
import { sexoUsuario } from '../jsons/sexoUsuario';

// Função auxiliar para verificar se o banco já está populado
const checkDatabasePopulation = async () => {
  const [
    estadosCount,
    cidadesCount,
    especiesCount,
    racasCount,
    faixaEtariasCount,
    statusCount,
    sexoPetCount,
    sexoUsuarioCount
  ] = await Promise.all([
    Estado.count(),
    Cidade.count(),
    Especie.count(),
    Raca.count(),
    FaixaEtaria.count(),
    Status.count(),
    Sexo.count(),
    Sexo_Usuario.count()
  ]);

  return {
    counts: {
      estados: estadosCount,
      cidades: cidadesCount,
      especies: especiesCount,
      racas: racasCount,
      faixaEtarias: faixaEtariasCount,
      status: statusCount,
      sexoPet: sexoPetCount,
      sexoUsuario: sexoUsuarioCount
    },
    isPopulated: estadosCount > 0 && especiesCount > 0 && racasCount > 0 && 
                 faixaEtariasCount > 0 && statusCount > 0 && sexoPetCount > 0 && 
                 sexoUsuarioCount > 0
  };
};

export const populateDatabase = async () => {
  try {
    console.log('🔍 Verificando se o banco de dados precisa ser populado...');

    const { counts, isPopulated } = await checkDatabasePopulation();

    // Se todas as tabelas já têm dados, não precisa popular
    if (isPopulated) {
      console.log('✅ Banco de dados já está populado. Pular população.');
      // Mostra contadores apenas no modo debug/desenvolvimento
      if (process.env.NODE_ENV === 'development') {
        console.log(`   📍 Estados: ${counts.estados}`);
        console.log(`   🏙️ Cidades: ${counts.cidades}`);
        console.log(`   🐾 Espécies: ${counts.especies}`);
        console.log(`   🦴 Raças: ${counts.racas}`);
        console.log(`   📅 Faixas Etárias: ${counts.faixaEtarias}`);
        console.log(`   📊 Status: ${counts.status}`);
        console.log(`   ♂️♀️ Sexo Pet: ${counts.sexoPet}`);
        console.log(`   👤 Sexo Usuário: ${counts.sexoUsuario}`);
      }
      return;
    }

    console.log('🚀 Iniciando a população do banco de dados (primeira execução)...');
    
    // Mostrar o que precisa ser populado
    const tabelasVazias = [];
    if (counts.estados === 0) tabelasVazias.push('Estados/Cidades');
    if (counts.especies === 0) tabelasVazias.push('Espécies');
    if (counts.racas === 0) tabelasVazias.push('Raças');
    if (counts.faixaEtarias === 0) tabelasVazias.push('Faixas Etárias');
    if (counts.status === 0) tabelasVazias.push('Status');
    if (counts.sexoPet === 0) tabelasVazias.push('Sexo Pet');
    if (counts.sexoUsuario === 0) tabelasVazias.push('Sexo Usuário');
    
    console.log(`📋 Tabelas que precisam ser populadas: ${tabelasVazias.join(', ')}`);

    const startTime = Date.now();

    // 🟢 Populando Estados e Cidades (apenas se não existirem)
    if (counts.estados === 0) {
      console.log('🔄 Buscando estados e cidades do IBGE...');
      const { data } = await axios.get('https://servicodados.ibge.gov.br/api/v1/localidades/distritos');

      let estadosInseridos = 0;
      let cidadesInseridas = 0;

      for (const item of data) {
        // Verificando se os dados necessários estão presentes antes de acessar
        if (
          item.municipio &&
          item.municipio.microrregiao &&
          item.municipio.microrregiao.mesorregiao &&
          item.municipio.microrregiao.mesorregiao.UF
        ) {
          const uf = item.municipio.microrregiao.mesorregiao.UF;

          // Criando ou buscando o estado
          const [estado, estadoCriado] = await Estado.findOrCreate({
            where: { id: uf.id },
            defaults: {
              nome: uf.nome,
              sigla: uf.sigla,
            },
          });

          if (estadoCriado) estadosInseridos++;

          // Criando ou buscando a cidade
          const [cidade, cidadeCriada] = await Cidade.findOrCreate({
            where: { id: item.municipio.id },
            defaults: {
              nome: item.municipio.nome,
              estado_id: estado.id,
            },
          });

          if (cidadeCriada) cidadesInseridas++;

        } else {
          // Log de erro caso algum dado necessário esteja ausente
          console.error('Dados inválidos para', item.municipio);
        }
      }

      console.log(`✅ Estados e cidades populados! (${estadosInseridos} estados, ${cidadesInseridas} cidades)`);
    }

    // 🟢 Populando Espécies (apenas se não existirem)
    if (counts.especies === 0) {
      console.log('🔄 Inserindo espécies...');
      let especiesInseridas = 0;
      
      await Promise.all(
        especies.map(async (especie) => {
          const [especieObj, criada] = await Especie.findOrCreate({
            where: { nome: especie.nome },
            defaults: especie
          });
          if (criada) especiesInseridas++;
        })
      );
      
      console.log(`✅ Espécies populadas! (${especiesInseridas} inseridas)`);
    }

    // 🟢 Populando Todas as Raças (apenas se não existirem)
    if (counts.racas === 0) {
      console.log('🔄 Inserindo todas as raças...');
      let racasInseridas = 0;
      
      await Promise.all(
        racas.map(async (raca) => {
          const [racaObj, criada] = await Raca.findOrCreate({ 
            where: { nome: raca.nome, especie_id: raca.especie_id },
            defaults: raca
          });
          if (criada) racasInseridas++;
        })
      );
      
      console.log(`✅ Raças populadas! (${racasInseridas} inseridas)`);
    }

    // 🟢 Populando Faixas Etárias (apenas se não existirem)
    if (counts.faixaEtarias === 0) {
      console.log('🔄 Inserindo faixas etárias...');
      let faixasInseridas = 0;
      
      await Promise.all(
        faixaEtarias.map(async (faixa) => {
          const [faixaObj, criada] = await FaixaEtaria.findOrCreate({
            where: {
              nome: faixa.nome,
              idade_max: faixa.idade_max,
              idade_min: faixa.idade_min,
              unidade: faixa.unidade,
              especie_id: faixa.especie_id,
            },
            defaults: faixa
          });
          if (criada) faixasInseridas++;
        })
      );
      
      console.log(`✅ Faixas etárias populadas! (${faixasInseridas} inseridas)`);
    }

    // 🟢 Populando Status (apenas se não existirem)
    if (counts.status === 0) {
      console.log('🔄 Inserindo status...');
      let statusInseridos = 0;
      
      await Promise.all(
        status.map(async (statusItem) => {
          const [statusObj, criado] = await Status.findOrCreate({
            where: {
              nome: statusItem.nome,
            },
            defaults: statusItem
          });
          if (criado) statusInseridos++;
        })
      );
      
      console.log(`✅ Status populados! (${statusInseridos} inseridos)`);
    }

    // 🟢 Populando Sexo do Pet (apenas se não existirem)
    if (counts.sexoPet === 0) {
      console.log('🔄 Inserindo sexo do pet...');
      let sexosPetInseridos = 0;
      
      await Promise.all(
        sexoPet.map(async (sexo) => {
          const [sexoObj, criado] = await Sexo.findOrCreate({
            where: { descricao: sexo.descricao },
            defaults: sexo
          });
          if (criado) sexosPetInseridos++;
        })
      );
      
      console.log(`✅ Sexos dos pets populados! (${sexosPetInseridos} inseridos)`);
    }

    // 🟢 Populando Sexo do Usuário (apenas se não existirem)
    if (counts.sexoUsuario === 0) {
      console.log('🔄 Inserindo sexo do usuário...');
      let sexosUsuarioInseridos = 0;
      
      await Promise.all(
        sexoUsuario.map(async (sexo) => {
          const [sexoObj, criado] = await Sexo_Usuario.findOrCreate({
            where: { descricao: sexo.descricao },
            defaults: sexo
          });
          if (criado) sexosUsuarioInseridos++;
        })
      );
      
      console.log(`✅ Sexos dos usuários populados! (${sexosUsuarioInseridos} inseridos)`);
    }

    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 1000);
    
    console.log(`🎉 População do banco de dados concluída em ${duration}s!`);
    
    // Verificar contadores finais
    const finalCheck = await checkDatabasePopulation();
    console.log('📊 Contadores finais:');
    console.log(`   📍 Estados: ${finalCheck.counts.estados}`);
    console.log(`   🏙️ Cidades: ${finalCheck.counts.cidades}`);
    console.log(`   🐾 Espécies: ${finalCheck.counts.especies}`);
    console.log(`   🦴 Raças: ${finalCheck.counts.racas}`);
    console.log(`   📅 Faixas Etárias: ${finalCheck.counts.faixaEtarias}`);
    console.log(`   📊 Status: ${finalCheck.counts.status}`);
    console.log(`   ♂️♀️ Sexo Pet: ${finalCheck.counts.sexoPet}`);
    console.log(`   👤 Sexo Usuário: ${finalCheck.counts.sexoUsuario}`);
    
  } catch (error) {
    console.error('❌ Erro ao popular o banco de dados:', error);
    throw error; // Re-throw para que o erro seja tratado pela aplicação
  }
};