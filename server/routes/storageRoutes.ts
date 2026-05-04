import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

// Configurar almacenamiento
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

router.post('/upload', upload.single('file'), (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No se subió ningún archivo' });
  }
  
  // Devolver la URL local
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const fileUrl = `${baseUrl}/uploads/${req.file.filename}`;
  
  res.json({ url: fileUrl });
});

export default router;
