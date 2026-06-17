import Document from '../models/Document.js';
import Collection from '../models/Collection.js';
import User from '../models/User.js';

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
    const document = await Document.findOneAndDelete({ _id: id, user: req.user._id });
    if (!document) {
      return res.status(404).json({ success: false, message: 'Documento no encontrado' });
    }
    res.json({ success: true, message: 'Documento eliminado' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getNoteById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await canAccessNote(id, req.user._id);
    if (!result) {
      return res.status(404).json({ success: false, message: 'Nota no encontrada' });
    }
    const noteData = result.note.toObject();
    noteData.userRole = result.role;
    res.json({ success: true, data: noteData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateNoteById = async (req, res) => {
  try {
    const { id } = req.params;
    const { content, title, emoji, favorite } = req.body;
    const updateFields = {};
    if (content !== undefined) {
      if (!Array.isArray(content)) {
        return res.status(400).json({ success: false, message: 'El contenido debe ser un array' });
      }
      updateFields.content = content;
    }
    if (title !== undefined) updateFields.title = title;
    if (emoji !== undefined) updateFields.emoji = emoji;
    if (favorite !== undefined) updateFields['metadata.isFavorite'] = favorite;
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
    if (!note.sharedWith) note.sharedWith = [];
    note.sharedWith.push({ user: targetUser._id, role: role || "editor" });
    await note.save();
    const populated = await Document.populate(note, { path: 'sharedWith.user', select: 'name email' });
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
      .select('title emoji collectionId createdAt updatedAt')
      .populate('collectionId', 'name')
      .sort({ updatedAt: -1 });
    const result = notes.map(note => ({
      _id: note._id,
      title: note.title,
      emoji: note.emoji,
      collectionId: note.collectionId?._id,
      collectionName: note.collectionId?.name || 'Sin nombre',
    }));
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getFavorites = async (req, res) => {
  try {
    const favCollections = await Collection.find({ user: req.user._id, isFavorite: true }).select('_id');
    const favColIds = favCollections.map((c) => c._id);
    const notes = await Document.find({
      user: req.user._id,
      'metadata.isFavorite': true,
      collectionId: { $nin: favColIds },
    })
      .select('title emoji collectionId updatedAt')
      .sort({ updatedAt: -1 });
    res.json({ success: true, data: notes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};