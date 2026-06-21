import { Router } from 'express';
import {
  getCollections,
  getCollection,
  createCollection,
  updateCollection,
  deleteCollection,
  restoreCollection,
  permanentDeleteCollection,
  getNotesByCollection,
  createNote,
  toggleCollectionFavorite,
  getFavoriteCollections,
  shareCollection,
  removeShare,
  changeShareRole,
  getSharedCollections,
  search,
  publishCollection,
  unpublishCollection,
} from '../controllers/collectionController.js';
import { auth } from '../middleware/auth.js';

const router = Router();

router.use(auth);

router.get('/favorites', getFavoriteCollections);
router.get('/shared/with-me', getSharedCollections);
router.get('/search', search);
router.get('/', getCollections);
router.get('/:id', getCollection);
router.post('/', createCollection);
router.put('/:id', updateCollection);
router.delete('/:id', deleteCollection);
router.post('/:id/restore', restoreCollection);
router.post('/:id/permanent', permanentDeleteCollection);
router.get('/:id/notes', getNotesByCollection);
router.post('/:id/notes', createNote);
router.post('/:id/favorite', toggleCollectionFavorite);
router.post('/:id/share', shareCollection);
router.put('/:id/share/:userId', changeShareRole);
router.post('/:id/unshare', removeShare);
router.post('/:id/publish', publishCollection);
router.post('/:id/unpublish', unpublishCollection);

export default router;