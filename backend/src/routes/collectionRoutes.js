import { Router } from 'express';
import {
  getCollections,
  createCollection,
  updateCollection,
  deleteCollection,
  getNotesByCollection,
  createNote
} from '../controllers/collectionController.js';

const router = Router();

router.get('/', getCollections);
router.post('/', createCollection);
router.put('/:id', updateCollection);
router.delete('/:id', deleteCollection);
router.get('/:id/notes', getNotesByCollection);
router.post('/:id/notes', createNote);

export default router;