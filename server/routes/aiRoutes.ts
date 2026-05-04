import { Router } from 'express';
import { chatWithAi, executeAiSql } from '../controllers/aiController.js';
import { authenticateToken, authorizeRoles } from '../middleware/authMiddleware.js';

const router = Router();

// Solo ADMIN y JEFE pueden usar la IA
router.post('/chat', authenticateToken, authorizeRoles('ADMIN', 'JEFE'), chatWithAi);
router.post('/execute-sql', authenticateToken, authorizeRoles('ADMIN', 'JEFE'), executeAiSql);

export default router;
