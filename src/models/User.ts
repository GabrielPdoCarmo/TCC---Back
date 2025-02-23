import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  senha: { type: String, required: true },
  tipo: { type: String, enum: ['adotante', 'administrador'], required: true },
  telefone: String,
});

export default mongoose.model('User', UserSchema);
