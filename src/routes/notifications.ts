import { Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { prisma } from '../database/prisma';
import { buildErrorResponse } from '../utils/errorResponse';
import { registerDevicePushToken, unregisterDevicePushToken } from '../services/firebaseService';
import { logger } from '../utils/logger';

const router = Router();

router.post('/register-device', authenticate, async (req: AuthRequest, res) => {
  try {
    const { token, branchId, deviceId, deviceName, platform } = req.body ?? {};
    const user = req.user;

    if (!token || typeof token !== 'string') {
      return res.status(400).json(buildErrorResponse({
        code: 'DEVICE_TOKEN_REQUIRED',
        message: 'FCM token is required',
        errors: [{ field: 'token', code: 'DEVICE_TOKEN_REQUIRED' }]
      }));
    }

    if (!branchId || typeof branchId !== 'string') {
      return res.status(400).json(buildErrorResponse({
        code: 'BRANCH_REQUIRED',
        message: 'Branch is required',
        errors: [{ field: 'branchId', code: 'BRANCH_REQUIRED' }]
      }));
    }

    const branch = await prisma.branch.findUnique({ where: { id: branchId } });
    if (!branch) {
      return res.status(404).json(buildErrorResponse({
        code: 'BRANCH_NOT_FOUND',
        message: 'Branch not found',
        errors: [{ field: 'branchId', code: 'BRANCH_NOT_FOUND' }]
      }));
    }

    if (user && !user.roles.includes('SUPER_ADMIN')) {
      const staffAccess = await prisma.restaurantStaff.findFirst({
        where: { userId: user.id, branchId }
      });

      if (!staffAccess) {
        return res.status(403).json(buildErrorResponse({
          code: 'FORBIDDEN',
          message: 'Insufficient permissions for this branch',
          errors: [{ field: 'branchId', code: 'FORBIDDEN' }]
        }));
      }
    }

    const registration = await registerDevicePushToken({
      token,
      userId: user?.id,
      branchId,
      deviceId: typeof deviceId === 'string' ? deviceId : undefined,
      deviceName: typeof deviceName === 'string' ? deviceName : undefined,
      platform: typeof platform === 'string' ? platform : undefined
    });

    logger.info('Device registered for Firebase push notifications', {
      userId: user?.id,
      branchId,
      deviceId,
      isActive: registration.isActive
    });

    return res.json({ status: 'ok', deviceId: registration.deviceId, branchId: registration.branchId });
  } catch (error: any) {
    logger.error('Failed to register device for push notifications', error);
    return res.status(500).json(buildErrorResponse({
      code: 'DEVICE_REGISTRATION_FAILED',
      message: error?.message || 'Unable to register device',
      errors: [{ field: 'token', code: 'DEVICE_REGISTRATION_FAILED' }]
    }));
  }
});

router.post('/unregister-device', authenticate, async (req: AuthRequest, res) => {
  try {
    const { token, branchId, deviceId } = req.body ?? {};
    const user = req.user;

    await unregisterDevicePushToken({
      token: typeof token === 'string' ? token : undefined,
      branchId: typeof branchId === 'string' ? branchId : undefined,
      deviceId: typeof deviceId === 'string' ? deviceId : undefined,
      userId: user?.id
    });

    logger.info('Device unregistered from Firebase push notifications', {
      userId: user?.id,
      branchId,
      deviceId
    });

    return res.json({ status: 'ok', unregistered: true });
  } catch (error: any) {
    logger.error('Failed to unregister device for push notifications', error);
    return res.status(500).json(buildErrorResponse({
      code: 'DEVICE_UNREGISTRATION_FAILED',
      message: error?.message || 'Unable to unregister device',
      errors: [{ field: 'token', code: 'DEVICE_UNREGISTRATION_FAILED' }]
    }));
  }
});

export default router;
