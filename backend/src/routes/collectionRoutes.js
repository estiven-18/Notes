import { Router } from 'express';
import {
  getCollections,
  createCollection,
  updateCollection,
  deleteCollection,
  getNotesByCollection,
  createNote,
  toggleCollectionFavorite,
  getFavoriteCollections,
} from '../controllers/collectionController.js';
import { auth } from '../middleware/auth.js';

const router = Router();

router.use(auth);

router.get('/favorites', getFavoriteCollections);
router.get('/', getCollections);
router.post('/', createCollection);
router.put('/:id', updateCollection);
router.delete('/:id', deleteCollection);
router.get('/:id/notes', getNotesByCollection);
router.post('/:id/notes', createNote);
router.post('/:id/favorite', toggleCollectionFavorite);

export default router;