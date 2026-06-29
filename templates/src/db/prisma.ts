import { PrismaClient } from '@prisma/client';
import { logger } from '../lib/logger.js';
import { onShutdown } from '../lib/shutdown.js';

export const prisma = new PrismaClient({
  log: [
    { level: 'error', emit: 'event' },
    { level: 'warn', emit: 'event' },
  ],
});

(prisma.$on as (e: string, cb: (e: unknown) => void) => void)('error', (e) =>
  logger.error({ err: e }, 'prisma error')
);
(prisma.$on as (e: string, cb: (e: unknown) => void) => void)('warn', (e) =>
  logger.warn({ e }, 'prisma warn')
);

onShutdown('prisma', async () => {
  await prisma.$disconnect();
  logger.info('prisma disconnected');
});
