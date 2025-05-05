import multer from 'multer';

// Configurar para armazenar em memória
const storage = multer.memoryStorage();

// Filtro para aceitar apenas imagens
const fileFilter = (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

// Exportar o middleware configurado
export const upload = multer({
  storage: storage, 
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // Limite de 5MB
  }
});