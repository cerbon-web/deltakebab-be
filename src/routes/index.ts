import { Router } from 'express';
import authRoutes from './auth';
import restaurantRoutes from './restaurant';
import menuRoutes from './menu';
import orderRoutes from './orders';
import chatRoutes from './chat';
import adminRoutes from './admin';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

router.use('/auth', authRoutes);
router.use('/restaurants', restaurantRoutes);
router.use('/menu', menuRoutes);
router.use('/orders', orderRoutes);
router.use('/chat', chatRoutes);
router.use('/admin', adminRoutes);

export default router;
