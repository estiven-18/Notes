import { Router } from 'express';
import {
  getDocument,
  updateDocument,
  createDocument,
  deleteDocument,
  getNoteById,
  updateNoteById,
  toggleFavorite,
  getFavorites,
  shareNote,
  removeNoteShare,
  getSharedNotes,
} from '../controllers/documentController.js';
import { auth } from '../middleware/auth.js';

const router = Router();

router.use(auth);

router.get('/', getDocument);
router.put('/', updateDocument);
router.post('/', createDocument);
router.delete('/:id', deleteDocument);

router.get('/shared/with-me', getSharedNotes);
router.get('/favorites/all', getFavorites);
router.post('/:id/favorite', toggleFavorite);
router.post('/:id/share', shareNote);
router.post('/:id/unshare', removeNoteShare);
router.get('/:id', getNoteById);
router.put('/:id', updateNoteById);

export default router;