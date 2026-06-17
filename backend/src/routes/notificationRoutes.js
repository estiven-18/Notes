import { Router } from "express";
import {
  getNotifications,
  acceptInvitation,
  rejectInvitation,
  markAllAsRead,
  markAsRead,
} from "../controllers/notificationController.js";
import { auth } from "../middleware/auth.js";

const router = Router();

router.use(auth);

router.get("/", getNotifications);
router.post("/read-all", markAllAsRead);
router.post("/:id/accept", acceptInvitation);
router.post("/:id/reject", rejectInvitation);
router.post("/:id/read", markAsRead);

export default router;
