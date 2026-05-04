import { Router } from 'express';
import { login, register, getAdmins } from '../controllers/authController.js';

const router = Router();

router.post('/login', login);
router.post('/register', register);
router.get('/admins', getAdmins);

export default router;
