import { Router } from 'express';
import {
  getDocument,
  updateDocument,
  createDocument,
  deleteDocument,
  getNoteById,
  updateNoteById,
  toggleFavorite,
  getFavorites
} from '../controllers/documentController.js';

const router = Router();

router.get('/', getDocument);
router.put('/', updateDocument);
router.post('/', createDocument);
router.delete('/:id', deleteDocument);

router.get('/favorites/all', getFavorites);
router.post('/:id/favorite', toggleFavorite);
router.get('/:id', getNoteById);
router.put('/:id', updateNoteById);

export default router;