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
    origin: [
      'https://ai-study-platform-kh4u.vercel.app',
      'https://ai-study-platform-kh4u-git-main-btshivani21-4163s-projects.vercel.app',
      'http://localhost:3000',
      'http://localhost:5173',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
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
