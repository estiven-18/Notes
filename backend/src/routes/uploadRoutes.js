import { Router } from "express";
import { uploadFile } from "../controllers/uploadController.js";
import { auth } from "../middleware/auth.js";

const router = Router();

router.use((req, res, next) => {
  console.log("UPLOAD ROUTE HIT:", req.method, req.originalUrl);
  next();
});

router.use(auth);

router.post("/", uploadFile);

export default router;
