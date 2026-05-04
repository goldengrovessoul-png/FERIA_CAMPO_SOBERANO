import { Router } from 'express';
import { manageUsers } from '../controllers/userController.js';

const router = Router();

// Esta ruta replica el comportamiento de la función 'manage-users' de Supabase
router.post('/manage', manageUsers);

export default router;
