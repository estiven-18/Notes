import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import connectDB from "./config/database.js";
import { setupSignalingServer } from "./config/signaling.js";
import { migrateSharedWith } from "./utils/migrateSharedWith.js";
import { setupTrashCleanup } from "./utils/trashCleanup.js";
import documentRoutes from "./routes/documentRoutes.js";
import collectionRoutes from "./routes/collectionRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

const allowedOrigin = (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/$/, "");

const uploadsDir = path.resolve("uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use(
  cors({
    origin: allowedOrigin,
    credentials: true,
  }),
);
app.use(express.json({ limit: "10mb" })); // Límite aumentado para contenido BlockNote
app.use(express.urlencoded({ extended: true }));

app.use("/uploads", express.static("uploads"));


app.use("/api/document", documentRoutes);
app.use("/api/collections", collectionRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/upload", uploadRoutes);


app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Ruta no encontrada: ${req.method} ${req.originalUrl}`,
  });
});


// Manejo de errores global
app.use((err, req, res, next) => {
  console.error("Error no manejado:", err);

  if (err.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      message: "Error de validación",
      errors: Object.values(err.errors).map((e) => e.message),
    });
  }

  if (err.code === 11000) {
    return res.status(409).json({
      success: false,
      message: "Recurso duplicado",
      field: Object.keys(err.keyValue)[0],
    });
  }

  res.status(500).json({
    success: false,
    message: "Error interno del servidor",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});


const startServer = async () => {
  try {
    await connectDB();

    await migrateSharedWith();

    setupTrashCleanup();

    const server = app.listen(PORT, () => {
      console.log(`Servidor Backend Iniciado Puerto: ${PORT}`);
    });

    setupSignalingServer(server);
    console.log("Servidor de señalización WebSocket iniciado");
  } catch (error) {
    console.error("Error al iniciar servidor:", error);
    process.exit(1);
  }
};

process.on("SIGTERM", async () => {
  console.log("SIGTERM recibido. Cerrando servidor...");
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("SIGINT recibido. Cerrando servidor...");
  process.exit(0);
});

startServer();

export default app;
