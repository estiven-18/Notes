import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";

console.log("Cloudinary config:", {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME ? "SET" : "MISSING",
  api_key: process.env.CLOUDINARY_API_KEY ? "SET" : "MISSING",
  api_secret: process.env.CLOUDINARY_API_SECRET ? "SET" : "MISSING",
});

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "notes-uploads",
    allowed_formats: ["jpg", "jpeg", "png", "gif", "webp", "pdf"],
    resource_type: "auto",
  },
});

const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

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
    console.log("File uploaded:", req.file.path);
    res.json({ success: true, data: { url: req.file.path, filename: req.file.filename } });
  });
};