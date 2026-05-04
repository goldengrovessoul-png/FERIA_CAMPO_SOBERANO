import { Router } from 'express';
import { 
  getAllProfiles, getProfileById, updateProfile, deleteUser,
  getCatalogItems, saveCatalogItem, updateCatalogItem, deleteCatalogItem,
  getVulnerabilities, saveVulnerability, deleteVulnerability
} from '../controllers/adminController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Perfiles
router.get('/profiles', getAllProfiles);
router.get('/profiles/:id', getProfileById);
router.put('/profiles/:id', updateProfile);
router.delete('/profiles/:id', deleteUser);

// Catálogos
router.get('/catalogs/:type', getCatalogItems);
router.post('/catalogs', saveCatalogItem);
router.put('/catalogs/:id', updateCatalogItem);
router.delete('/catalogs/:id', deleteCatalogItem);

// Vulnerabilidades
router.get('/vulnerabilities', getVulnerabilities);
router.post('/vulnerabilities', saveVulnerability);
router.delete('/vulnerabilities/:id', deleteVulnerability);

export default router;
