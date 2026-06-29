import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate.js';
import { notFound } from '../lib/errors.js';

export const exampleRouter = Router();

const createSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(120),
  }),
});

const idSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
});

const store = new Map<string, { id: string; name: string }>();

exampleRouter.get('/', (_req, res) => {
  res.json([...store.values()]);
});

exampleRouter.post('/', validate(createSchema), (req, res) => {
  const id = crypto.randomUUID();
  const item = { id, name: req.body.name };
  store.set(id, item);
  res.status(201).json(item);
});

exampleRouter.get('/:id', validate(idSchema), (req, res) => {
  const item = store.get(req.params.id);
  if (!item) throw notFound('example not found');
  res.json(item);
});
