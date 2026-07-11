import Collection from "../models/Collection.js";
import Document from "../models/Document.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";
import crypto from "crypto";

export const getCollections = async (req, res) => {
  try {
    const collections = await Collection.find({ user: req.user._id, isDeleted: false })
      .populate('sharedWith.user', 'name email')
      .sort({ updatedAt: -1 });
    res.json({ success: true, data: collections });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getCollection = async (req, res) => {
  try {
    const { id } = req.params;
    const collection = await Collection.findById(id)
      .populate('sharedWith.user', 'name email');
    if (!collection) {
      return res.status(404).json({ success: false, message: "Colección no encontrada" });
    }
    const isOwner = collection.user.equals(req.user._id);
    const isShared = collection.sharedWith.some((s) => s.user.equals(req.user._id));
    if (!isOwner && !isShared) {
      return res.status(403).json({ success: false, message: "No tienes acceso a esta colección" });
    }
    collection.visitedAt = new Date();
    await collection.save();
    res.json({ success: true, data: collection });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createCollection = async (req, res) => {
  try {
    const { name } = req.body;
    const collection = await Collection.create({ user: req.user._id, name: name ? name.trim() : 'Sin título' });
    res.status(201).json({ success: true, data: collection });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateCollection = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, emoji } = req.body;
    const updateData = { name: name ? name.trim() : 'Sin título' };
    if (emoji !== undefined) updateData.emoji = emoji;
    const collection = await Collection.findOneAndUpdate(
      { _id: id, user: req.user._id },
      updateData,
      { new: true, runValidators: true },
    );
    if (!collection) {
      return res
        .status(404)
        .json({ success: false, message: "Colección no encontrada" });
    }
    res.json({ success: true, data: collection });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteCollection = async (req, res) => {
  try {
    const { id } = req.params;
    const collection = await Collection.findOne({ _id: id, user: req.user._id });
    if (!collection) {
      return res.status(404).json({ success: false, message: "Colección no encontrada" });
    }
    collection.isDeleted = true;
    collection.deletedAt = new Date();
    collection.deletedBy = req.user._id;
    collection.isFavorite = false;
    collection.sharedWith = [];
    await collection.save();
    await Document.updateMany(
      { collectionId: id, isDeleted: false },
      { $set: { isDeleted: true, deletedAt: new Date(), deletedBy: req.user._id, isFavorite: false, sharedWith: [] } }
    );
    res.json({ success: true, message: "Colección movida a la papelera" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const restoreCollection = async (req, res) => {
  try {
    const { id } = req.params;
    const collection = await Collection.findOne({ _id: id, isDeleted: true });
    if (!collection) {
      return res.status(404).json({ success: false, message: "Colección no encontrada en la papelera" });
    }
    collection.isDeleted = false;
    collection.deletedAt = null;
    collection.deletedBy = null;
    collection.isFavorite = false;
    collection.sharedWith = [];
    await collection.save();
    await Document.updateMany(
      { collectionId: id, isDeleted: true },
      { $set: { isDeleted: false, deletedAt: null, deletedBy: null, isFavorite: false, sharedWith: [] } }
    );
    res.json({ success: true, data: collection });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const permanentDeleteCollection = async (req, res) => {
  try {
    const { id } = req.params;
    const collection = await Collection.findOneAndDelete({ _id: id, isDeleted: true });
    if (!collection) {
      return res.status(404).json({ success: false, message: "Colección no encontrada en la papelera" });
    }
    await Document.deleteMany({ collectionId: id });
    res.json({ success: true, message: "Colección eliminada permanentemente" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getNotesByCollection = async (req, res) => {
  try {
    const { id } = req.params;
    const collection = await Collection.findById(id);
    if (!collection) {
      return res.status(404).json({ success: false, message: "Colección no encontrada" });
    }
    const isOwner = collection.user.equals(req.user._id);
    const isShared = collection.sharedWith.some((s) => s.user.equals(req.user._id));
    if (!isOwner && !isShared) {
      return res.status(403).json({ success: false, message: "No tienes acceso a esta colección" });
    }
    const notes = await Document.find({ collectionId: id, isDeleted: false })
      .select("title emoji createdAt updatedAt metadata.isFavorite user isPublic sharedWith")
      .populate("user", "name email")
      .sort({ updatedAt: -1 });
    res.json({ success: true, data: notes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const toggleCollectionFavorite = async (req, res) => {
  try {
    const { id } = req.params;
    const collection = await Collection.findOne({ _id: id, user: req.user._id });
    if (!collection) {
      return res.status(404).json({ success: false, message: "Colección no encontrada" });
    }
    collection.isFavorite = !collection.isFavorite;
    await collection.save();
    await Document.updateMany(
      { collectionId: id, user: req.user._id },
      { $set: { "metadata.isFavorite": collection.isFavorite } },
    );
    res.json({ success: true, data: collection });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const toggleHideFromRecents = async (req, res) => {
  try {
    const { id } = req.params;
    const collection = await Collection.findOne({ _id: id, user: req.user._id });
    if (!collection) {
      return res.status(404).json({ success: false, message: "Colección no encontrada" });
    }
    collection.hiddenFromRecents = !collection.hiddenFromRecents;
    await collection.save();
    res.json({ success: true, data: collection });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getFavoriteCollections = async (req, res) => {
  try {
    const collections = await Collection.find({ user: req.user._id, isFavorite: true, isDeleted: false }).sort({ updatedAt: -1 });
    const result = await Promise.all(
      collections.map(async (col) => {
        const notes = await Document.find({ collectionId: col._id, user: req.user._id, isDeleted: false })
          .select("title emoji createdAt updatedAt metadata.isFavorite")
          .sort({ updatedAt: -1 });
        return { ...col.toObject(), notes };
      }),
    );
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const shareCollection = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, role } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: "Email es requerido" });
    }
    const targetUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (!targetUser) {
      return res.status(404).json({ success: false, message: "Usuario no encontrado" });
    }
    if (targetUser._id.equals(req.user._id)) {
      return res.status(400).json({ success: false, message: "No puedes compartir contigo mismo" });
    }
    const collection = await Collection.findOne({ _id: id, user: req.user._id });
    if (!collection) {
      return res.status(404).json({ success: false, message: "Colección no encontrada" });
    }
    const existingNotif = await Notification.findOne({
      type: "share_invitation",
      from: req.user._id,
      to: targetUser._id,
      collection: id,
      status: "pending",
    });
    if (existingNotif) {
      return res.status(400).json({ success: false, message: "Ya enviaste una invitación a este usuario" });
    }
    if (collection.sharedWith.some((s) => s.user.equals(targetUser._id))) {
      return res.status(400).json({ success: false, message: "Ya está compartida con este usuario" });
    }
    const notification = await Notification.create({
      type: "share_invitation",
      from: req.user._id,
      to: targetUser._id,
      collection: id,
      status: "pending",
      role: role || "editor",
    });
    const populated = await Notification.populate(notification, [
      { path: "from", select: "name email" },
      { path: "collection", select: "name" },
    ]);
    res.json({ success: true, data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const removeShare = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    const collection = await Collection.findOne({ _id: id, user: req.user._id });
    if (!collection) {
      return res.status(404).json({ success: false, message: "Colección no encontrada" });
    }
    collection.sharedWith = collection.sharedWith.filter((s) => !s.user.equals(userId));
    await collection.save();
    await Document.updateMany(
      { collectionId: collection._id },
      { $pull: { sharedWith: { user: userId } } },
    );
    const populated = await Collection.populate(collection, { path: 'sharedWith.user', select: 'name email' });
    res.json({ success: true, data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const changeShareRole = async (req, res) => {
  try {
    const { id, userId } = req.params;
    const { role } = req.body;
    if (!role || !['viewer', 'editor'].includes(role)) {
      return res.status(400).json({ success: false, message: "Rol inválido" });
    }
    const collection = await Collection.findOne({ _id: id, user: req.user._id });
    if (!collection) {
      return res.status(404).json({ success: false, message: "Colección no encontrada" });
    }
    const entry = collection.sharedWith.find((s) => s.user.equals(userId));
    if (!entry) {
      return res.status(404).json({ success: false, message: "Usuario no encontrado en la lista de compartidos" });
    }
    entry.role = role;
    await collection.save();
    await Document.updateMany(
      { collectionId: collection._id, 'sharedWith.user': userId },
      { $set: { 'sharedWith.$.role': role } },
    );
    const populated = await Collection.populate(collection, { path: 'sharedWith.user', select: 'name email' });
    res.json({ success: true, data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getSharedCollections = async (req, res) => {
  try {
    const collections = await Collection.find({ 'sharedWith.user': req.user._id, isDeleted: false })
      .populate('user', 'name email')
      .populate('sharedWith.user', 'name email')
      .sort({ updatedAt: -1 });
    const result = await Promise.all(
      collections.map(async (col) => {
        const notes = await Document.find({ collectionId: col._id, isDeleted: false })
          .select("title emoji createdAt updatedAt metadata.isFavorite")
          .sort({ updatedAt: -1 });
        return { ...col.toObject(), notes, isShared: true };
      }),
    );
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const extractTextFromContent = (content) => {
  if (!Array.isArray(content)) return '';
  return content.flatMap(block => {
    if (block.content && Array.isArray(block.content)) {
      return block.content.map(inline => inline.text || '');
    }
    return [];
  }).join(' ');
};

export const search = async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    if (!q) return res.json({ success: true, data: { collections: [], notes: [] } });

    const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

    const userCollectionIds = await Collection.find({ user: req.user._id, isDeleted: { $ne: true } }).distinct('_id');
    const sharedCollectionIds = await Collection.find({ 'sharedWith.user': req.user._id, isDeleted: { $ne: true } }).distinct('_id');
    const allIds = [...userCollectionIds, ...sharedCollectionIds];

    const matchingCollections = await Collection.find({
      _id: { $in: allIds },
      name: regex,
      isDeleted: { $ne: true }
    }).select('name').lean();

    const allNotes = await Document.find({ collectionId: { $in: allIds }, isDeleted: { $ne: true } })
      .select('title emoji content collectionId coverUrl')
      .populate('collectionId', 'name')
      .lean();

    const matchingNotes = allNotes.filter(note => {
      if (regex.test(note.title)) return true;
      if (note.emoji && regex.test(note.emoji)) return true;
      if (note.content && extractTextFromContent(note.content).match(regex)) return true;
      return false;
    }).map(note => ({
      _id: note._id,
      title: note.title,
      emoji: note.emoji,
      coverUrl: note.coverUrl,
      collectionId: note.collectionId?._id,
      collectionName: note.collectionId?.name || 'Sin nombre',
    }));

    res.json({
      success: true,
      data: {
        collections: matchingCollections.map(c => ({ _id: c._id, name: c.name })),
        notes: matchingNotes,
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, emoji } = req.body;
    const collection = await Collection.findById(id).select('isFavorite sharedWith user isPublic');
    if (!collection) {
      return res.status(404).json({ success: false, message: "Colección no encontrada" });
    }
    if (!collection.user.equals(req.user._id)) {
      return res.status(403).json({ success: false, message: "Solo el propietario puede crear notas en esta colección" });
    }
    const isFavorite = collection.isFavorite || false;
    const sharedWith = (collection.sharedWith || []).map(s => ({ user: s.user, role: s.role }));
    const note = await Document.create({
      user: req.user._id,
      title: title || "Nueva nota",
      emoji: emoji || null,
      collectionId: id,
      isPublic: collection.isPublic || false,
      metadata: { isFavorite },
      sharedWith,
      content: [{ type: "paragraph", content: [], id: "block-" + Date.now() }],
    });
    res.status(201).json({ success: true, data: note });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const publishCollection = async (req, res) => {
  try {
    const { id } = req.params;
    const collection = await Collection.findOne({ _id: id, user: req.user._id });
    if (!collection) {
      return res.status(404).json({ success: false, message: "Colección no encontrada" });
    }
    if (collection.isPublic) {
      return res.status(400).json({ success: false, message: "La colección ya es pública" });
    }
    collection.isPublic = true;
    await collection.save();
    const notes = await Document.find({ collectionId: collection._id, isDeleted: false });
    for (const note of notes) {
      note.isPublic = true;
      if (!note.publicId) note.publicId = crypto.randomUUID().slice(0, 10);
      await note.save();
    }
    res.json({ success: true, data: collection });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const unpublishCollection = async (req, res) => {
  try {
    const { id } = req.params;
    const collection = await Collection.findOne({ _id: id, user: req.user._id });
    if (!collection) {
      return res.status(404).json({ success: false, message: "Colección no encontrada" });
    }
    if (!collection.isPublic) {
      return res.status(400).json({ success: false, message: "La colección no es pública" });
    }
    collection.isPublic = false;
    await collection.save();
    await Document.updateMany(
      { collectionId: collection._id, isDeleted: false },
      { $set: { isPublic: false, publicId: null } }
    );
    res.json({ success: true, data: collection });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
