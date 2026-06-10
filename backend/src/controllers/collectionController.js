import Collection from "../models/Collection.js";
import Document from "../models/Document.js";

export const getCollections = async (req, res) => {
  try {
    const collections = await Collection.find().sort({ updatedAt: -1 });
    res.json({ success: true, data: collections });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createCollection = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "El nombre es requerido" });
    }
    const collection = await Collection.create({ name: name.trim() });
    res.status(201).json({ success: true, data: collection });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateCollection = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "El nombre es requerido" });
    }
    const collection = await Collection.findByIdAndUpdate(
      id,
      { name: name.trim() },
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
    await Document.deleteMany({ collectionId: id });
    await Collection.findByIdAndDelete(id);
    res.json({ success: true, message: "Colección eliminada" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getNotesByCollection = async (req, res) => {
  try {
    const { id } = req.params;
    const notes = await Document.find({ collectionId: id })
      .select("title emoji createdAt updatedAt")
      .sort({ updatedAt: -1 });
    res.json({ success: true, data: notes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, emoji } = req.body;
    const note = await Document.create({
      title: title || "Nueva nota",
      emoji: emoji || null,
      collectionId: id,
      content: [{ type: "paragraph", content: [], id: "block-" + Date.now() }],
    });
    res.status(201).json({ success: true, data: note });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
