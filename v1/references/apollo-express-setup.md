# Apollo Server & Express Setup Guide

This guide describes how to integrate Apollo Server with an Express.js application.

## Prerequisites
- `express`
- `apollo-server-express`
- `graphql`

## Setup Template

```javascript
// server/apolloServer.js
import { ApolloServer, gql } from 'apollo-server-express';
import { typeDefs } from '../graphql/schema';
import { resolvers } from '../graphql/resolvers';

const initApollo = async (app) => {
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: ({ req }) => {
      // Add context logic (e.g., auth tokens)
      return { user: req.user };
    },
    formatError: (err) => {
      // Custom error formatting
      console.error(err);
      return err;
    },
  });

  await server.start();
  server.applyMiddleware({ app, path: '/graphql' });
  console.log(`Apollo Server ready at /graphql`);
};

export default initApollo;
```

## Express Server Integration

```javascript
// server/httpServer.js
import express from 'express';
import initApollo from './apolloServer';
import connectDB from './database';

const startServer = async () => {
  const app = express();
  const PORT = process.env.PORT || 4000;

  // 1. Connect to Database
  await connectDB();

  // 2. Initialize Apollo
  await initApollo(app);

  // 3. Start Express
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
};

startServer();
```

## Best Practices
- **Schema Organization:** Use `@graphql-tools/load-files` and `@graphql-tools/merge` to split your schema into modular files.
- **Context Handling:** Pass common dependencies (db clients, loaders) into the context.
- **Middleware Order:** Apply generic Express middleware (CORS, body-parser) *before* Apollo middleware.
