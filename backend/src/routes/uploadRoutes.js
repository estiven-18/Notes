import { Router } from "express";
import { uploadFile } from "../controllers/uploadController.js";
import { auth } from "../middleware/auth.js";

const router = Router();

router.use(auth);

router.post("/", uploadFile);

export default router;
