import { Router } from 'express';
import { getBodegas, createBodega, updateBodega, deleteBodega } from '../controllers/bodegaController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/', authenticateToken, getBodegas);
router.post('/', authenticateToken, createBodega);
router.put('/:id', authenticateToken, updateBodega);
router.delete('/:id', authenticateToken, deleteBodega);

export default router;
