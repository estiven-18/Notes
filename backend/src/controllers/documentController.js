import Document from '../models/Document.js';

export const getDocument = async (req, res) => {
  try {
    let document = await Document.findOne().sort({ createdAt: 1 });
    if (!document) {
      document = await Document.create({
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
      {},
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
    const document = await Document.findByIdAndDelete(id);
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
    const note = await Document.findById(id);
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
    const { content, title } = req.body;
    const updateFields = {};
    if (content !== undefined) {
      if (!Array.isArray(content)) {
        return res.status(400).json({ success: false, message: 'El contenido debe ser un array' });
      }
      updateFields.content = content;
    }
    if (title !== undefined) updateFields.title = title;
    const note = await Document.findByIdAndUpdate(
      id,
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