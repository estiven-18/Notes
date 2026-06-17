import multer from "multer";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOADS_DIR = path.resolve(__dirname, "../../uploads");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = crypto.randomUUID();
    cb(null, `${name}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
});

export const uploadFile = (req, res) => {
  upload.single("file")(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({ success: false, message: err.message });
      }
      return res.status(500).json({ success: false, message: "Error al subir archivo" });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No se envió ningún archivo" });
    }
    const protocol = req.protocol;
    const host = req.get("host");
    const url = `${protocol}://${host}/uploads/${req.file.filename}`;
    res.json({ success: true, data: { url, filename: req.file.filename } });
  });
};
