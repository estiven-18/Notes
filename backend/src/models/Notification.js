import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["share_invitation", "invitation_accepted"],
    required: true,
  },
  from: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  to: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  collection: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Collection",
  },
  document: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Document",
  },
  role: {
    type: String,
    enum: ["viewer", "editor"],
    default: "editor",
  },
  status: {
    type: String,
    enum: ["pending", "accepted", "rejected"],
    default: "pending",
  },
  read: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;
