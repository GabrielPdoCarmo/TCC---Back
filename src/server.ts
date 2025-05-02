import express from 'express';
import 'reflect-metadata';
import dotenv from 'dotenv';
import { Sequelize } from 'sequelize-typescript';

import petRoutes from './routes/petRoutes';
import estadoRoutes from './routes/estadoRoutes';
import cidadeRoutes from './routes/cidadeRoutes';
import usuarioRoutes from './routes/usuarioRoutes';
import faixaEtariaRoutes from './routes/faixaEtariaRoutes';
import statusRoutes from './routes/statusRoutes';
import doencasDeficienciasRoutes from './routes/doencasDeficienciasRoutes';
import especieRoutes from './routes/especieRoutes';
import racasRoutes from './routes/racaRoutes';
import favoritosRoutes from './routes/favoritosRouter';
import authRoutes from './routes/authRoutes';
import sexoUsuarioRoutes from './routes/sexoUsuarioRoutes';
import sexoRoutes from './routes/sexoPetRouter';
import cidades_estadosRoutes from './routes/cidade_estado_json';
import { DoencasDeficiencias } from './models/doencasDeficienciasModel';
import { Pet } from './models/petModel';
import { Estado } from './models/estadoModel';
import { Cidade } from './models/cidadeModel';
import { Usuario } from './models/usuarioModel';
import { Status } from './models/statusModel';
import { FaixaEtaria } from './models/faixaEtariaModel';
import { populateDatabase } from './controllers/dataController';
import { Especie } from './models/especiesModel';
import { Raca } from './models/racaModel';
import { Favorito } from './models/favoritosModel';
import { PetDoencaDeficiencia } from './models/petDoencaDeficienciaModel';
import { Sexo } from './models/sexoPetModel';
import { Sexo_Usuario } from './models/sexoUsuarioModel';
import { sexoPet } from './jsons/sexoPet';
// import cors from 'cors';
dotenv.config();

const app = express();
app.use(express.json());

// app.use(
//   cors({
//     origin: '*', // ou melhor: 'https://seu-front.vercel.app'
//   })
// );

// Conexão com o banco de dados
console.log('Tentando conectar ao banco...');

const sequelize = new Sequelize({
  dialect: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'adocao_animais',
  models: [
    Pet,
    Estado,
    Cidade,
    Usuario,
    Status,
    FaixaEtaria,
    DoencasDeficiencias,
    Especie,
    Raca,
    Favorito,
    PetDoencaDeficiencia,
    Sexo,
    Sexo_Usuario,
  ],
});

sequelize
  .authenticate()
  .then(() => console.log('Banco de dados conectado!'))
  .catch((err) => console.error('Erro ao conectar ao banco:', err));

sequelize
  .sync()
  .then(async () => {
    console.log('Tabelas verificadas!');
    await populateDatabase();
  })
  .catch((err) => console.error('Erro ao sincronizar tabelas:', err));

// Definição de rotas
app.use('/api/pets', petRoutes);
app.use('/api/estados', estadoRoutes);
app.use('/api/cidades', cidadeRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/faixa-etaria', faixaEtariaRoutes);
app.use('/api/status', statusRoutes);
app.use('/api/doencasdeficiencias', doencasDeficienciasRoutes);
app.use('/api/especies', especieRoutes);
app.use('/api/racas', racasRoutes);
app.use('/api/favoritos', favoritosRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/sexoUsuario', sexoUsuarioRoutes);
app.use('/api/estados-cidades-json', cidades_estadosRoutes);
app.use('/api/sexoPet', sexoRoutes);

// Middleware para tratamento de erros
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Erro interno no servidor' });
});

import os from 'os';

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name in interfaces) {
    const iface = interfaces[name];
    if (!iface) continue;
    for (const alias of iface) {
      if (alias.family === 'IPv4' && !alias.internal) {
        return alias.address;
      }
    }
  }
  return 'localhost';
}

const localIP = getLocalIP();
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Servidor rodando na porta ${PORT}`);
  console.log(`🌐 Acesse via: http://${localIP}:${PORT}`);
});



