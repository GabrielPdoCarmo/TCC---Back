import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Caminho do diretório de destino
const uploadDir = path.join(__dirname, 'images');

// Verifica se a pasta existe. Se não, cria.
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

export const upload = multer({ storage });
