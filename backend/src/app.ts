import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './modules/auth/routes';
import subjectRoutes from './modules/subjects/routes';
import progressRoutes from './modules/progress/routes';

const app = express();

// Middleware
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser tools (curl, Postman) and server-to-server requests.
      if (!origin) {
        callback(null, true);
        return;
      }

      const isConfiguredOrigin = origin === env.FRONTEND_URL;
      const isLocalDevOrigin = /^http:\/\/localhost:\d+$/.test(origin) || /^http:\/\/127\.0\.0\.1:\d+$/.test(origin);

      if (isConfiguredOrigin || isLocalDevOrigin) {
        callback(null, true);
        return;
      }

      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/progress', progressRoutes);

// Error handler
app.use(errorHandler);

export default app;
