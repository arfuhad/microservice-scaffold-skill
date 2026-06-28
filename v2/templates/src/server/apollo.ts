import type { Express } from 'express';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import cors from 'cors';
import bodyParser from 'body-parser';
import { typeDefs } from '../graphql/schema.js';
import { resolvers } from '../graphql/resolvers.js';

export interface GraphQLContext {
  userId?: string;
}

export async function registerApollo(app: Express, path = '/graphql'): Promise<void> {
  const server = new ApolloServer<GraphQLContext>({
    typeDefs,
    resolvers,
    introspection: process.env.NODE_ENV !== 'production',
  });
  await server.start();

  app.use(
    path,
    cors<cors.CorsRequest>(),
    bodyParser.json(),
    expressMiddleware(server, {
      context: async ({ req }) => {
        const auth = req.headers.authorization;
        return { userId: auth ? 'todo-extract-from-jwt' : undefined };
      },
    })
  );
}
