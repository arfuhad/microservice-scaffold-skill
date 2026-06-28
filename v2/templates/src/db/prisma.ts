import { PrismaClient } from '@prisma/client';
import { logger } from '../lib/logger.js';

export const prisma = new PrismaClient({
  log: [
    { level: 'error', emit: 'event' },
    { level: 'warn', emit: 'event' },
  ],
});

// @ts-expect-error pino-style typed events on PrismaClient
prisma.$on('error', (e) => logger.error({ err: e }, 'prisma error'));
// @ts-expect-error
prisma.$on('warn', (e) => logger.warn({ e }, 'prisma warn'));

const close = async () => {
  await prisma.$disconnect();
  logger.info('prisma disconnected');
};
process.on('SIGINT', close);
process.on('SIGTERM', close);
