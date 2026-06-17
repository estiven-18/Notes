import Collection from "../models/Collection.js";
import Document from "../models/Document.js";

export const migrateSharedWith = async () => {
  let colCount = 0;
  const cols = await Collection.find({ sharedWith: { $exists: true, $ne: [] } });
  for (const col of cols) {
    let changed = false;
    col.sharedWith = col.sharedWith.map((entry) => {
      if (entry && typeof entry === 'object' && entry.user && entry.role) return entry;
      changed = true;
      const userId = entry ? (entry._id || entry) : entry;
      return { user: userId, role: 'editor' };
    });
    if (changed) { await col.save(); colCount++; }
  }
  if (colCount > 0) console.log(`Migradas ${colCount} colecciones`);

  let docCount = 0;
  const docs = await Document.find({ sharedWith: { $exists: true, $ne: [] } });
  for (const doc of docs) {
    let changed = false;
    doc.sharedWith = doc.sharedWith.map((entry) => {
      if (entry && typeof entry === 'object' && entry.user && entry.role) return entry;
      changed = true;
      const userId = entry ? (entry._id || entry) : entry;
      return { user: userId, role: 'editor' };
    });
    if (changed) { await doc.save(); docCount++; }
  }
  if (docCount > 0) console.log(`Migrados ${docCount} documentos`);
};
