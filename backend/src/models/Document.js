import mongoose from 'mongoose';

/**
 * Document Model
 * 
 * Almacena el contenido del editor BlockNote en formato JSON.
 * Diseñado para ser extensible para futuras funcionalidades como:
 * - Workspaces (añadir workspaceId)
 * - Páginas anidadas (añadir parentId)
 * - Usuarios (añadir userId)
 * - Favoritos, búsqueda, etc.
 */
const documentSchema = new mongoose.Schema({
  // Título del documento (extraído del primer heading o editable)
  title: {
    type: String,
    default: 'Documento sin título',
    trim: true
  },
  
  // Contenido del editor BlockNote (array de bloques en formato JSON)
  content: {
    type: mongoose.Schema.Types.Mixed,
    default: []
  },
  
  // Metadatos para futuras extensiones
  metadata: {
    // Para futuros workspaces
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      default: null
    },
    // Para futuras páginas anidadas
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document',
      default: null
    },
    // Para futuros usuarios
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    // Para favoritos
    isFavorite: {
      type: Boolean,
      default: false
    },
    // Para búsqueda
    tags: [{
      type: String,
      trim: true
    }]
  },
  
  // Timestamps automáticos
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Índices para consultas futuras
documentSchema.index({ 'metadata.workspaceId': 1 });
documentSchema.index({ 'metadata.parentId': 1 });
documentSchema.index({ 'metadata.createdBy': 1 });
documentSchema.index({ updatedAt: -1 });

// Actualizar updatedAt antes de guardar
documentSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Actualizar updatedAt antes de actualizar
documentSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updatedAt: new Date() });
  next();
});

const Document = mongoose.model('Document', documentSchema);

export default Document;