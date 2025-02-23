import mongoose from 'mongoose';

const AnimalSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  idade: Number,
  especie: String,
  raca: String,
  porte: String,
  sexo: String,
  descricao: String,
  foto: String,
  disponivel: { type: Boolean, default: true },
});

export default mongoose.model('Animal', AnimalSchema);
