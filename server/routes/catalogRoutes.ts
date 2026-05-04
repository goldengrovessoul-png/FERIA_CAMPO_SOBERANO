import { Router } from 'express';
import { getFullCatalog, getDpa, getEntrepreneurData } from '../controllers/catalogController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/full', authenticateToken, getFullCatalog);
router.get('/dpa', authenticateToken, getDpa);
router.get('/entrepreneurs', authenticateToken, getEntrepreneurData);

export default router;
