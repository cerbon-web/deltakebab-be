import { Router } from 'express';
import authRoutes from './auth';
import restaurantRoutes from './restaurant';

const router = Router();

router.use('/auth', authRoutes);
router.use('/restaurants', restaurantRoutes);

export default router;
