import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth';
import { exportDatabaseController, importDatabaseController, resetDatabaseController } from '../controllers/adminController';

const router = Router();

router.use(authenticate, requireAdmin);
router.post('/db/reset', resetDatabaseController);
router.get('/db/export', exportDatabaseController);
router.post('/db/import', importDatabaseController);

export default router;
