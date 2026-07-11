import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { Readable } from "stream";
import { v2 as cloudinary } from "cloudinary";
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

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
});

const safeFileName = (fileName) => fileName
  .toLowerCase()
  .replace(/[^a-z0-9_.-]+/g, "-")
  .replace(/-+/g, "-");

const buildLocalFileUrl = (req, filename) => {
  const baseUrl = `${req.protocol}://${req.get("host")}`;
  return `${baseUrl}/uploads/${filename}`;
};

const saveLocally = async (req, file) => {
  const localName = `${Date.now()}-${safeFileName(file.originalname)}`;
  const localPath = path.join(uploadsDir, localName);
  await fs.promises.writeFile(localPath, file.buffer);
  return {
    url: buildLocalFileUrl(req, localName),
    filename: localName,
  };
};

const uploadToCloudinary = (file) => new Promise((resolve, reject) => {
  const stream = cloudinary.uploader.upload_stream(
    {
      folder: "notes-uploads",
      resource_type: "auto",
      format: file.mimetype?.split("/")[1],
    },
    (error, result) => {
      if (error) return reject(error);
      return resolve(result);
    },
  );

  Readable.from(file.buffer).pipe(stream);
});

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

    try {
      if (useCloudinary) {
        const result = await uploadToCloudinary(req.file);
        console.log("File uploaded to Cloudinary:", result.secure_url);
        return res.json({
          success: true,
          data: { url: result.secure_url, filename: result.public_id },
        });
      }

      const localFile = await saveLocally(req, req.file);
      console.log("File uploaded locally:", localFile.url);
      return res.json({ success: true, data: localFile });
    } catch (uploadError) {
      console.error("Cloudinary upload failed, falling back to local storage:", uploadError);

      try {
        const localFile = await saveLocally(req, req.file);
        console.log("File uploaded locally after fallback:", localFile.url);
        return res.json({ success: true, data: localFile });
      } catch (fallbackError) {
        console.error("Local upload fallback failed:", fallbackError);
        return res.status(500).json({
          success: false,
          message: "No se pudo subir la imagen",
        });
      }
    }
  });
};