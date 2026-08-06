import crypto from 'crypto';
import admin from 'firebase-admin';
import { prisma } from '../database/prisma';
import { logger } from '../utils/logger';

const TOKEN_KEY = process.env.FCM_TOKEN_ENCRYPTION_KEY || 'delta-kebab-fcm-token-key-32-bytes!';
const TOKEN_KEY_BYTES = crypto.createHash('sha256').update(TOKEN_KEY).digest();
const IV_LENGTH = 16;

export const buildDeviceRegistrationFingerprint = (token: string) => {
  const normalized = String(token || '').trim();
  return `sha256:${crypto.createHash('sha256').update(normalized).digest('hex')}`;
};

export const getNotificationTitleForOrder = ({ orderNumber, branchName }: { orderNumber?: string; branchName?: string }) => {
  const branchLabel = branchName?.trim() || 'Delta Kebab';
  const orderLabel = orderNumber ? ` #${orderNumber}` : '';
  return `Nowe zamówienie${orderLabel} • ${branchLabel}`;
};

export const encryptToken = (token: string) => {
  const normalized = String(token || '').trim();
  if (!normalized) {
    throw new Error('FCM token is required');
  }

  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', TOKEN_KEY_BYTES, iv);
  const encrypted = Buffer.concat([cipher.update(normalized, 'utf8'), cipher.final()]);
  return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
};

export const decryptToken = (cipherText: string) => {
  if (!cipherText) {
    return '';
  }

  const [ivHex, encryptedHex] = cipherText.split(':', 2);
  if (!ivHex || !encryptedHex) {
    return '';
  }

  try {
    const iv = Buffer.from(ivHex, 'hex');
    const encrypted = Buffer.from(encryptedHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', TOKEN_KEY_BYTES, iv);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decrypted.toString('utf8');
  } catch (error) {
    logger.warn('Unable to decrypt stored FCM token', error);
    return '';
  }
};

export const getFirebaseMessaging = () => {
  if (!admin.apps.length) {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (projectId && clientEmail && privateKey) {
      admin.initializeApp({
        credential: admin.credential.cert({ projectId, clientEmail, privateKey })
      });
    } else {
      logger.warn('Firebase Admin SDK is not configured. Push notifications are disabled.');
      return null;
    }
  }

  return admin.messaging();
};

export const registerDevicePushToken = async ({
  token,
  userId,
  branchId,
  deviceId,
  deviceName,
  platform
}: {
  token: string;
  userId?: string;
  branchId?: string;
  deviceId?: string;
  deviceName?: string;
  platform?: string;
}) => {
  const normalizedToken = String(token || '').trim();
  if (!normalizedToken) {
    throw new Error('FCM token is required');
  }

  const tokenHash = buildDeviceRegistrationFingerprint(normalizedToken);
  const tokenCipher = encryptToken(normalizedToken);
  const registration = await prisma.devicePushToken.upsert({
    where: { tokenHash },
    update: {
      userId: userId || null,
      branchId: branchId || null,
      deviceId: deviceId || null,
      deviceName: deviceName || null,
      platform: platform || null,
      tokenCipher,
      isActive: true,
      lastSeenAt: new Date(),
      revokedAt: null
    },
    create: {
      tokenHash,
      tokenCipher,
      userId: userId || null,
      branchId: branchId || null,
      deviceId: deviceId || null,
      deviceName: deviceName || null,
      platform: platform || null,
      isActive: true,
      lastSeenAt: new Date()
    }
  });

  return registration;
};

export const unregisterDevicePushToken = async ({
  token,
  userId,
  branchId,
  deviceId
}: {
  token?: string;
  userId?: string;
  branchId?: string;
  deviceId?: string;
}) => {
  const candidateHash = token ? buildDeviceRegistrationFingerprint(token) : null;

  const result = await prisma.devicePushToken.updateMany({
    where: {
      ...(candidateHash ? { tokenHash: candidateHash } : {}),
      ...(userId ? { userId } : {}),
      ...(branchId ? { branchId } : {}),
      ...(deviceId ? { deviceId } : {})
    },
    data: {
      isActive: false,
      revokedAt: new Date(),
      lastSeenAt: new Date()
    }
  });

  return result;
};

export const listActiveTokensForBranch = async (branchId: string) => {
  const registrations = await prisma.devicePushToken.findMany({
    where: {
      branchId,
      isActive: true
    }
  });

  return registrations
    .map((registration) => ({
      id: registration.id,
      token: decryptToken(registration.tokenCipher),
      deviceId: registration.deviceId,
      userId: registration.userId
    }))
    .filter((registration) => Boolean(registration.token));
};

export const notifyBranchDevices = async ({
  branchId,
  orderNumber,
  branchName,
  body,
  data = {}
}: {
  branchId: string;
  orderNumber?: string;
  branchName?: string;
  body?: string;
  data?: Record<string, string>;
}) => {
  const devices = await listActiveTokensForBranch(branchId);
  if (!devices.length) {
    return { successCount: 0, failureCount: 0, sentCount: 0 };
  }

  const messaging = getFirebaseMessaging();
  if (!messaging) {
    logger.info('Skipping branch push notification because Firebase is not configured', { branchId });
    return { successCount: 0, failureCount: 0, sentCount: 0, disabled: true };
  }

  const title = getNotificationTitleForOrder({ orderNumber, branchName });
  const payloadBody = body || `Nowe zamówienie #${orderNumber || 'nowe'}`;
  const tokens = devices.map((device) => device.token);

  const response = await messaging.sendEachForMulticast({
    tokens,
    notification: {
      title,
      body: payloadBody
    },
    data: {
      type: 'NEW_ORDER',
      branchId,
      orderNumber: orderNumber || '',
      ...data
    },
    android: {
      priority: 'high',
      notification: {
        channelId: 'kitchen_orders',
        sound: 'default',
        defaultSound: true,
        priority: 'max',
        visibility: 'public',
        title,
        body: payloadBody
      }
    },
    apns: {
      payload: {
        aps: {
          sound: 'default',
          category: 'NEW_ORDER'
        }
      }
    }
  });

  const invalidTokens = response.responses
    .map((entry, index) => ({ index, entry }))
    .filter(({ entry }) => {
      const code = entry.error?.code ?? '';
      const message = entry.error?.message ?? '';
      return code === 'messaging/invalid-registration-token' ||
        code === 'messaging/registration-token-not-registered' ||
        message.toLowerCase().includes('invalid registration token') ||
        message.toLowerCase().includes('not registered');
    })
    .map(({ index }) => tokens[index])
    .filter(Boolean);

  if (invalidTokens.length) {
    await Promise.all(invalidTokens.map(async (invalidToken) => {
      const invalidHash = buildDeviceRegistrationFingerprint(invalidToken);
      await prisma.devicePushToken.updateMany({
        where: { tokenHash: invalidHash },
        data: {
          isActive: false,
          revokedAt: new Date(),
          lastSeenAt: new Date()
        }
      });
    }));

    logger.warn('Removed invalid device push tokens after Firebase delivery failure', {
      branchId,
      invalidCount: invalidTokens.length
    });
  }

  const canonicalIds = Number((response as any)?.canonicalRegistrationTokenCount ?? 0);

  logger.info('Branch notification sent to Firebase', {
    branchId,
    successCount: response.successCount,
    failureCount: response.failureCount,
    canonicalIds,
    invalidCount: invalidTokens.length
  });

  return {
    successCount: response.successCount,
    failureCount: response.failureCount,
    sentCount: response.successCount,
    canonicalIds
  };
};
