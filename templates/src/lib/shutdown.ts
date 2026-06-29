import { logger } from './logger.js';

type Handler = () => Promise<void> | void;

const handlers: Array<{ name: string; fn: Handler }> = [];
let installed = false;
let inFlight = false;

export function onShutdown(name: string, fn: Handler): void {
  handlers.push({ name, fn });
}

export function installShutdown(timeoutMs = 10_000): void {
  if (installed) return;
  installed = true;

  const run = async (sig: string) => {
    if (inFlight) return;
    inFlight = true;
    logger.info({ sig }, 'shutdown started');

    const deadline = setTimeout(() => {
      logger.error({ timeoutMs }, 'shutdown timed out, forcing exit');
      process.exit(1);
    }, timeoutMs);
    deadline.unref();

    let code = 0;
    for (const { name, fn } of [...handlers].reverse()) {
      try {
        await fn();
        logger.info({ name }, 'shutdown step ok');
      } catch (err) {
        logger.error({ name, err }, 'shutdown step failed');
        code = 1;
      }
    }
    clearTimeout(deadline);
    process.exit(code);
  };

  process.on('SIGINT', () => void run('SIGINT'));
  process.on('SIGTERM', () => void run('SIGTERM'));
}
