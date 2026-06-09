import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Configuración de conexión a MongoDB
 * 
 * Utiliza variables de entorno para la URI de conexión.
 * Maneja eventos de conexión para logging y reconexión automática.
 */

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/notion-clone';

/**
 * Conecta a la base de datos MongoDB
 * @returns {Promise<mongoose.Connection>} Conexión de Mongoose
 */
export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(MONGODB_URI, {
      // Opciones de conexión recomendadas para producción
      maxPoolSize: 10, // Máximo 10 conexiones en el pool
      serverSelectionTimeoutMS: 5000, // Timeout de 5s para selección de servidor
      socketTimeoutMS: 45000, // Timeout de 45s para operaciones
    });

    console.log(`MongoDB conectado: ${conn.connection.host}`);
    
    // Eventos de conexión para monitoreo
    mongoose.connection.on('error', (err) => {
      console.error('Error de conexión MongoDB:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB desconectado. Intentando reconectar...');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('MongoDB reconectado');
    });

    return conn;
  } catch (error) {
    console.error('Error al conectar a MongoDB:', error.message);
    process.exit(1);
  }
};

/**
 * Cierra la conexión a MongoDB de forma limpia
 * Útil para tests y shutdown graceful
 */
export const disconnectDB = async () => {
  await mongoose.connection.close();
  console.log('Conexión MongoDB cerrada');
};

export default connectDB;