import { PrismaClient } from '@prisma/client';
import { env } from './env.js';
import { logger } from './logger.js';

const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.__prisma ??
  new PrismaClient({
    log: env.isDev
      ? [
          { emit: 'event', level: 'query' },
          { emit: 'event', level: 'warn' },
          { emit: 'event', level: 'error' },
        ]
      : [{ emit: 'event', level: 'warn' }, { emit: 'event', level: 'error' }],
  });

if (env.isDev) {
  globalForPrisma.__prisma = prisma;
  prisma.$on('query', (e) => logger.debug(`[prisma] ${e.duration}ms ${e.query}`));
}
prisma.$on('warn', (e) => logger.warn(`[prisma] ${e.message}`));
prisma.$on('error', (e) => logger.error(`[prisma] ${e.message}`));

export async function connectDb() {
  await prisma.$connect();
  logger.info('✅ Database connected');
}
export async function disconnectDb() {
  await prisma.$disconnect();
  logger.info('🛑 Database disconnected');
}
