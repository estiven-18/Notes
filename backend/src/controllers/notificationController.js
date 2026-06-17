import Notification from "../models/Notification.js";
import Collection from "../models/Collection.js";
import Document from "../models/Document.js";
import User from "../models/User.js";

export const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ to: req.user._id })
      .populate("from", "name email")
      .populate("collection", "name")
      .sort({ createdAt: -1 });
    const unreadCount = notifications.filter((n) => !n.read).length;
    res.json({ success: true, data: { notifications, unreadCount } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const acceptInvitation = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findById(id);
    if (!notification) {
      return res.status(404).json({ success: false, message: "Notificación no encontrada" });
    }
    if (!notification.to.equals(req.user._id)) {
      return res.status(403).json({ success: false, message: "No tienes permiso para aceptar esta invitación" });
    }
    if (notification.status !== "pending") {
      return res.status(400).json({ success: false, message: "La invitación ya fue procesada" });
    }
    const collection = await Collection.findById(notification.collection);
    if (!collection) {
      return res.status(404).json({ success: false, message: "Colección no encontrada" });
    }
    if (collection.sharedWith.some((s) => s.user.equals(req.user._id))) {
      notification.status = "accepted";
      notification.read = true;
      await notification.save();
      return res.json({ success: true, data: notification });
    }
    collection.sharedWith.push({ user: req.user._id, role: notification.role || "editor" });
    await collection.save();
    await Document.updateMany(
      { collectionId: collection._id, 'sharedWith.user': req.user._id },
      { $pull: { sharedWith: { user: req.user._id } } },
    );
    notification.status = "accepted";
    notification.read = true;
    await notification.save();
    await Notification.create({
      type: "invitation_accepted",
      from: req.user._id,
      to: notification.from,
      collection: notification.collection,
    });
    res.json({ success: true, data: notification });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const rejectInvitation = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findById(id);
    if (!notification) {
      return res.status(404).json({ success: false, message: "Notificación no encontrada" });
    }
    if (!notification.to.equals(req.user._id)) {
      return res.status(403).json({ success: false, message: "No tienes permiso para rechazar esta invitación" });
    }
    if (notification.status !== "pending") {
      return res.status(400).json({ success: false, message: "La invitación ya fue procesada" });
    }
    notification.status = "rejected";
    notification.read = true;
    await notification.save();
    res.json({ success: true, data: notification });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { to: req.user._id, read: false },
      { read: true },
    );
    res.json({ success: true, message: "Todas marcadas como leídas" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findOneAndUpdate(
      { _id: id, to: req.user._id },
      { read: true },
      { new: true },
    );
    if (!notification) {
      return res.status(404).json({ success: false, message: "Notificación no encontrada" });
    }
    res.json({ success: true, data: notification });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
