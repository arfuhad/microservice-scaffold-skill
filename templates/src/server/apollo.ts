import express, { type Express } from 'express';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import cors from 'cors';
import { env } from '../config/env.js';
import { typeDefs } from '../graphql/schema.js';
import { resolvers } from '../graphql/resolvers.js';

export interface GraphQLContext {
  userId?: string;
  roles?: string[];
}

type AuthExtractor = (req: express.Request) => GraphQLContext;

const defaultExtractor: AuthExtractor = () => ({});

export async function registerApollo(
  app: Express,
  opts: { path?: string; extractAuth?: AuthExtractor } = {}
): Promise<void> {
  const path = opts.path ?? '/graphql';
  const extractAuth = opts.extractAuth ?? defaultExtractor;

  const server = new ApolloServer<GraphQLContext>({
    typeDefs,
    resolvers,
    introspection: env.NODE_ENV !== 'production',
  });
  await server.start();

  const origin = env.CORS_ORIGIN
    ? env.CORS_ORIGIN.split(',').map((s) => s.trim())
    : env.NODE_ENV === 'production'
      ? false
      : true;

  app.use(
    path,
    cors<cors.CorsRequest>({ origin, credentials: true }),
    express.json({ limit: '1mb' }),
    expressMiddleware(server, {
      context: async ({ req }) => extractAuth(req),
    })
  );
}
