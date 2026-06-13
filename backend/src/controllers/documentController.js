import Document from '../models/Document.js';
import Collection from '../models/Collection.js';

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
    const note = await Document.findOne({ _id: id, user: req.user._id });
    if (!note) {
      return res.status(404).json({ success: false, message: 'Nota no encontrada' });
    }
    res.json({ success: true, data: note });
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
    const note = await Document.findOneAndUpdate(
      { _id: id, user: req.user._id },
      updateFields,
      { new: true, runValidators: true }
    );
    if (!note) {
      return res.status(404).json({ success: false, message: 'Nota no encontrada' });
    }
    res.json({ success: true, data: note });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const toggleFavorite = async (req, res) => {
  try {
    const { id } = req.params;
    const note = await Document.findOne({ _id: id, user: req.user._id });
    if (!note) {
      return res.status(404).json({ success: false, message: 'Nota no encontrada' });
    }
    note.metadata.isFavorite = !note.metadata.isFavorite;
    await note.save();
    res.json({ success: true, data: note });
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