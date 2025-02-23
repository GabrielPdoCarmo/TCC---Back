import express from "express";
import cors from "cors";
import { sequelize } from "./database";
import petRoutes from "./routes/petRoutes";

const app = express();
app.use(cors());
app.use(express.json());
app.use(petRoutes);

sequelize.sync({ alter: true }).then(() => {
  console.log("Banco de dados conectado");
});

app.listen(3000, () => console.log("Servidor rodando na porta 3000"));
