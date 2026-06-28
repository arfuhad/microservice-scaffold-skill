---
name: microservice-scaffold
description: Scaffold and configure a Node.js microservice using Express, Apollo Server, and Mongoose or PostgreSQL. Use when starting a new service or standardizing database connections and GraphQL API setups.
---

# Microservice Scaffold

This skill provides procedural guidance and boilerplate for building modern Node.js microservices. It focuses on a clean separation of concerns between the HTTP server, the GraphQL layer, and the database connection.

## Workflows

### 1. Initializing a New Service
When starting a new service, follow the standard folder structure:
- `config/`: Configuration files (DB, Server, etc.)
- `server/`: Server initialization logic (Express, Apollo, Database)
- `services/`: Domain-specific business logic and models
- `graphql/`: Type definitions and resolvers

### 2. Setting up Database Connections
Choose the appropriate database driver based on the project requirements:
- **MongoDB (Mongoose):** See [mongoose-setup.md](references/mongoose-setup.md) for connection logic and re-connection strategies.
- **PostgreSQL (pg):** See [pg-setup.md](references/pg-setup.md) for connection pooling and query patterns.

### 3. Integrating Apollo Server with Express
For building GraphQL APIs, use Apollo Server as a middleware for Express.
- **Setup Guide:** See [apollo-express-setup.md](references/apollo-express-setup.md) for detailed integration steps.

## Core Patterns

### Environment-First Configuration
Always load configuration from environment variables. Use a central `config/index.js` to map these to usable objects.

```javascript
export const config = {
  port: process.env.PORT || 4000,
  isProd: process.env.NODE_ENV === 'production',
  // ...
};
```

### Modular GraphQL
Avoid large, monolithic schema files. Use modular type definitions and resolvers that are merged at runtime using tools like `@graphql-tools/load-files` and `@graphql-tools/merge`.

### Error Handling & Logging
Standardize how errors are caught and logged across all services to ensure consistent observability. See existing `helper/sendErrorResponse.js` patterns for inspiration.

## When to Use
- Creating a new microservice from scratch.
- Refactoring existing connection logic to be more robust (e.g., adding re-connection or pooling).
- Standardizing the integration between Express and Apollo Server.
- Ensuring security best practices (no hardcoded keys) are followed.
