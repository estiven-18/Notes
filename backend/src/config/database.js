import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();



const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/notes';

/**
 * Conecta a la base de datos MongoDB
 * @returns {Promise<mongoose.Connection>} Conexión de Mongoose
 */
export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(MONGODB_URI, {
      maxPoolSize: 10, 
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000, 
    });

    console.log(`MongoDB conectado: ${conn.connection.host}`);
    
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


export const disconnectDB = async () => {
  await mongoose.connection.close();
  console.log('Conexión MongoDB cerrada');
};

export default connectDB;