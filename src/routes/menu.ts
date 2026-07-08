import { Router } from 'express';
import { menuController } from '../controllers/menuController';

const router = Router();

router.get('/:branchId', menuController);

export default router;
