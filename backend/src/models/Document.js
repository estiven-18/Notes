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
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    default: 'Documento sin título',
    trim: true
  },
  
  content: {
    type: mongoose.Schema.Types.Mixed,
    default: []
  },

  collectionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Collection',
    default: null
  },

  emoji: {
    type: String,
    default: null
  },

  sharedWith: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    role: { type: String, enum: ['viewer', 'editor'], default: 'editor' }
  }],

  metadata: {
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      default: null
    },
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document',
      default: null
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    isFavorite: {
      type: Boolean,
      default: false
    },
    tags: [{
      type: String,
      trim: true
    }]
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

documentSchema.index({ collectionId: 1 });
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