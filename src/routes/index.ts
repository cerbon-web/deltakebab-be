import { Router } from 'express';
import authRoutes from './auth';
import restaurantRoutes from './restaurant';
import menuRoutes from './menu';
import orderRoutes from './orders';
import chatRoutes from './chat';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

router.use('/auth', authRoutes);
router.use('/restaurants', restaurantRoutes);
router.use('/menu', menuRoutes);
router.use('/orders', orderRoutes);
router.use('/chat', chatRoutes);

export default router;
