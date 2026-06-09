import { Router } from 'express';
import {
  getDocument,
  updateDocument,
  createDocument,
  deleteDocument
} from '../controllers/documentController.js';

const router = Router();

/**
 * Rutas de Documentos
 * 
 * Base path: /api/document
 * 
 * Fase actual: Solo un documento de prueba
 * Futuro: /api/workspaces/:workspaceId/documents
 */

// Obtener documento de prueba (crea uno si no existe)
router.get('/', getDocument);

// Actualizar contenido del documento (autosave)
router.put('/', updateDocument);

// Crear nuevo documento (para futuro)
router.post('/', createDocument);

// Eliminar documento (para futuro)
router.delete('/:id', deleteDocument);

export default router;