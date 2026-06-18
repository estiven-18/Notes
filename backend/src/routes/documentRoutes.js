import { Router } from 'express';
import {
  getDocument,
  updateDocument,
  createDocument,
  deleteDocument,
  restoreDocument,
  permanentDeleteDocument,
  getNoteById,
  updateNoteById,
  toggleFavorite,
  getFavorites,
  getTrashItems,
  shareNote,
  removeNoteShare,
  changeNoteShareRole,
  getSharedNotes,
  publishNote,
  unpublishNote,
  getPublicNote,
} from '../controllers/documentController.js';
import { auth } from '../middleware/auth.js';

const router = Router();

router.get('/public/:publicId', getPublicNote);

router.use(auth);

router.get('/', getDocument);
router.put('/', updateDocument);
router.post('/', createDocument);
router.delete('/:id', deleteDocument);
router.post('/:id/restore', restoreDocument);
router.post('/:id/permanent', permanentDeleteDocument);

router.get('/shared/with-me', getSharedNotes);
router.get('/favorites/all', getFavorites);
router.get('/trash', getTrashItems);
router.post('/:id/favorite', toggleFavorite);
router.post('/:id/share', shareNote);
router.put('/:id/share/:userId', changeNoteShareRole);
router.post('/:id/unshare', removeNoteShare);
router.post('/:id/publish', publishNote);
router.post('/:id/unpublish', unpublishNote);
router.get('/:id', getNoteById);
router.put('/:id', updateNoteById);

export default router;