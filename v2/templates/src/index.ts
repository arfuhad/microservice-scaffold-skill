import 'dotenv/config';
import { env } from './config/env.js';
import { createApp } from './server/http.js';
import { logger } from './lib/logger.js';

async function main() {
  const app = createApp();

  // --- module wire-up (added as you install modules) ----------------------
  // db-mongoose:    await connectMongo();
  // db-pg:          await pingPg();
  // rest:           registerRest(app);
  // graphql:        await registerApollo(app);
  // observability:  registerObservability(app);  // mount before routes
  // ------------------------------------------------------------------------

  const server = app.listen(env.PORT, () => {
    logger.info({ port: env.PORT, env: env.NODE_ENV }, 'service started');
  });

  for (const sig of ['SIGINT', 'SIGTERM'] as const) {
    process.on(sig, () => {
      logger.info({ sig }, 'shutting down');
      server.close(() => process.exit(0));
    });
  }
}

main().catch((err) => {
  logger.error({ err }, 'fatal startup error');
  process.exit(1);
});
