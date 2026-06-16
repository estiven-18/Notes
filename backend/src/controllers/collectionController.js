import Collection from "../models/Collection.js";
import Document from "../models/Document.js";
import User from "../models/User.js";

export const getCollections = async (req, res) => {
  try {
    const collections = await Collection.find({ user: req.user._id })
      .populate('sharedWith', 'name email')
      .sort({ updatedAt: -1 });
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
    const collection = await Collection.create({ user: req.user._id, name: name.trim() });
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
    const collection = await Collection.findOneAndUpdate(
      { _id: id, user: req.user._id },
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
    const collection = await Collection.findOneAndDelete({ _id: id, user: req.user._id });
    if (!collection) {
      return res.status(404).json({ success: false, message: "Colección no encontrada" });
    }
    await Document.deleteMany({ collectionId: id, user: req.user._id });
    res.json({ success: true, message: "Colección eliminada" });
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
    const isShared = collection.sharedWith.some((uid) => uid.equals(req.user._id));
    if (!isOwner && !isShared) {
      return res.status(403).json({ success: false, message: "No tienes acceso a esta colección" });
    }
    const notes = await Document.find({ collectionId: id })
      .select("title emoji createdAt updatedAt metadata.isFavorite")
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

export const getFavoriteCollections = async (req, res) => {
  try {
    const collections = await Collection.find({ user: req.user._id, isFavorite: true }).sort({ updatedAt: -1 });
    const result = await Promise.all(
      collections.map(async (col) => {
        const notes = await Document.find({ collectionId: col._id, user: req.user._id })
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
    const { email } = req.body;
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
    if (collection.sharedWith.some((uid) => uid.equals(targetUser._id))) {
      return res.status(400).json({ success: false, message: "Ya está compartida con este usuario" });
    }
    collection.sharedWith.push(targetUser._id);
    await collection.save();
    const populated = await Collection.populate(collection, { path: 'sharedWith', select: 'name email' });
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
    collection.sharedWith = collection.sharedWith.filter((uid) => !uid.equals(userId));
    await collection.save();
    const populated = await Collection.populate(collection, { path: 'sharedWith', select: 'name email' });
    res.json({ success: true, data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getSharedCollections = async (req, res) => {
  try {
    const collections = await Collection.find({ sharedWith: req.user._id })
      .populate('user', 'name email')
      .populate('sharedWith', 'name email')
      .sort({ updatedAt: -1 });
    const result = await Promise.all(
      collections.map(async (col) => {
        const notes = await Document.find({ collectionId: col._id })
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

export const createNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, emoji } = req.body;
    const collection = await Collection.findById(id).select('isFavorite sharedWith user');
    if (!collection) {
      return res.status(404).json({ success: false, message: "Colección no encontrada" });
    }
    const isOwner = collection.user.equals(req.user._id);
    const isShared = collection.sharedWith.some((uid) => uid.equals(req.user._id));
    if (!isOwner && !isShared) {
      return res.status(403).json({ success: false, message: "No tienes acceso a esta colección" });
    }
    const isFavorite = collection.isFavorite || false;
    const note = await Document.create({
      user: req.user._id,
      title: title || "Nueva nota",
      emoji: emoji || null,
      collectionId: id,
      metadata: { isFavorite },
      content: [{ type: "paragraph", content: [], id: "block-" + Date.now() }],
    });
    res.status(201).json({ success: true, data: note });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
