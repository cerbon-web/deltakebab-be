import { Router, Request, Response } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import { getRestaurants, getNearestRestaurants, getRestaurantById } from '../services/restaurantService';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import { prisma } from '../database/prisma';
import { config } from '../config';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  const restaurants = await getRestaurants();
  res.json(restaurants);
});

router.get('/nearest', async (req: Request, res: Response) => {
  const { lat, lng } = req.query;
  const restaurants = await getNearestRestaurants(String(lat), String(lng));
  res.json(restaurants);
});

router.get('/:id', async (req: Request, res: Response) => {
  const restaurant = await getRestaurantById(req.params.id);
  res.json(restaurant);
});

// Assign the authenticated user as staff for a branch. Returns updated token+user.
router.post('/assign-branch', authenticate, requireRole(['KITCHEN', 'RESTAURANT_ADMIN', 'SUPER_ADMIN']), async (req: AuthRequest, res: Response) => {
  const { branchId } = req.body as { branchId?: string };
  if (!branchId) {
    res.status(400).json({ status: 'error', message: 'branchId is required' });
    return;
  }

  try {
    await prisma.restaurantStaff.upsert({
      where: { userId_branchId: { userId: req.user!.id, branchId } },
      update: {},
      create: { userId: req.user!.id, branchId }
    });

    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: { roles: { include: { role: true } }, restaurantStaff: true }
    });

    if (!user) {
      res.status(500).json({ status: 'error', message: 'Unable to load user after assignment' });
      return;
    }

    const roleNames = user.roles.map(r => r.role.name);
    const branchIds = (user.restaurantStaff || []).map(s => s.branchId);
    const payload = { id: user.id, roles: roleNames, branchIds };
    const signOptions = { expiresIn: config.jwtExpiresIn } as unknown as jwt.SignOptions;
    const token = jwt.sign(payload, config.jwtSecret as jwt.Secret, signOptions);

    res.json({ token, user: { id: user.id, name: user.name, email: user.email, phone: user.phone, roles: roleNames, branchIds } });
  } catch (err) {
    console.error('assign-branch error', err);
    res.status(500).json({ status: 'error', message: 'Failed to assign branch' });
  }
});

export default router;
