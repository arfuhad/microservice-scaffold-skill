# Mongoose Connection Guide

This guide describes how to set up a robust MongoDB connection using Mongoose in a Node.js microservice.

## Features
- Environment-based configuration.
- Reconnection logic.
- Connection state logging.
- Support for authenticated URIs.

## Configuration Template

```javascript
// config/database.js
export const mongooseConfig = {
  uri: process.env.MONGO_URI || 'mongodb://localhost:27017/myapp',
  options: {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    authSource: process.env.MONGO_AUTH_SOURCE || 'admin',
    user: process.env.MONGO_USER,
    pass: process.env.MONGO_PASS,
  }
};
```

## Connection Logic

```javascript
// server/database.js
import mongoose from 'mongoose';
import { mongooseConfig } from '../config/database';

const connectDB = async () => {
  try {
    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected. Attempting to reconnect...');
    });

    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });

    await mongoose.connect(mongooseConfig.uri, mongooseConfig.options);
    console.log(`Connected to MongoDB: ${mongooseConfig.uri}`);
  } catch (err) {
    console.error('Failed to connect to MongoDB', err);
    process.exit(1);
  }
};

export default connectDB;
```

## Best Practices
- **Never Hardcode Credentials:** Use `.env` files and environment variables.
- **Connection Events:** Listen to `error`, `disconnected`, and `reconnected` events to monitor health.
- **Graceful Shutdown:** Handle `SIGINT` to close the database connection properly.
