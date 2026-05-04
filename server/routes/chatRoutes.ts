import { Router } from 'express';
import { getMessages, sendMessage } from '../controllers/chatController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/', authenticateToken, getMessages);
router.post('/', authenticateToken, sendMessage);

export default router;
