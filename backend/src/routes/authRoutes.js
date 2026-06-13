import { Router } from 'express';
import { register, login, verify, updateProfile } from '../controllers/authController.js';
import { auth } from '../middleware/auth.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/verify', auth, verify);
router.put('/profile', auth, updateProfile);

export default router;
