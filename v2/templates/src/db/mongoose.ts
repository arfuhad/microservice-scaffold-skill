import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { logger } from '../lib/logger.js';

export async function connectMongo(): Promise<typeof mongoose> {
  if (!env.MONGO_URI) {
    throw new Error('MONGO_URI is not set');
  }

  mongoose.connection.on('connected', () => logger.info('mongo connected'));
  mongoose.connection.on('disconnected', () => logger.warn('mongo disconnected'));
  mongoose.connection.on('error', (err) => logger.error({ err }, 'mongo error'));

  await mongoose.connect(env.MONGO_URI, {
    serverSelectionTimeoutMS: 5_000,
  });

  const close = async () => {
    await mongoose.connection.close();
    logger.info('mongo closed');
  };
  process.on('SIGINT', close);
  process.on('SIGTERM', close);

  return mongoose;
}
