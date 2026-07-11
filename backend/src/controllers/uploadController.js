import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = process.env.UPLOADS_DIR || path.resolve(__dirname, "..", "..", "uploads");
const useCloudinary = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET,
);

if (useCloudinary) {
  console.log("Cloudinary config:", {
    cloud_name: "SET",
    api_key: "SET",
    api_secret: "SET",
  });

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
} else {
  console.log("Cloudinary config:", {
    cloud_name: "MISSING",
    api_key: "MISSING",
    api_secret: "MISSING",
  });

  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
}

const cloudinaryStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "notes-uploads",
    allowed_formats: ["jpg", "jpeg", "png", "gif", "webp", "pdf"],
    resource_type: "auto",
  },
});

const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const safeName = file.originalname
      .toLowerCase()
      .replace(/[^a-z0-9_.-]+/g, "-")
      .replace(/-+/g, "-");
    cb(null, `${Date.now()}-${safeName}`);
  },
});

const upload = multer({
  storage: useCloudinary ? cloudinaryStorage : diskStorage,
  limits: { fileSize: 50 * 1024 * 1024 },
});

const buildLocalFileUrl = (req, filename) => {
  const baseUrl = `${req.protocol}://${req.get("host")}`;
  return `${baseUrl}/uploads/${filename}`;
};

export const uploadFile = (req, res) => {
  upload.single("file")(req, res, (err) => {
    if (err) {
      console.error("Upload error:", err);
      return res.status(500).json({ success: false, message: err.message });
    }
    if (!req.file) {
      console.error("No file in request");
      return res.status(400).json({ success: false, message: "No file" });
    }

    const url = req.file.path || buildLocalFileUrl(req, req.file.filename);
    console.log("File uploaded:", url);
    res.json({ success: true, data: { url, filename: req.file.filename } });
  });
};