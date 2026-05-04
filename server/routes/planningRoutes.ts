import { Router } from 'express';
import { 
  getPlanning, 
  getPlanningByState, 
  getPlanningByWeek, 
  updatePlanning, 
  createPlanning 
} from '../controllers/planningController.js';
import { authenticateToken, authorizeRoles } from '../middleware/authMiddleware.js';

const router = Router();

// Todas requieren auth
router.use(authenticateToken);

router.get('/', getPlanning);
router.get('/state/:estado', getPlanningByState);
router.get('/state/:estado/week/:periodo', getPlanningByWeek);

router.post('/', authorizeRoles('ADMIN', 'JEFE'), createPlanning);
router.put('/:id', authorizeRoles('ADMIN', 'JEFE'), updatePlanning);

export default router;
