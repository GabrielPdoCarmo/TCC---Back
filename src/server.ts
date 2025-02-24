import express from "express";
import petRoutes from "./routes/petRoutes";
import estadoRoutes from "./routes/estadoRoutes";
import cidadeRoutes from "./routes/cidadeRoutes";
import usuarioRoutes from "./routes/usuarioRoutes";

const app = express();

app.use(express.json());
app.use("/api", petRoutes);
app.use("/api", estadoRoutes);
app.use("/api", cidadeRoutes);
app.use("/api", usuarioRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
