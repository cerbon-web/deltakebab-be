import { PrismaClient } from "@prisma/client";
import { config } from '../config';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (!config.isProduction) {
  globalForPrisma.prisma = prisma;
}

export default prisma;
