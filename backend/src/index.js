import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/database.js";
import { setupSignalingServer } from "./config/signaling.js";
import { migrateSharedWith } from "./utils/migrateSharedWith.js";
import { setupTrashCleanup } from "./utils/trashCleanup.js";
import documentRoutes from "./routes/documentRoutes.js";
import collectionRoutes from "./routes/collectionRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";

// Cargar variables de entorno
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

/**
 * Middlewares globales
 */
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  }),
);
app.use(express.json({ limit: "10mb" })); // Límite aumentado para contenido BlockNote
app.use(express.urlencoded({ extended: true }));

// Servir archivos subidos estáticamente
app.use("/uploads", express.static("uploads"));

/**
 * Rutas de la API
 */
app.use("/api/document", documentRoutes);
app.use("/api/collections", collectionRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/upload", uploadRoutes);

/**
 * Health check endpoint
 * Útil para monitoreo y load balancers
 */
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

/**
 * Manejo de rutas no encontradas (404)
 */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Ruta no encontrada: ${req.method} ${req.originalUrl}`,
  });
});

/**
 * Manejo global de errores
 */
app.use((err, req, res, next) => {
  console.error("Error no manejado:", err);

  // Error de validación de Mongoose
  if (err.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      message: "Error de validación",
      errors: Object.values(err.errors).map((e) => e.message),
    });
  }

  // Error de duplicado (unique index)
  if (err.code === 11000) {
    return res.status(409).json({
      success: false,
      message: "Recurso duplicado",
      field: Object.keys(err.keyValue)[0],
    });
  }

  // Error genérico
  res.status(500).json({
    success: false,
    message: "Error interno del servidor",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

/**
 * Iniciar servidor
 */
const startServer = async () => {
  try {
    // Conectar a MongoDB
    await connectDB();

    // Migrar datos antiguos de sharedWith al nuevo formato [{user, role}]
    await migrateSharedWith();

    // Configurar limpieza automática de papelera (30 días)
    setupTrashCleanup();

    // Iniciar servidor Express
    const server = app.listen(PORT, () => {
      console.log(`Servidor Backend Iniciado Puerto: ${PORT}`);
    });

    // Servidor de señalización WebSocket para Yjs
    setupSignalingServer(server);
    console.log("Servidor de señalización WebSocket iniciado");
  } catch (error) {
    console.error("Error al iniciar servidor:", error);
    process.exit(1);
  }
};

/**
 * Manejo graceful shutdown
 */
process.on("SIGTERM", async () => {
  console.log("SIGTERM recibido. Cerrando servidor...");
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("SIGINT recibido. Cerrando servidor...");
  process.exit(0);
});

// Iniciar
startServer();

export default app;
