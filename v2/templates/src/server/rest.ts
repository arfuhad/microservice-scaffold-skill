import { Router, type Express } from 'express';
import { exampleRouter } from '../routes/example.rest.js';

export function registerRest(app: Express): void {
  const api = Router();
  api.use('/example', exampleRouter);
  app.use('/api', api);
}
