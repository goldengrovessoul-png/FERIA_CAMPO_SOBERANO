import { Router } from 'express';
import { saveReport, getReports, deleteReport, getReportById, getInspectorReports } from '../controllers/reportController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/', authenticateToken, getReports);
router.get('/:id', authenticateToken, getReportById);
router.get('/inspector/:inspectorId', authenticateToken, getInspectorReports);
router.post('/', authenticateToken, saveReport);
router.delete('/:id', authenticateToken, deleteReport);

export default router;
