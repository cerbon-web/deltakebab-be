import { Router } from 'express';
import { menuController } from '../controllers/menuController';

const router = Router();

router.get('/:restaurantId', menuController);

export default router;
