import Document from '../models/Document.js';
import Collection from '../models/Collection.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';

const canAccessNote = async (noteId, userId) => {
  const note = await Document.findById(noteId);
  if (!note) return null;
  if (note.user.equals(userId)) return { note, role: 'owner' };
  if (note.collectionId) {
    const collection = await Collection.findById(note.collectionId);
    if (collection) {
      const entry = collection.sharedWith.find((s) => s.user.equals(userId));
      if (entry) return { note, role: entry.role };
    }
  }
  if (note.sharedWith) {
    const entry = note.sharedWith.find((s) => s.user.equals(userId));
    if (entry) return { note, role: entry.role };
  }
  return null;
};

export const getDocument = async (req, res) => {
  try {
    let document = await Document.findOne({ user: req.user._id }).sort({ createdAt: 1 });
    if (!document) {
      document = await Document.create({
        user: req.user._id,
        title: 'Mi Primer Documento',
        content: [{ type: 'paragraph', content: [], id: 'block-' + Date.now() }]
      });
    }
    res.json({ success: true, data: document });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateDocument = async (req, res) => {
  try {
    const { content, title } = req.body;
    if (!content || !Array.isArray(content)) {
      return res.status(400).json({ success: false, message: 'El contenido debe ser un array' });
    }
    const document = await Document.findOneAndUpdate(
      { user: req.user._id },
      { content, ...(title && { title }) },
      { new: true, runValidators: true, upsert: true }
    );
    res.json({ success: true, data: document });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createDocument = async (req, res) => {
  try {
    const { title, content } = req.body;
    const document = await Document.create({
      user: req.user._id,
      title: title || 'Nuevo Documento',
      content: content || [{ type: 'paragraph', content: [], id: 'block-' + Date.now() }]
    });
    res.status(201).json({ success: true, data: document });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const document = await Document.findOne({ _id: id, user: req.user._id });
    if (!document) {
      return res.status(404).json({ success: false, message: 'Documento no encontrado' });
    }
    document.isDeleted = true;
    document.deletedAt = new Date();
    document.deletedBy = req.user._id;
    document.isFavorite = false;
    document.sharedWith = [];
    await document.save();
    res.json({ success: true, message: 'Documento movido a la papelera' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const restoreDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const document = await Document.findOne({ _id: id, isDeleted: true });
    if (!document) {
      return res.status(404).json({ success: false, message: 'Documento no encontrado en la papelera' });
    }
    if (document.collectionId && document.collectionId != null) {
      const parentCollection = await Collection.findOne({ _id: document.collectionId, isDeleted: true });
      if (parentCollection) {
        return res.status(400).json({ success: false, message: 'Restaura la colección para recuperar esta nota' });
      }
    }
    document.isDeleted = false;
    document.deletedAt = null;
    document.deletedBy = null;
    document.isFavorite = false;
    document.sharedWith = [];
    await document.save();
    res.json({ success: true, data: document });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const permanentDeleteDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const document = await Document.findOneAndDelete({ _id: id, isDeleted: true });
    if (!document) {
      return res.status(404).json({ success: false, message: 'Documento no encontrado en la papelera' });
    }
    res.json({ success: true, message: 'Documento eliminado permanentemente' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getNoteById = async (req, res) => {
  try {
    const { id } = req.params;
    const note = await Document.findById(id).populate('user', 'name email').populate('lastUpdatedBy', 'name email').populate('deletedBy', 'name').populate('sharedWith.user', 'name email');
    if (!note) {
      return res.status(404).json({ success: false, message: 'Nota no encontrada' });
    }
    if (note.isDeleted) {
      return res.json({ success: true, data: { ...note.toObject(), userRole: 'trashed', isDeleted: true, deletedAt: note.deletedAt, deletedByName: note.deletedBy?.name } });
    }
    const result = await canAccessNote(id, req.user._id);
    if (!result) {
      return res.status(404).json({ success: false, message: 'Nota no encontrada' });
    }
    const noteData = note.toObject();
    noteData.userRole = result.role;
    if (note.collectionId) {
      const collection = await Collection.findById(note.collectionId).populate('sharedWith.user', 'name email');
      if (collection && collection.sharedWith && collection.sharedWith.length > 0) {
        noteData.collectionSharedWith = collection.sharedWith;
      }
    }
    res.json({ success: true, data: noteData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateNoteById = async (req, res) => {
  try {
    const { id } = req.params;
    const { content, title, emoji, coverUrl, coverPosition, favorite } = req.body;
    const updateFields = {};
    if (content !== undefined) {
      if (!Array.isArray(content)) {
        return res.status(400).json({ success: false, message: 'El contenido debe ser un array' });
      }
      updateFields.content = content;
    }
    if (title !== undefined) updateFields.title = title;
    if (emoji !== undefined) updateFields.emoji = emoji;
    if (coverUrl !== undefined) updateFields.coverUrl = coverUrl;
    if (coverPosition !== undefined) updateFields.coverPosition = coverPosition;
    if (favorite !== undefined) updateFields['metadata.isFavorite'] = favorite;
    updateFields.lastUpdatedBy = req.user._id;
    const result = await canAccessNote(id, req.user._id);
    if (!result) {
      return res.status(404).json({ success: false, message: 'Nota no encontrada' });
    }
    if (result.role === 'viewer') {
      return res.status(403).json({ success: false, message: 'No tienes permisos de edición en esta nota' });
    }
    const note = await Document.findByIdAndUpdate(
      id,
      updateFields,
      { new: true, runValidators: true }
    );
    res.json({ success: true, data: note });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const toggleFavorite = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await canAccessNote(id, req.user._id);
    if (!result) {
      return res.status(404).json({ success: false, message: 'Nota no encontrada' });
    }
    const note = result.note;
    note.metadata.isFavorite = !note.metadata.isFavorite;
    await note.save();
    res.json({ success: true, data: note });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const shareNote = async (req, res) => {
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
    const note = await Document.findOne({ _id: id, user: req.user._id });
    if (!note) {
      return res.status(404).json({ success: false, message: "Nota no encontrada" });
    }
    if (note.sharedWith && note.sharedWith.some((s) => s.user.equals(targetUser._id))) {
      return res.status(400).json({ success: false, message: "Ya está compartida con este usuario" });
    }
    const existingNotif = await Notification.findOne({
      type: "share_invitation",
      from: req.user._id,
      to: targetUser._id,
      document: id,
      status: "pending",
    });
    if (existingNotif) {
      return res.status(400).json({ success: false, message: "Ya enviaste una invitación a este usuario" });
    }
    const notification = await Notification.create({
      type: "share_invitation",
      from: req.user._id,
      to: targetUser._id,
      document: id,
      status: "pending",
      role: role || "editor",
    });
    const populated = await Notification.populate(notification, [
      { path: "from", select: "name email" },
      { path: "document", select: "title emoji" },
    ]);
    res.json({ success: true, data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const removeNoteShare = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    const note = await Document.findOne({ _id: id, user: req.user._id });
    if (!note) {
      return res.status(404).json({ success: false, message: "Nota no encontrada" });
    }
    note.sharedWith = (note.sharedWith || []).filter((s) => !s.user.equals(userId));
    await note.save();
    const populated = await Document.populate(note, { path: 'sharedWith.user', select: 'name email' });
    res.json({ success: true, data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const leaveSharedNote = async (req, res) => {
  try {
    const { id } = req.params;
    const note = await Document.findById(id);
    if (!note) {
      return res.status(404).json({ success: false, message: "Nota no encontrada" });
    }
    const isShared = note.sharedWith && note.sharedWith.some((s) => s.user.equals(req.user._id));
    if (!isShared) {
      return res.status(400).json({ success: false, message: "No estás compartido en esta nota" });
    }
    note.sharedWith = note.sharedWith.filter((s) => !s.user.equals(req.user._id));
    if (!note.leftBy) note.leftBy = [];
    if (!note.leftBy.some((u) => u.equals(req.user._id))) {
      note.leftBy.push(req.user._id);
    }
    await note.save();
    res.json({ success: true, data: note });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const changeNoteShareRole = async (req, res) => {
  try {
    const { id, userId } = req.params;
    const { role } = req.body;
    if (!role || !['viewer', 'editor'].includes(role)) {
      return res.status(400).json({ success: false, message: "Rol inválido" });
    }
    const note = await Document.findOne({ _id: id, user: req.user._id });
    if (!note) {
      return res.status(404).json({ success: false, message: "Nota no encontrada" });
    }
    const entry = note.sharedWith.find((s) => s.user.equals(userId));
    if (!entry) {
      return res.status(404).json({ success: false, message: "Usuario no encontrado en la lista de compartidos" });
    }
    entry.role = role;
    await note.save();
    const populated = await Document.populate(note, { path: 'sharedWith.user', select: 'name email' });
    res.json({ success: true, data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getSharedNotes = async (req, res) => {
  try {
    const sharedColIds = await Collection.find({ 'sharedWith.user': req.user._id }).distinct('_id');
    const notes = await Document.find({
      'sharedWith.user': req.user._id,
      collectionId: { $nin: sharedColIds },
    })
      .select('title emoji collectionId createdAt updatedAt lastUpdatedBy')
      .populate('collectionId', 'name')
      .populate('lastUpdatedBy', 'name email')
      .sort({ updatedAt: -1 });
    const result = notes.map(note => ({
      _id: note._id,
      title: note.title,
      emoji: note.emoji,
      collectionId: note.collectionId?._id,
      collectionName: note.collectionId?.name || 'Sin nombre',
      lastUpdatedBy: note.lastUpdatedBy,
    }));
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllNotes = async (req, res) => {
  try {
    const userId = req.user._id;

    const ownedNotes = await Document.find({ user: userId, isDeleted: { $ne: true } })
      .select('title emoji collectionId createdAt updatedAt sharedWith isPublic user metadata')
      .populate('collectionId', 'name emoji sharedWith')
      .populate('user', 'name email')
      .sort({ updatedAt: -1 });

    const sharedColIds = await Collection.find({ 'sharedWith.user': userId }).distinct('_id');

    const sharedNotes = await Document.find({
      'sharedWith.user': userId,
      collectionId: { $nin: sharedColIds },
      isDeleted: { $ne: true },
    })
      .select('title emoji collectionId createdAt updatedAt sharedWith isPublic user')
      .populate('collectionId', 'name emoji sharedWith')
      .populate('user', 'name email')
      .sort({ updatedAt: -1 });

    const notesFromSharedCollections = await Document.find({
      collectionId: { $in: sharedColIds },
      isDeleted: { $ne: true },
    })
      .select('title emoji collectionId createdAt updatedAt sharedWith isPublic user')
      .populate('collectionId', 'name emoji sharedWith')
      .populate('user', 'name email')
      .sort({ updatedAt: -1 });

    const allNotes = [
      ...ownedNotes.map(n => ({ ...n.toObject(), source: 'owned' })),
      ...sharedNotes.map(n => ({ ...n.toObject(), source: 'shared' })),
      ...notesFromSharedCollections.map(n => ({ ...n.toObject(), source: 'shared-collection' })),
    ];

    const seen = new Set();
    const uniqueNotes = allNotes.filter(n => {
      if (seen.has(n._id.toString())) return false;
      seen.add(n._id.toString());
      return true;
    });

    res.json({ success: true, data: uniqueNotes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getFavorites = async (req, res) => {
  try {
    const favCollections = await Collection.find({ user: req.user._id, isFavorite: true, isDeleted: false }).select('_id');
    const favColIds = favCollections.map((c) => c._id);
    const notes = await Document.find({
      $or: [
        { user: req.user._id },
        { 'sharedWith.user': req.user._id },
      ],
      'metadata.isFavorite': true,
      collectionId: { $nin: favColIds },
      isDeleted: false,
    })
      .select('title emoji collectionId updatedAt')
      .sort({ updatedAt: -1 });
    res.json({ success: true, data: notes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getTrashItems = async (req, res) => {
  try {
    const notes = await Document.find({ user: req.user._id, isDeleted: true })
      .select('title emoji deletedAt collectionId')
      .populate('collectionId', 'name isDeleted')
      .sort({ deletedAt: -1 });
    const collections = await Collection.find({ user: req.user._id, isDeleted: true })
      .select('name deletedAt')
      .sort({ deletedAt: -1 });
    const notesWithParentInfo = notes.map(note => {
      const obj = note.toObject();
      obj.parentDeleted = !!(obj.collectionId && obj.collectionId.isDeleted);
      return obj;
    });
    res.json({ success: true, data: { notes: notesWithParentInfo, collections } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const publishNote = async (req, res) => {
  try {
    const { id } = req.params;
    const document = await Document.findOne({ _id: id, user: req.user._id });
    if (!document) {
      return res.status(404).json({ success: false, message: 'Nota no encontrada' });
    }
    if (document.isPublic) {
      return res.status(400).json({ success: false, message: 'La nota ya está publicada' });
    }
    document.isPublic = true;
    document.publicId = crypto.randomUUID().slice(0, 10);
    await document.save();
    res.json({ success: true, data: { publicId: document.publicId, publicUrl: `/public/${document.publicId}` } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const unpublishNote = async (req, res) => {
  try {
    const { id } = req.params;
    const document = await Document.findOne({ _id: id, user: req.user._id });
    if (!document) {
      return res.status(404).json({ success: false, message: 'Nota no encontrada' });
    }
    if (!document.isPublic) {
      return res.status(400).json({ success: false, message: 'La nota no está publicada' });
    }
    document.isPublic = false;
    document.publicId = null;
    await document.save();
    res.json({ success: true, message: 'Nota despublicada' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getPublicNote = async (req, res) => {
  try {
    const { publicId } = req.params;
    const document = await Document.findOne({ publicId, isPublic: true, isDeleted: false })
      .select('title emoji coverUrl coverPosition content publicId updatedAt')
      .populate('user', 'name');
    if (!document) {
      return res.status(404).json({ success: false, message: 'Nota pública no encontrada' });
    }
    res.json({ success: true, data: document });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};