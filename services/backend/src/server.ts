import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { healthRouter } from './routes/health.routes';
import { organizeRouter } from './features/organize/routes';
import { logger } from './shared/utils/logger';
import {
  requestIdMiddleware,
  requestLoggerMiddleware,
  errorLoggerMiddleware,
} from './shared/middleware/request-logger.middleware';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware - Order matters!
app.use(cors());
app.use(express.json());

// Request tracking middleware
app.use(requestIdMiddleware);
app.use(requestLoggerMiddleware);

// Routes
app.use('/health', healthRouter);
app.use('/api/organize', organizeRouter);

// Error logging middleware (must be after routes)
app.use(errorLoggerMiddleware);

// Start server
app.listen(PORT, () => {
  logger.info(`Server started successfully`, {
    context: 'Server',
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
  });
});

export { app };
