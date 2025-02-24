import express from "express";
import dotenv from "dotenv";
import { Sequelize } from "sequelize-typescript";
import petRoutes from "./routes/petRoutes";
import estadoRoutes from "./routes/estadoRoutes";
import cidadeRoutes from "./routes/cidadeRoutes";
import usuarioRoutes from "./routes/usuarioRoutes";
import faixaEtariaRoutes from "./routes/faixaEtariaRoutes";
import statusRoutes from "./routes/statusRoutes";
import doencasDeficienciasRoutes from "./routes/doencasDeficienciasRoutes";
import { DoencasDeficiencias } from "./models/doencasDeficienciasModel";
import { Pet } from "./models/petModel";
import { Estado } from "./models/estadoModel";
import { Cidade } from "./models/cidadeModel";
import { Usuario } from "./models/usuarioModel";
import { Status } from "./models/statusModel";
import { EspecieFaixaEtaria } from "./models/especieFaixaEtariaModel";
import { FaixaEtaria } from "./models/faixaEtariaModel";

dotenv.config();

const app = express();
app.use(express.json());

// Conexão com o banco de dados
const sequelize = new Sequelize({
  dialect: "mysql",
  host: process.env.DB_HOST || "localhost",
  username: process.env.DB_USER || "root",
  password: process.env.DB_PASS || "",
  database: process.env.DB_NAME || "adocao_animais",
  models: [Pet, Estado, Cidade, Usuario, Status, EspecieFaixaEtaria, FaixaEtaria, DoencasDeficiencias],
});


sequelize.sync({ alter: true }) // Garante que as tabelas estejam atualizadas
  .then(() => console.log("Banco de dados sincronizado"))
  .catch(err => console.error("Erro ao conectar ao banco:", err));

// Definição de rotas sem conflito de prefixo
app.use("/api/pets", petRoutes);
app.use("/api/estados", estadoRoutes);
app.use("/api/cidades", cidadeRoutes);
app.use("/api/usuarios", usuarioRoutes);
app.use("/api/faixa-etaria", faixaEtariaRoutes);
app.use("/api/status", statusRoutes);
app.use("api/doencasdeficiencias", doencasDeficienciasRoutes)

// Middleware para tratamento de erros
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: "Erro interno no servidor" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
