import mongoose from 'mongoose';

const AdocaoSchema = new mongoose.Schema({
  usuario_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  animal_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Animal', required: true },
  data_adocao: { type: Date, default: Date.now },
});

export default mongoose.model('Adocao', AdocaoSchema);
