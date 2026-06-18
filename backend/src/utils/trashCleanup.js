import cron from 'node-cron';
import Document from '../models/Document.js';
import Collection from '../models/Collection.js';

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export const setupTrashCleanup = () => {
  cron.schedule('0 0 * * *', async () => {
    try {
      const cutoff = new Date(Date.now() - THIRTY_DAYS_MS);
      const deletedNotes = await Document.deleteMany({ isDeleted: true, deletedAt: { $lte: cutoff } });
      const deletedCollections = await Collection.deleteMany({ isDeleted: true, deletedAt: { $lte: cutoff } });
      console.log(`[Trash Cleanup] Eliminados ${deletedNotes.deletedCount} notas y ${deletedCollections.deletedCount} colecciones permanentemente`);
    } catch (error) {
      console.error('[Trash Cleanup] Error:', error.message);
    }
  });
};
